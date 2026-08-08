/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Clock, Key, CheckCircle, XCircle, ChevronRight, Zap } from 'lucide-react'
import { formatCurrency, getModeLabel, getStatusBadgeColor, getStatusLabel, getTimeUntilMatch, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export default async function MyMatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect('/setup-profile')

  const slots = await prisma.tournamentSlot.findMany({
    where: { userId: dbUser.id, paymentStatus: 'success' },
    include: {
      tournament: true,
      result: true,
    },
    orderBy: { joinedAt: 'desc' },
  })

  const upcoming = slots.filter((s: any) => ['upcoming', 'room_released', 'live'].includes(s.tournament.status))
  const completed = slots.filter((s: any) => ['completed', 'cancelled'].includes(s.tournament.status))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <h1 className="text-xl font-black text-white">My Matches</h1>
        <p className="text-xs text-gray-400 mt-0.5">{slots.length} tournament{slots.length !== 1 ? 's' : ''} join ki hain</p>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Upcoming / Live */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Upcoming & Live</h2>
          {upcoming.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Koi upcoming match nahi</p>
              <Link href="/" className="text-orange-400 text-sm mt-2 block">Tournaments Browse Karo →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((slot: any) => (
                <MatchCard key={slot.id} slot={slot} />
              ))}
            </div>
          )}
        </section>

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Completed</h2>
            <div className="space-y-3">
              {completed.map((slot: any) => (
                <MatchCard key={slot.id} slot={slot} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function MatchCard({ slot }: { slot: any }) {
  const t = slot.tournament
  const isRoomReleased = t.status === 'room_released' || t.status === 'live'
  const isCompleted = t.status === 'completed'

  return (
    <div className="glass-card rounded-2xl overflow-hidden card-gradient-border">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-white text-sm">{t.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{getModeLabel(t.mode)} • {t.map}</p>
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border shrink-0', getStatusBadgeColor(t.status))}>
            {getStatusLabel(t.status)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-500">Slot</p>
            <p className="text-sm font-bold text-white">#{slot.slotNumber}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-500">Entry</p>
            <p className="text-sm font-bold text-white">{formatCurrency(Number(t.entryFee))}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-500">Prize Pool</p>
            <p className="text-sm font-bold text-orange-400">{formatCurrency(Number(t.prizePool))}</p>
          </div>
        </div>

        {/* Result (if completed) */}
        {isCompleted && slot.result && (
          <div className={cn(
            'rounded-xl p-3 mb-3',
            Number(slot.result.prizeWon) > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'
          )}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">Rank</p>
                <p className="text-base font-black text-white">#{slot.result.rank}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Kills</p>
                <p className="text-base font-black text-orange-400">💀 {slot.result.kills}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Prize Won</p>
                <p className="text-base font-black text-green-400">
                  {Number(slot.result.prizeWon) > 0 ? formatCurrency(Number(slot.result.prizeWon)) : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Room ID/Password (if released) */}
        {isRoomReleased && (
          <Link href={`/my-matches/${t.id}/room`}>
            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-300 font-medium">Room ID/Password Ready!</span>
              </div>
              <ChevronRight className="w-4 h-4 text-yellow-400" />
            </div>
          </Link>
        )}

        {/* Upcoming - Time */}
        {t.status === 'upcoming' && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Match in: <strong className="text-white">{getTimeUntilMatch(t.matchDatetime)}</strong></span>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-2 mt-2">
          <Link
            href={`/tournaments/${t.id}`}
            className="flex-1 text-center text-xs text-gray-400 hover:text-white py-1.5 glass-card rounded-lg transition-colors"
          >
            Details
          </Link>
          {isCompleted && (
            <Link
              href={`/tournaments/${t.id}/leaderboard`}
              className="flex-1 text-center text-xs text-orange-400 hover:text-orange-300 py-1.5 bg-orange-500/10 rounded-lg transition-colors"
            >
              Leaderboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
