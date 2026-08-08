import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, getModeLabel, getStatusBadgeColor, getStatusLabel, getTimeUntilMatch, getSlotsPercentage, cn } from '@/lib/utils'
import { ArrowLeft, Clock, Users, Trophy, Zap, MapPin, Target, Shield, ChevronRight, Swords } from 'lucide-react'

export const dynamic = 'force-dynamic'
export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      slots: { where: { paymentStatus: 'success' }, select: { id: true } },
    },
  })

  if (!tournament) notFound()

  let dbUser = null
  let hasJoined = false
  if (user) {
    dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (dbUser) {
      hasJoined = await prisma.tournamentSlot.count({
        where: { tournamentId: id, userId: dbUser.id, paymentStatus: 'success' },
      }).then(c => c > 0)
    }
  }

  const slotsPercent = getSlotsPercentage(tournament.slotsFilled, tournament.maxSlots)
  const isFull = tournament.slotsFilled >= tournament.maxSlots
  const prizeDistrib = tournament.prizeDistribution as Record<string, number>
  const pointTable = tournament.pointTable as Record<string, number>

  const canJoin = !isFull && tournament.status === 'upcoming' && !hasJoined && dbUser

  return (
    <div className="min-h-screen pb-24">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-white w-fit">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Wapas Jao</span>
        </Link>
      </div>

      {/* Banner */}
      {tournament.bannerUrl ? (
        <div className="relative h-48">
          <img src={tournament.bannerUrl} alt={tournament.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-transparent to-transparent" />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-orange-900/30 via-purple-900/20 to-blue-900/30 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Trophy className="w-24 h-24 text-orange-400" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#080812] to-transparent" />
        </div>
      )}

      <div className="px-4 -mt-8 relative z-10 space-y-4">
        {/* Title + Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', getStatusBadgeColor(tournament.status))}>
              {getStatusLabel(tournament.status)}
            </span>
            <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">
              {getModeLabel(tournament.mode)} • {tournament.map}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">{tournament.title}</h1>
        </div>

        {/* Prize Pool Highlight */}
        <div className="glass-card rounded-2xl p-5 card-gradient-border text-center">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Total Prize Pool</p>
          <p className="text-4xl font-black gradient-text">{formatCurrency(Number(tournament.prizePool))}</p>
          <p className="text-xs text-gray-500 mt-1">+ {formatCurrency(Number(tournament.perKillReward))} per kill</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Entry Fee</span>
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(Number(tournament.entryFee))}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Match Time</span>
            </div>
            <p className="text-base font-bold text-white">{getTimeUntilMatch(tournament.matchDatetime)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(tournament.matchDatetime).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Slots</span>
            </div>
            <p className="text-xl font-bold text-white">{tournament.slotsFilled}/{tournament.maxSlots}</p>
            <div className="slot-bar mt-2">
              <div className="slot-bar-fill" style={{ width: `${slotsPercent}%` }} />
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">Per Kill</span>
            </div>
            <p className="text-xl font-bold text-green-400">{formatCurrency(Number(tournament.perKillReward))}</p>
          </div>
        </div>

        {/* Prize Distribution */}
        {Object.keys(prizeDistrib).length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-400" />
              Prize Distribution
            </h3>
            <div className="space-y-2">
              {Object.entries(prizeDistrib).map(([rank, amt]) => {
                const prize = Number(amt)
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={rank} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                      <span>{medals[Number(rank) - 1] || `#${rank}`}</span>
                      Rank #{rank}
                    </span>
                    <span className="text-sm font-bold text-orange-400">{formatCurrency(prize)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Point Table */}
        {Object.keys(pointTable).length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Swords className="w-4 h-4 text-blue-400" />
              Point System
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              {Object.entries(pointTable).slice(0, 6).map(([rank, pts]) => (
                <div key={rank} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5">
                  <span className="text-gray-400">Rank #{rank}</span>
                  <span className="font-bold text-white">{pts} pts</span>
                </div>
              ))}
            </div>
            <div className="bg-orange-500/10 rounded-lg px-3 py-2 text-xs text-orange-300">
              + {tournament.perKillPoint} point per kill
            </div>
          </div>
        )}

        {/* Rules */}
        {tournament.rulesText && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              Tournament Rules
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{tournament.rulesText}</p>
          </div>
        )}

        {/* Wallet Balance Check */}
        {dbUser && !hasJoined && Number(dbUser.walletBalance) < Number(tournament.entryFee) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
            <p className="text-red-400 font-medium text-sm mb-2">Wallet balance kam hai!</p>
            <p className="text-gray-400 text-xs mb-3">
              Balance: {formatCurrency(Number(dbUser.walletBalance))} | Chahiye: {formatCurrency(Number(tournament.entryFee))}
            </p>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              Paise Add Karo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-16 inset-x-0 px-4 pb-2 z-30">
        {hasJoined ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 text-center">
            <p className="text-green-400 font-bold">✅ Tum Join Ho Chuke Ho!</p>
            <Link href="/my-matches" className="text-sm text-gray-400 hover:text-white mt-1 block">
              My Matches dekho →
            </Link>
          </div>
        ) : (
          <Link
            href={!user ? '/login' : !dbUser?.ffIgn ? '/setup-profile' : canJoin ? `/tournaments/${tournament.id}/join` : '#'}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-95',
              canJoin
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 orange-glow shadow-xl shadow-orange-500/20'
                : 'bg-gray-700 cursor-not-allowed'
            )}
          >
            {!user ? (
              'Login Karo → Join Karo'
            ) : isFull ? (
              'Tournament Full Ho Gaya'
            ) : tournament.status !== 'upcoming' ? (
              'Registration Band Ho Gayi'
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Join Now — {formatCurrency(Number(tournament.entryFee))}
              </>
            )}
          </Link>
        )}
      </div>
    </div>
  )
}
