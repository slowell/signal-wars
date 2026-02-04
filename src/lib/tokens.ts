// Comprehensive token list for Signal Wars
export interface Token {
  symbol: string;
  name: string;
  icon: string;
  category: 'major' | 'solana' | 'meme' | 'defi' | 'gaming' | 'ai';
  pythFeed?: string;
}

export const SUPPORTED_TOKENS: Token[] = [
  // Major Cryptocurrencies
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', category: 'major', pythFeed: 'Crypto.BTC/USD' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', category: 'major', pythFeed: 'Crypto.ETH/USD' },
  { symbol: 'SOL', name: 'Solana', icon: '☀️', category: 'solana', pythFeed: 'Crypto.SOL/USD' },
  
  // Solana Ecosystem - DeFi
  { symbol: 'JUP', name: 'Jupiter', icon: '🪐', category: 'defi', pythFeed: 'Crypto.JUP/USD' },
  { symbol: 'JTO', name: 'Jito', icon: '🔷', category: 'defi', pythFeed: 'Crypto.JTO/USD' },
  { symbol: 'PYTH', name: 'Pyth Network', icon: '🔮', category: 'defi', pythFeed: 'Crypto.PYTH/USD' },
  { symbol: 'RAY', name: 'Raydium', icon: '⚡', category: 'defi', pythFeed: 'Crypto.RAY/USD' },
  { symbol: 'ORCA', name: 'Orca', icon: '🐋', category: 'defi', pythFeed: 'Crypto.ORCA/USD' },
  { symbol: 'MNDE', name: 'Marinade', icon: '🥩', category: 'defi', pythFeed: 'Crypto.MNDE/USD' },
  { symbol: 'BLZE', name: 'Blaze', icon: '🔥', category: 'defi', pythFeed: 'Crypto.BLZE/USD' },
  { symbol: 'DRIFT', name: 'Drift', icon: '🌊', category: 'defi', pythFeed: 'Crypto.DRIFT/USD' },
  { symbol: 'KMNO', name: 'Kamino', icon: '🏛️', category: 'defi', pythFeed: 'Crypto.KMNO/USD' },
  { symbol: 'CLORE', name: 'Clore', icon: '⚫', category: 'defi' },
  { symbol: 'VLX', name: 'Velas', icon: '💫', category: 'defi' },
  
  // Solana Ecosystem - Meme Coins
  { symbol: 'BONK', name: 'Bonk', icon: '🐕', category: 'meme', pythFeed: 'Crypto.BONK/USD' },
  { symbol: 'WIF', name: 'Dogwifhat', icon: '🐕‍🦺', category: 'meme', pythFeed: 'Crypto.WIF/USD' },
  { symbol: 'POPCAT', name: 'Popcat', icon: '🐱', category: 'meme', pythFeed: 'Crypto.POPCAT/USD' },
  { symbol: 'MOODENG', name: 'Moo Deng', icon: '🦛', category: 'meme' },
  { symbol: 'GOAT', name: 'Goat', icon: '🐐', category: 'meme' },
  { symbol: 'Pnut', name: 'Peanut', icon: '🥜', category: 'meme' },
  { symbol: 'FARTCOIN', name: 'Fartcoin', icon: '💨', category: 'meme' },
  { symbol: 'ZEREBRO', name: 'Zerebro', icon: '🧠', category: 'meme' },
  { symbol: 'AI16Z', name: 'AI16Z', icon: '🤖', category: 'meme' },
  { symbol: 'LUNC', name: 'Luna Classic', icon: '🌙', category: 'meme' },
  { symbol: 'SHIB', name: 'Shiba Inu', icon: '🦮', category: 'meme', pythFeed: 'Crypto.SHIB/USD' },
  { symbol: 'FLOKI', name: 'Floki', icon: '🐕', category: 'meme', pythFeed: 'Crypto.FLOKI/USD' },
  { symbol: 'MEME', name: 'Memecoin', icon: '🎭', category: 'meme' },
  { symbol: 'GIGA', name: 'Gigachad', icon: '💪', category: 'meme' },
  { symbol: 'TURBO', name: 'Turbo', icon: '🐌', category: 'meme' },
  { symbol: 'BOME', name: 'Book of Meme', icon: '📖', category: 'meme' },
  { symbol: 'SLERF', name: 'Slerf', icon: '🦥', category: 'meme' },
  { symbol: 'MEW', name: 'Mew', icon: '🐱', category: 'meme' },
  { symbol: 'PONKE', name: 'Ponke', icon: '🐒', category: 'meme' },
  
  // AI Tokens
  { symbol: 'TAO', name: 'Bittensor', icon: 'τ', category: 'ai', pythFeed: 'Crypto.TAO/USD' },
  { symbol: 'RNDR', name: 'Render', icon: '🎨', category: 'ai', pythFeed: 'Crypto.RNDR/USD' },
  { symbol: 'NEAR', name: 'NEAR Protocol', icon: '🔷', category: 'ai', pythFeed: 'Crypto.NEAR/USD' },
  { symbol: 'FET', name: 'Fetch.ai', icon: '🤖', category: 'ai', pythFeed: 'Crypto.FET/USD' },
  { symbol: 'GRT', name: 'The Graph', icon: '📊', category: 'ai', pythFeed: 'Crypto.GRT/USD' },
  { symbol: 'AGIX', name: 'SingularityNET', icon: '🧬', category: 'ai' },
  { symbol: 'WLD', name: 'Worldcoin', icon: '👁️', category: 'ai', pythFeed: 'Crypto.WLD/USD' },
  { symbol: 'ARKM', name: 'Arkham', icon: '🔍', category: 'ai' },
  { symbol: 'ENQAI', name: 'EnqAI', icon: '🧠', category: 'ai' },
  { symbol: 'ZIG', name: 'Zignaly', icon: '📈', category: 'ai' },
  
  // Gaming/Metaverse
  { symbol: 'SAND', name: 'The Sandbox', icon: '⏹️', category: 'gaming', pythFeed: 'Crypto.SAND/USD' },
  { symbol: 'MANA', name: 'Decentraland', icon: '🌐', category: 'gaming', pythFeed: 'Crypto.MANA/USD' },
  { symbol: 'AXS', name: 'Axie Infinity', icon: '⚔️', category: 'gaming', pythFeed: 'Crypto.AXS/USD' },
  { symbol: 'GALA', name: 'Gala', icon: '🎮', category: 'gaming', pythFeed: 'Crypto.GALA/USD' },
  { symbol: 'ILV', name: 'Illuvium', icon: '👽', category: 'gaming' },
  { symbol: 'IMX', name: 'Immutable X', icon: '⚡', category: 'gaming' },
  { symbol: 'ENJ', name: 'Enjin Coin', icon: '🎲', category: 'gaming' },
  { symbol: 'GMT', name: 'STEPN', icon: '👟', category: 'gaming' },
  { symbol: 'PRIME', name: 'Echelon Prime', icon: '🔷', category: 'gaming' },
  { symbol: 'YGG', name: 'Yield Guild', icon: '🏰', category: 'gaming' },
  
  // Layer 1/2
  { symbol: 'AVAX', name: 'Avalanche', icon: '❄️', category: 'major', pythFeed: 'Crypto.AVAX/USD' },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡', category: 'major', pythFeed: 'Crypto.MATIC/USD' },
  { symbol: 'ARB', name: 'Arbitrum', icon: '🔷', category: 'major', pythFeed: 'Crypto.ARB/USD' },
  { symbol: 'OP', name: 'Optimism', icon: '🔴', category: 'major', pythFeed: 'Crypto.OP/USD' },
  { symbol: 'BASE', name: 'Base', icon: '🔵', category: 'major' },
  { symbol: 'SUI', name: 'Sui', icon: '💧', category: 'major', pythFeed: 'Crypto.SUI/USD' },
  { symbol: 'APT', name: 'Aptos', icon: '🦀', category: 'major', pythFeed: 'Crypto.APT/USD' },
  { symbol: 'SEI', name: 'Sei', icon: '⚡', category: 'major', pythFeed: 'Crypto.SEI/USD' },
  { symbol: 'INJ', name: 'Injective', icon: '💉', category: 'major', pythFeed: 'Crypto.INJ/USD' },
  { symbol: 'TIA', name: 'Celestia', icon: '⭐', category: 'major', pythFeed: 'Crypto.TIA/USD' },
  { symbol: 'DYM', name: 'Dymension', icon: '🔷', category: 'major' },
  { symbol: 'STRK', name: 'Starknet', icon: '⚡', category: 'major' },
  { symbol: 'DOT', name: 'Polkadot', icon: '⚫', category: 'major', pythFeed: 'Crypto.DOT/USD' },
  { symbol: 'LINK', name: 'Chainlink', icon: '🔗', category: 'major', pythFeed: 'Crypto.LINK/USD' },
  { symbol: 'UNI', name: 'Uniswap', icon: '🦄', category: 'defi', pythFeed: 'Crypto.UNI/USD' },
  { symbol: 'AAVE', name: 'Aave', icon: '👻', category: 'defi', pythFeed: 'Crypto.AAVE/USD' },
  { symbol: 'SNX', name: 'Synthetix', icon: '⚗️', category: 'defi', pythFeed: 'Crypto.SNX/USD' },
  { symbol: 'MKR', name: 'Maker', icon: '🏦', category: 'defi', pythFeed: 'Crypto.MKR/USD' },
  { symbol: 'LDO', name: 'Lido DAO', icon: '🥪', category: 'defi', pythFeed: 'Crypto.LDO/USD' },
  { symbol: 'CRV', name: 'Curve DAO', icon: '🌀', category: 'defi', pythFeed: 'Crypto.CRV/USD' },
  { symbol: 'CVX', name: 'Convex Finance', icon: '💎', category: 'defi' },
  { symbol: 'PENDLE', name: 'Pendle', icon: '🍊', category: 'defi' },
  { symbol: 'LBR', name: 'Lybra Finance', icon: '💎', category: 'defi' },
  
  // Stablecoins (for reference, not trading)
  { symbol: 'USDC', name: 'USD Coin', icon: '💵', category: 'major' },
  { symbol: 'USDT', name: 'Tether', icon: '💲', category: 'major' },
  { symbol: 'DAI', name: 'Dai', icon: '🔷', category: 'major' },
];

// Helper functions
export function getTokenBySymbol(symbol: string): Token | undefined {
  return SUPPORTED_TOKENS.find(t => t.symbol === symbol);
}

export function getTokensByCategory(category: Token['category']): Token[] {
  return SUPPORTED_TOKENS.filter(t => t.category === category);
}

export function getPythSupportedTokens(): Token[] {
  return SUPPORTED_TOKENS.filter(t => t.pythFeed);
}

// Categories for UI
export const TOKEN_CATEGORIES = [
  { id: 'major', label: 'Major', description: 'Top cryptocurrencies by market cap' },
  { id: 'solana', label: 'Solana', description: 'Native Solana ecosystem tokens' },
  { id: 'meme', label: 'Meme', description: 'Community-driven meme coins' },
  { id: 'defi', label: 'DeFi', description: 'Decentralized finance protocols' },
  { id: 'ai', label: 'AI', description: 'Artificial intelligence tokens' },
  { id: 'gaming', label: 'Gaming', description: 'Gaming and metaverse tokens' },
] as const;

// Default popular tokens to show first
export const POPULAR_TOKENS = ['SOL', 'BTC', 'ETH', 'JUP', 'BONK', 'WIF', 'PYTH', 'RNDR', 'TAO', 'POPCAT'];
