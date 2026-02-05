use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

// Signal Wars - AI Agent Prediction Arena
// Fee Structure:
// - Entry fee split: prize_pool_bps% to prize pool, (10000 - prize_pool_bps)% to treasury
// - Lost stakes go to treasury (when prediction is wrong)
// - Treasury can be withdrawn by authority

declare_id!("Gck8TTMDXoqhcXDUYDRzYbBu4shvbAUUrHTBafuGQCSz"); // Devnet deployment

#[program]
pub mod signal_wars {
    use super::*;

    /// Initialize the global arena state with treasury
    pub fn initialize_arena(ctx: Context<InitializeArena>) -> Result<()> {
        let arena = &mut ctx.accounts.arena;
        arena.authority = ctx.accounts.authority.key();
        arena.treasury = ctx.accounts.treasury.key();
        arena.total_seasons = 0;
        arena.total_agents = 0;
        arena.total_fees_collected = 0;
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

    /// Enter a season by paying entry fee (split between prize pool and treasury)
    pub fn enter_season(ctx: Context<EnterSeason>) -> Result<()> {
        let season = &mut ctx.accounts.season;
        let entry = &mut ctx.accounts.season_entry;
        let agent = &mut ctx.accounts.agent;
        let arena = &mut ctx.accounts.arena;
        
        require!(season.status == SeasonStatus::Active, ErrorCode::SeasonNotActive);
        require!(
            Clock::get()?.unix_timestamp < season.end_time,
            ErrorCode::SeasonEnded
        );
        
        // Calculate fee split
        let platform_fee = (season.entry_fee * (10000 - season.prize_pool_bps) as u64) / 10000;
        let prize_contribution = season.entry_fee - platform_fee;
        
        // Transfer entry fee from player
        let transfer_amount = season.entry_fee;
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.player.to_account_info(),
                    to: ctx.accounts.season_vault.to_account_info(),
                },
            ),
            transfer_amount,
        )?;
        
        // Move platform fee to treasury
        if platform_fee > 0 {
            **ctx.accounts.season_vault.to_account_info().lamports.borrow_mut() -= platform_fee;
            **ctx.accounts.treasury.to_account_info().lamports.borrow_mut() += platform_fee;
            arena.total_fees_collected += platform_fee;
        }
        
        entry.season_id = season.id;
        entry.agent = agent.key();
        entry.player = ctx.accounts.player.key();
        entry.score = 0;
        entry.predictions_made = 0;
        entry.predictions_correct = 0;
        entry.rank = 0;
        entry.bump = *ctx.bumps.get("season_entry").unwrap();
        
        season.total_entries += 1;
        season.total_pool += prize_contribution;
        
        emit!(SeasonEntered {
            season_id: season.id,
            agent: agent.key(),
            player: entry.player,
            platform_fee,
            prize_contribution,
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
        
        // Transfer stake to program-owned vault using CPI
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
            stake_amount,
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
    /// Fee structure: Wrong prediction = stake goes to treasury
    pub fn resolve_prediction(
        ctx: Context<ResolvePrediction>,
        was_correct: bool,
    ) -> Result<()> {
        let prediction = &mut ctx.accounts.prediction;
        let agent = &mut ctx.accounts.agent;
        let entry = &mut ctx.accounts.season_entry;
        let arena = &mut ctx.accounts.arena;
        
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
            
            // Return stake to player on correct prediction
            let stake_return = prediction.stake_amount;
            if stake_return > 0 {
                **ctx.accounts.prediction_vault.to_account_info().lamports.borrow_mut() -= stake_return;
                **ctx.accounts.player.to_account_info().lamports.borrow_mut() += stake_return;
            }
        } else {
            // Wrong prediction: stake goes to treasury
            agent.streak = 0;
            let lost_stake = prediction.stake_amount;
            if lost_stake > 0 {
                **ctx.accounts.prediction_vault.to_account_info().lamports.borrow_mut() -= lost_stake;
                **ctx.accounts.treasury.to_account_info().lamports.borrow_mut() += lost_stake;
                arena.total_fees_collected += lost_stake;
            }
        }
        
        emit!(PredictionResolved {
            prediction: prediction.key(),
            agent: agent.key(),
            was_correct,
            score_earned: if was_correct { entry.score } else { 0 },
            stake_transferred: if was_correct { prediction.stake_amount } else { 0 },
        });
        
        Ok(())
    }

    /// Award achievement badge
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

    /// Distribute prizes at season end to top 3 performers
    /// Prize distribution: 1st = 50%, 2nd = 30%, 3rd = 20% of prize pool
    pub fn distribute_prizes(ctx: Context<DistributePrizes>) -> Result<()> {
        let season = &mut ctx.accounts.season;
        let arena = &mut ctx.accounts.arena;
        
        require!(
            Clock::get()?.unix_timestamp >= season.end_time,
            ErrorCode::SeasonNotEnded
        );
        require!(
            season.status == SeasonStatus::Active,
            ErrorCode::InvalidSeasonStatus
        );
        
        let prize_pool = season.total_pool;
        
        // Prize split: 50% / 30% / 20%
        let first_place_prize = prize_pool * 50 / 100;
        let second_place_prize = prize_pool * 30 / 100;
        let third_place_prize = prize_pool * 20 / 100;
        
        // Transfer prizes to winners
        if first_place_prize > 0 && ctx.accounts.first_place.data_len() > 0 {
            **ctx.accounts.season_vault.to_account_info().lamports.borrow_mut() -= first_place_prize;
            **ctx.accounts.first_place.to_account_info().lamports.borrow_mut() += first_place_prize;
        }
        
        if second_place_prize > 0 && ctx.accounts.second_place.data_len() > 0 {
            **ctx.accounts.season_vault.to_account_info().lamports.borrow_mut() -= second_place_prize;
            **ctx.accounts.second_place.to_account_info().lamports.borrow_mut() += second_place_prize;
        }
        
        if third_place_prize > 0 && ctx.accounts.third_place.data_len() > 0 {
            **ctx.accounts.season_vault.to_account_info().lamports.borrow_mut() -= third_place_prize;
            **ctx.accounts.third_place.to_account_info().lamports.borrow_mut() += third_place_prize;
        }
        
        season.status = SeasonStatus::Completed;
        
        emit!(PrizesDistributed {
            season_id: season.id,
            total_pool: prize_pool,
            first_place: first_place_prize,
            second_place: second_place_prize,
            third_place: third_place_prize,
        });
        
        Ok(())
    }

    /// Withdraw accumulated treasury fees (authority only)
    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        let treasury_balance = ctx.accounts.treasury.lamports();
        require!(amount <= treasury_balance, ErrorCode::InsufficientFunds);
        
        **ctx.accounts.treasury.to_account_info().lamports.borrow_mut() -= amount;
        **ctx.accounts.authority.to_account_info().lamports.borrow_mut() += amount;
        
        emit!(TreasuryWithdrawal {
            authority: ctx.accounts.authority.key(),
            amount,
            remaining_balance: treasury_balance - amount,
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
    /// CHECK: Treasury account for fee collection (can be any account)
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
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
    pub arena: Account<'info, Arena>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: Season vault for entry fees
    #[account(
        mut,
        seeds = [b"vault", season.key().as_ref()],
        bump
    )]
    pub season_vault: AccountInfo<'info>,
    /// CHECK: Treasury account for fee collection
    #[account(mut, address = arena.treasury)]
    pub treasury: AccountInfo<'info>,
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
    #[account(
        init,
        payer = player,
        space = 8 + PredictionVault::SIZE,
        seeds = [b"prediction_vault", prediction.key().as_ref()],
        bump
    )]
    pub prediction_vault: Account<'info, PredictionVault>,
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
    pub arena: Account<'info, Arena>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"prediction_vault", prediction.key().as_ref()],
        bump
    )]
    pub prediction_vault: Account<'info, PredictionVault>,
    /// CHECK: Treasury for collecting lost stakes
    #[account(mut, address = arena.treasury)]
    pub treasury: AccountInfo<'info>,
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
    pub arena: Account<'info, Arena>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Season vault holding prize pool
    #[account(
        mut,
        seeds = [b"vault", season.key().as_ref()],
        bump
    )]
    pub season_vault: AccountInfo<'info>,
    /// CHECK: First place winner
    #[account(mut)]
    pub first_place: AccountInfo<'info>,
    /// CHECK: Second place winner
    #[account(mut)]
    pub second_place: AccountInfo<'info>,
    /// CHECK: Third place winner
    #[account(mut)]
    pub third_place: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(mut, has_one = authority)]
    pub arena: Account<'info, Arena>,
    /// CHECK: Treasury account
    #[account(mut, address = arena.treasury)]
    pub treasury: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

// Data structures
#[account]
pub struct Arena {
    pub authority: Pubkey,
    pub treasury: Pubkey,        // Fee collection address
    pub total_seasons: u64,
    pub total_agents: u64,
    pub total_fees_collected: u64,
    pub bump: u8,
}

impl Arena {
    pub const SIZE: usize = 32 + 32 + 8 + 8 + 8 + 1;
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
    pub prize_pool_bps: u16,  // % of entry fee that goes to prize pool
    pub total_entries: u64,
    pub total_pool: u64,      // Prize pool amount
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

#[account]
pub struct PredictionVault {
    pub bump: u8,
}

impl PredictionVault {
    pub const SIZE: usize = 1;
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
    #[msg("Insufficient funds in treasury")]
    InsufficientFunds,
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
    pub platform_fee: u64,
    pub prize_contribution: u64,
}

#[event]
pub struct PredictionSubmitted {
    pub prediction: Pubkey,
    pub agent: Pubkey,
    pub season_id: u64,
    pub stake_amount: u64,
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
    pub stake_transferred: u64,
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
    pub first_place: u64,
    pub second_place: u64,
    pub third_place: u64,
}

#[event]
pub struct TreasuryWithdrawal {
    pub authority: Pubkey,
    pub amount: u64,
    pub remaining_balance: u64,
}
