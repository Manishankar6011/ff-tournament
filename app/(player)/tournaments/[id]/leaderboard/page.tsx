import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Skull, Zap, Crown } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const tournament = await prisma.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  const results = await prisma.result.findMany({
    where: { tournamentId: id },
    include: {
      slot: {
        include: {
          user: { select: { name: true, ffIgn: true, avatarUrl: true } },
        },
      },
    },
    orderBy: [{ pointsEarned: 'desc' }, { kills: 'desc' }],
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <Link href={`/tournaments/${id}`} className="flex items-center gap-2 text-gray-300 mb-2">
          <ArrowLeft className="w-4 h-4" /> Wapas
        </Link>
        <h1 className="text-lg font-black text-white">{tournament.title}</h1>
        <p className="text-xs text-gray-400">Final Leaderboard</p>
      </div>

      <div className="px-4 py-4">
        {results.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Results abhi tak publish nahi hue</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {results.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-6 pt-4">
                {/* 2nd */}
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gray-400/20 border-2 border-gray-400 flex items-center justify-center text-xl">
                    🥈
                  </div>
                  <p className="text-xs font-bold text-gray-300 text-center max-w-16 truncate">
                    {results[1].slot.user.ffIgn}
                  </p>
                  <div className="bg-gray-700/50 border border-gray-600 rounded-t-xl px-4 py-3 text-center h-20 flex flex-col justify-center">
                    <p className="text-lg font-black text-white">#{results[1].rank}</p>
                    <p className="text-xs text-orange-400">{formatCurrency(Number(results[1].prizeWon))}</p>
                  </div>
                </div>

                {/* 1st */}
                <div className="flex flex-col items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <div className="w-14 h-14 rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center text-2xl">
                    🥇
                  </div>
                  <p className="text-xs font-bold text-yellow-400 text-center max-w-16 truncate">
                    {results[0].slot.user.ffIgn}
                  </p>
                  <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-t-xl px-5 py-3 text-center h-28 flex flex-col justify-center">
                    <p className="text-2xl font-black text-yellow-400">🏆</p>
                    <p className="text-sm text-orange-400 font-bold">{formatCurrency(Number(results[0].prizeWon))}</p>
                  </div>
                </div>

                {/* 3rd */}
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-full bg-orange-800/20 border-2 border-orange-800 flex items-center justify-center text-xl">
                    🥉
                  </div>
                  <p className="text-xs font-bold text-gray-300 text-center max-w-16 truncate">
                    {results[2].slot.user.ffIgn}
                  </p>
                  <div className="bg-orange-900/20 border border-orange-800/50 rounded-t-xl px-4 py-3 text-center h-14 flex flex-col justify-center">
                    <p className="text-lg font-black text-white">#{results[2].rank}</p>
                    <p className="text-xs text-orange-400">{formatCurrency(Number(results[2].prizeWon))}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Full Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-white/10 text-xs font-bold text-gray-400 uppercase">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Player</span>
                <span className="col-span-2 text-center">
                  <Skull className="w-3 h-3 inline text-red-400" /> Kills
                </span>
                <span className="col-span-2 text-center">
                  <Zap className="w-3 h-3 inline text-blue-400" /> Points
                </span>
                <span className="col-span-3 text-right">Prize</span>
              </div>

              {results.map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    'grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 last:border-0 items-center',
                    i < 3 ? 'bg-yellow-500/5' : ''
                  )}
                >
                  <span className="col-span-1 text-sm font-bold text-gray-400">
                    {medals[i] || `#${i + 1}`}
                  </span>
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-white truncate">{r.slot.user.ffIgn}</p>
                    <p className="text-xs text-gray-500 truncate">Slot #{r.slot.slotNumber}</p>
                  </div>
                  <p className="col-span-2 text-sm font-bold text-red-400 text-center">💀 {r.kills}</p>
                  <p className="col-span-2 text-sm font-bold text-blue-400 text-center">{r.pointsEarned}</p>
                  <p className={cn('col-span-3 text-sm font-bold text-right', Number(r.prizeWon) > 0 ? 'text-orange-400' : 'text-gray-600')}>
                    {Number(r.prizeWon) > 0 ? formatCurrency(Number(r.prizeWon)) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
