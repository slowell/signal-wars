use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

declare_id!("Gck8TTMDXoqhcXDUYDRzYbBu4shvbAUUrHTBafuGQCSz"); // Devnet deployment

#[program]
pub mod signal_wars {
    use super::*;

    /// Initialize the global arena state
    pub fn initialize_arena(ctx: Context<InitializeArena>) -> Result<()> {
        let arena = &mut ctx.accounts.arena;
        arena.authority = ctx.accounts.authority.key();
        arena.total_seasons = 0;
        arena.total_agents = 0;
        arena.bump = *ctx.bumps.get("arena").unwrap();
        Ok(())
    }

    /// Register a new agent
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        endpoint: String,
    ) -> Result<()> {
        require!(name.len() <= 32, ErrorCode::NameTooLong);
        require!(endpoint.len() <= 128, ErrorCode::EndpointTooLong);

        let agent = &mut ctx.accounts.agent;
        let arena = &mut ctx.accounts.arena;
        
        agent.owner = ctx.accounts.owner.key();
        agent.name = name;
        agent.endpoint = endpoint;
        agent.total_predictions = 0;
        agent.correct_predictions = 0;
        agent.streak = 0;
        agent.best_streak = 0;
        agent.rank = Rank::Bronze;
        agent.reputation_score = 0;
        agent.joined_at = Clock::get()?.unix_timestamp;
        agent.bump = *ctx.bumps.get("agent").unwrap();
        
        arena.total_agents += 1;
        
        emit!(AgentRegistered {
            agent: agent.key(),
            name: agent.name.clone(),
            owner: agent.owner,
        });
        
        Ok(())
    }

    /// Create a new season
    pub fn create_season(
        ctx: Context<CreateSeason>,
        entry_fee: u64,
        duration_days: u8,
        prize_pool_bps: u16, // Basis points (e.g., 9000 = 90%)
    ) -> Result<()> {
        require!(prize_pool_bps <= 10000, ErrorCode::InvalidPrizeSplit);
        
        let season = &mut ctx.accounts.season;
        let arena = &mut ctx.accounts.arena;
        
        season.id = arena.total_seasons;
        season.entry_fee = entry_fee;
        season.start_time = Clock::get()?.unix_timestamp;
        season.end_time = season.start_time + (duration_days as i64 * 86400);
        season.prize_pool_bps = prize_pool_bps;
        season.total_entries = 0;
        season.total_pool = 0;
        season.status = SeasonStatus::Active;
        season.bump = *ctx.bumps.get("season").unwrap();
        season.authority = ctx.accounts.authority.key();
        
        arena.total_seasons += 1;
        
        emit!(SeasonCreated {
            season_id: season.id,
            entry_fee,
            start_time: season.start_time,
            end_time: season.end_time,
        });
        
        Ok(())
    }

    /// Enter a season by paying entry fee
    pub fn enter_season(ctx: Context<EnterSeason>) -> Result<()> {
        let season = &mut ctx.accounts.season;
        let entry = &mut ctx.accounts.season_entry;
        let agent = &mut ctx.accounts.agent;
        
        require!(season.status == SeasonStatus::Active, ErrorCode::SeasonNotActive);
        require!(
            Clock::get()?.unix_timestamp < season.end_time,
            ErrorCode::SeasonEnded
        );
        
        // Transfer entry fee to season vault
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.player.to_account_info(),
                    to: ctx.accounts.season_vault.to_account_info(),
                },
            ),
            season.entry_fee,
        )?;
        
        entry.season_id = season.id;
        entry.agent = agent.key();
        entry.player = ctx.accounts.player.key();
        entry.score = 0;
        entry.predictions_made = 0;
        entry.predictions_correct = 0;
        entry.rank = 0;
        entry.bump = *ctx.bumps.get("season_entry").unwrap();
        
        season.total_entries += 1;
        season.total_pool += season.entry_fee;
        
        emit!(SeasonEntered {
            season_id: season.id,
            agent: agent.key(),
            player: entry.player,
        });
        
        Ok(())
    }

    /// Submit a prediction (commit hash)
    pub fn submit_prediction(
        ctx: Context<SubmitPrediction>,
        prediction_hash: [u8; 32],
        stake_amount: u64,
    ) -> Result<()> {
        let season = &ctx.accounts.season;
        require!(season.status == SeasonStatus::Active, ErrorCode::SeasonNotActive);
        
        let prediction = &mut ctx.accounts.prediction;
        let agent = &mut ctx.accounts.agent;
        
        prediction.agent = agent.key();
        prediction.season_id = season.id;
        prediction.prediction_hash = prediction_hash;
        prediction.stake_amount = stake_amount;
        prediction.submitted_at = Clock::get()?.unix_timestamp;
        prediction.status = PredictionStatus::Committed;
        prediction.bump = *ctx.bumps.get("prediction").unwrap();
        
        // Transfer stake
        if stake_amount > 0 {
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    anchor_lang::system_program::Transfer {
                        from: ctx.accounts.player.to_account_info(),
                        to: ctx.accounts.prediction_vault.to_account_info(),
                    },
                ),
                stake_amount,
            )?;
        }
        
        emit!(PredictionSubmitted {
            prediction: prediction.key(),
            agent: agent.key(),
            season_id: season.id,
        });
        
        Ok(())
    }

    /// Reveal prediction and verify
    pub fn reveal_prediction(
        ctx: Context<RevealPrediction>,
        prediction_data: String,
    ) -> Result<()> {
        let prediction = &mut ctx.accounts.prediction;
        require!(
            prediction.status == PredictionStatus::Committed,
            ErrorCode::InvalidPredictionStatus
        );
        
        // Verify hash matches
        let computed_hash = hash(prediction_data.as_bytes());
        require!(
            computed_hash.to_bytes() == prediction.prediction_hash,
            ErrorCode::HashMismatch
        );
        
        prediction.prediction_data = prediction_data;
        prediction.revealed_at = Clock::get()?.unix_timestamp;
        prediction.status = PredictionStatus::Revealed;
        
        emit!(PredictionRevealed {
            prediction: prediction.key(),
            agent: prediction.agent,
        });
        
        Ok(())
    }

    /// Resolve prediction (called by oracle/authority)
    pub fn resolve_prediction(
        ctx: Context<ResolvePrediction>,
        was_correct: bool,
    ) -> Result<()> {
        let prediction = &mut ctx.accounts.prediction;
        let agent = &mut ctx.accounts.agent;
        let entry = &mut ctx.accounts.season_entry;
        
        require!(
            prediction.status == PredictionStatus::Revealed,
            ErrorCode::InvalidPredictionStatus
        );
        
        prediction.was_correct = was_correct;
        prediction.status = PredictionStatus::Resolved;
        prediction.resolved_at = Clock::get()?.unix_timestamp;
        
        agent.total_predictions += 1;
        entry.predictions_made += 1;
        
        if was_correct {
            agent.correct_predictions += 1;
            agent.streak += 1;
            entry.predictions_correct += 1;
            entry.score += calculate_score(prediction.stake_amount, agent.streak);
            
            if agent.streak > agent.best_streak {
                agent.best_streak = agent.streak;
            }
            
            update_rank(agent)?;
        } else {
            agent.streak = 0;
        }
        
        // Return stake + reward if correct
        let stake_return = if was_correct {
            prediction.stake_amount * 2 // Double stake on win
        } else {
            0 // Lose stake on loss
        };
        
        if stake_return > 0 {
            **ctx.accounts.prediction_vault.to_account_info().lamports.borrow_mut() -= stake_return;
            **ctx.accounts.player.to_account_info().lamports.borrow_mut() += stake_return;
        }
        
        emit!(PredictionResolved {
            prediction: prediction.key(),
            agent: agent.key(),
            was_correct,
            score_earned: if was_correct { entry.score } else { 0 },
        });
        
        Ok(())
    }

    /// Award achievement badge (NFT minting logic would go here)
    pub fn award_achievement(
        ctx: Context<AwardAchievement>,
        achievement_type: AchievementType,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        let achievement = &mut ctx.accounts.achievement;
        
        achievement.agent = agent.key();
        achievement.achievement_type = achievement_type;
        achievement.awarded_at = Clock::get()?.unix_timestamp;
        achievement.bump = *ctx.bumps.get("achievement").unwrap();
        
        // Update agent reputation
        agent.reputation_score += match achievement_type {
            AchievementType::FirstWin => 10,
            AchievementType::Streak3 => 25,
            AchievementType::Streak5 => 50,
            AchievementType::Streak10 => 100,
            AchievementType::RankSilver => 15,
            AchievementType::RankGold => 30,
            AchievementType::RankDiamond => 60,
            AchievementType::RankLegend => 100,
        };
        
        emit!(AchievementAwarded {
            agent: agent.key(),
            achievement_type,
        });
        
        Ok(())
    }

    /// Distribute prizes at season end
    pub fn distribute_prizes(ctx: Context<DistributePrizes>) -> Result<()> {
        let season = &mut ctx.accounts.season;
        
        require!(
            Clock::get()?.unix_timestamp >= season.end_time,
            ErrorCode::SeasonNotEnded
        );
        require!(
            season.status == SeasonStatus::Active,
            ErrorCode::InvalidSeasonStatus
        );
        
        season.status = SeasonStatus::Completed;
        
        // Prize distribution logic would go here
        // Top 3 entries get split of prize pool based on prize_pool_bps
        
        emit!(PrizesDistributed {
            season_id: season.id,
            total_pool: season.total_pool,
        });
        
        Ok(())
    }
}

// Helper functions
fn calculate_score(stake: u64, streak: u16) -> u64 {
    let streak_multiplier = 100 + (streak as u64 * 10); // 1.0 + 0.1 per streak
    (stake * streak_multiplier) / 100
}

fn update_rank(agent: &mut Account<Agent>) -> Result<()> {
    let accuracy = if agent.total_predictions > 0 {
        (agent.correct_predictions as u64 * 100) / agent.total_predictions as u64
    } else {
        0
    };
    
    agent.rank = match (accuracy, agent.best_streak, agent.correct_predictions) {
        (acc, _, _) if acc >= 80 && agent.correct_predictions >= 50 => Rank::Legend,
        (acc, streak, _) if acc >= 70 && streak >= 10 => Rank::Diamond,
        (acc, streak, _) if acc >= 60 && streak >= 5 => Rank::Gold,
        (acc, streak, _) if acc >= 50 && streak >= 3 => Rank::Silver,
        _ => Rank::Bronze,
    };
    
    Ok(())
}

// Account structures
#[derive(Accounts)]
pub struct InitializeArena<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Arena::SIZE,
        seeds = [b"arena"],
        bump
    )]
    pub arena: Account<'info, Arena>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Agent::SIZE,
        seeds = [b"agent", owner.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, Agent>,
    #[account(mut)]
    pub arena: Account<'info, Arena>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateSeason<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Season::SIZE,
        seeds = [b"season", arena.total_seasons.to_le_bytes().as_ref()],
        bump
    )]
    pub season: Account<'info, Season>,
    #[account(mut)]
    pub arena: Account<'info, Arena>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EnterSeason<'info> {
    #[account(mut)]
    pub season: Account<'info, Season>,
    #[account(
        init,
        payer = player,
        space = 8 + SeasonEntry::SIZE,
        seeds = [b"entry", season.key().as_ref(), agent.key().as_ref()],
        bump
    )]
    pub season_entry: Account<'info, SeasonEntry>,
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: Season vault for entry fees
    #[account(
        mut,
        seeds = [b"vault", season.key().as_ref()],
        bump
    )]
    pub season_vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitPrediction<'info> {
    #[account(mut)]
    pub season: Account<'info, Season>,
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    #[account(
        init,
        payer = player,
        space = 8 + Prediction::SIZE,
        seeds = [b"prediction", agent.key().as_ref(), season.key().as_ref(), &agent.total_predictions.to_le_bytes()],
        bump
    )]
    pub prediction: Account<'info, Prediction>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: Vault for prediction stakes
    #[account(
        mut,
        seeds = [b"prediction_vault", prediction.key().as_ref()],
        bump
    )]
    pub prediction_vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealPrediction<'info> {
    #[account(
        mut,
        constraint = prediction.agent == agent.key()
    )]
    pub prediction: Account<'info, Prediction>,
    pub agent: Account<'info, Agent>,
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolvePrediction<'info> {
    #[account(mut)]
    pub prediction: Account<'info, Prediction>,
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    #[account(mut)]
    pub season_entry: Account<'info, SeasonEntry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Vault for prediction stakes
    #[account(mut)]
    pub prediction_vault: AccountInfo<'info>,
    /// CHECK: Player to receive stake return
    #[account(mut)]
    pub player: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AwardAchievement<'info> {
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    #[account(
        init,
        payer = authority,
        space = 8 + Achievement::SIZE,
        seeds = [b"achievement", agent.key().as_ref(), &(agent.reputation_score as u64).to_le_bytes()],
        bump
    )]
    pub achievement: Account<'info, Achievement>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributePrizes<'info> {
    #[account(mut)]
    pub season: Account<'info, Season>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

// Data structures
#[account]
pub struct Arena {
    pub authority: Pubkey,
    pub total_seasons: u64,
    pub total_agents: u64,
    pub bump: u8,
}

impl Arena {
    pub const SIZE: usize = 32 + 8 + 8 + 1;
}

#[account]
pub struct Agent {
    pub owner: Pubkey,
    pub name: String,        // 32 bytes
    pub endpoint: String,    // 128 bytes
    pub total_predictions: u64,
    pub correct_predictions: u64,
    pub streak: u16,
    pub best_streak: u16,
    pub rank: Rank,
    pub reputation_score: u32,
    pub joined_at: i64,
    pub bump: u8,
}

impl Agent {
    pub const SIZE: usize = 32 + 4 + 32 + 4 + 128 + 8 + 8 + 2 + 2 + 1 + 4 + 8 + 1;
}

#[account]
pub struct Season {
    pub id: u64,
    pub authority: Pubkey,
    pub entry_fee: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub prize_pool_bps: u16,
    pub total_entries: u64,
    pub total_pool: u64,
    pub status: SeasonStatus,
    pub bump: u8,
}

impl Season {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 2 + 8 + 8 + 1 + 1;
}

#[account]
pub struct SeasonEntry {
    pub season_id: u64,
    pub agent: Pubkey,
    pub player: Pubkey,
    pub score: u64,
    pub predictions_made: u64,
    pub predictions_correct: u64,
    pub rank: u16,
    pub bump: u8,
}

impl SeasonEntry {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 2 + 1;
}

#[account]
pub struct Prediction {
    pub agent: Pubkey,
    pub season_id: u64,
    pub prediction_hash: [u8; 32],
    pub prediction_data: String, // Revealed later
    pub stake_amount: u64,
    pub submitted_at: i64,
    pub revealed_at: i64,
    pub resolved_at: i64,
    pub was_correct: bool,
    pub status: PredictionStatus,
    pub bump: u8,
}

impl Prediction {
    pub const SIZE: usize = 32 + 8 + 32 + 4 + 256 + 8 + 8 + 8 + 8 + 1 + 1 + 1;
}

#[account]
pub struct Achievement {
    pub agent: Pubkey,
    pub achievement_type: AchievementType,
    pub awarded_at: i64,
    pub bump: u8,
}

impl Achievement {
    pub const SIZE: usize = 32 + 1 + 8 + 1;
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Rank {
    Bronze,
    Silver,
    Gold,
    Diamond,
    Legend,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SeasonStatus {
    Active,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PredictionStatus {
    Committed,
    Revealed,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AchievementType {
    FirstWin,
    Streak3,
    Streak5,
    Streak10,
    RankSilver,
    RankGold,
    RankDiamond,
    RankLegend,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Name too long")]
    NameTooLong,
    #[msg("Endpoint URL too long")]
    EndpointTooLong,
    #[msg("Invalid prize split percentage")]
    InvalidPrizeSplit,
    #[msg("Season not active")]
    SeasonNotActive,
    #[msg("Season has ended")]
    SeasonEnded,
    #[msg("Season not ended yet")]
    SeasonNotEnded,
    #[msg("Invalid season status")]
    InvalidSeasonStatus,
    #[msg("Invalid prediction status")]
    InvalidPredictionStatus,
    #[msg("Hash mismatch - prediction data doesn't match commitment")]
    HashMismatch,
}

// Events
#[event]
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub name: String,
    pub owner: Pubkey,
}

#[event]
pub struct SeasonCreated {
    pub season_id: u64,
    pub entry_fee: u64,
    pub start_time: i64,
    pub end_time: i64,
}

#[event]
pub struct SeasonEntered {
    pub season_id: u64,
    pub agent: Pubkey,
    pub player: Pubkey,
}

#[event]
pub struct PredictionSubmitted {
    pub prediction: Pubkey,
    pub agent: Pubkey,
    pub season_id: u64,
}

#[event]
pub struct PredictionRevealed {
    pub prediction: Pubkey,
    pub agent: Pubkey,
}

#[event]
pub struct PredictionResolved {
    pub prediction: Pubkey,
    pub agent: Pubkey,
    pub was_correct: bool,
    pub score_earned: u64,
}

#[event]
pub struct AchievementAwarded {
    pub agent: Pubkey,
    pub achievement_type: AchievementType,
}

#[event]
pub struct PrizesDistributed {
    pub season_id: u64,
    pub total_pool: u64,
}
