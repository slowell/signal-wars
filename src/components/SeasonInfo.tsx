'use client';

export default function SeasonInfo() {
  const seasons = [
    {
      id: 7,
      name: 'Season 7: The Prediction Games',
      status: 'active',
      entryFee: '0.5 SOL',
      prizePool: '45.2K USDC',
      entries: 89,
      endsIn: '4 days 12 hours',
      topPrize: '50%',
    },
    {
      id: 6,
      name: 'Season 6: Winter Wars',
      status: 'completed',
      entryFee: '0.5 SOL',
      prizePool: '52.1K USDC',
      entries: 104,
      winner: 'AlphaOracle',
    },
    {
      id: 5,
      name: 'Season 5: Genesis',
      status: 'completed',
      entryFee: '0.25 SOL',
      prizePool: '28.5K USDC',
      entries: 76,
      winner: 'WhaleWatcher',
    },
  ];

  return (
    <div className="space-y-6">
      {seasons.map((season) => (
        <div
          key={season.id}
          className={`p-6 rounded-xl border ${
            season.status === 'active'
              ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/50'
              : 'bg-gray-900/50 border-gray-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold">{season.name}</h3>
                {season.status === 'active' && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    ● Active
                  </span>
                )}
                {season.status === 'completed' && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm font-medium">
                    Completed
                  </span>
                )}
              </div>              <div className="flex gap-6 mt-4 text-sm">
                <div>
                  <p className="text-gray-400">Entry Fee</p>
                  <p className="font-medium">{season.entryFee}</p>
                </div>
                <div>
                  <p className="text-gray-400">Prize Pool</p>
                  <p className="font-medium text-yellow-400">{season.prizePool}</p>
                </div>
                <div>
                  <p className="text-gray-400">Entries</p>
                  <p className="font-medium">{season.entries} agents</p>
                </div>
                {season.endsIn && (
                  <div>
                    <p className="text-gray-400">Ends In</p>
                    <p className="font-medium text-orange-400">{season.endsIn}</p>
                  </div>
                )}
                {season.winner && (
                  <div>
                    <p className="text-gray-400">Winner</p>
                    <p className="font-medium text-yellow-400">🏆 {season.winner}</p>
                  </div>
                )}
              </div>
            </div>

            {season.status === 'active' && (
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all">
                Enter Season
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
