/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Flame, Filter, ChevronRight, Clock, Users, Trophy, Zap } from 'lucide-react'
import { formatCurrency, getModeLabel, getStatusBadgeColor, getStatusLabel, getTimeUntilMatch, getSlotsPercentage, cn } from '@/lib/utils'
import { InstallPWA } from '@/components/InstallPWA'
import { ShareBanner } from '@/components/ShareBanner'

async function getTournaments(mode?: string, status?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (mode && mode !== 'all') where.mode = mode as any
  if (status) where.status = status as any
  else where.status = { in: ['upcoming', 'room_released', 'live'] as any }

  return prisma.tournament.findMany({
    where,
    orderBy: { matchDatetime: 'asc' },
    take: 20,
  })
}

export const dynamic = 'force-dynamic'
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; status?: string }>
}) {
  const params = await searchParams
  const mode = params.mode || 'all'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dbUser = null
  if (user) {
    dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  }

  const tournaments = await getTournaments(mode)

  const filters = [
    { label: 'All', value: 'all' },
    { label: '🎯 Solo', value: 'solo' },
    { label: '👥 Duo', value: 'duo' },
    { label: '⚔️ Squad', value: 'squad' },
  ]

  return (
    <div className="min-h-screen bg-[#080812]">
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50 bg-[#080812]/80 backdrop-blur-2xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-orange-500/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                FF TOURNAMENT
              </h1>
            </div>
          </Link>
          
          {dbUser ? (
            <Link
              href="/wallet"
              className="glass-card rounded-xl px-4 py-2 flex items-center gap-2 border border-orange-500/30 hover:border-orange-500 transition-colors bg-orange-500/10"
            >
              <Zap className="w-4 h-4 text-orange-400" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-orange-200/70 font-medium uppercase leading-none">Wallet</span>
                <span className="text-sm font-black text-orange-400 leading-none mt-1">
                  {formatCurrency(Number(dbUser.walletBalance))}
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      <ShareBanner dbUser={dbUser} />

      {/* Hero Section */}
      <div className="relative px-4 pt-12 pb-16 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <span className="live-dot w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-xs font-bold text-gray-300">Daily Tournaments Live Now</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
            Play <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Free Fire</span><br />
            Win Real Cash.
          </h2>
          
          <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
            India&apos;s most trusted esports platform. Compete in daily Solo, Duo, and Squad tournaments and get instant payouts directly to your wallet!
          </p>

          {!dbUser && (
            <Link
              href="/login"
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/20 orange-glow transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Start Playing Now <ChevronRight className="w-5 h-5" />
            </Link>
          )}

          <div className="w-full max-w-xs mt-2">
            <InstallPWA />
          </div>
        </div>
      </div>

      {/* How it Works / Stats */}
      <div className="px-4 mb-16">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: '10K+', label: 'Players', color: 'text-blue-400' },
            { value: '₹5L+', label: 'Prizes Paid', color: 'text-orange-400' },
            { value: '24/7', label: 'Matches', color: 'text-green-400' }
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 text-center border border-white/5">
              <h3 className={cn('text-xl font-black mb-1', stat.color)}>{stat.value}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Tournaments Section */}
      <div className="px-4 mb-16" id="tournaments">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              Live Tournaments
            </h3>
            <p className="text-xs text-gray-500 mt-1">Apna favorite mode select karo aur khelo</p>
          </div>
        </div>

        {/* Mode Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {filters.map(f => (
            <Link
              key={f.value}
              href={f.value === 'all' ? '/#tournaments' : `/?mode=${f.value}#tournaments`}
              className={cn(
                'flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300',
                mode === f.value
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : 'glass-card text-gray-400 border border-white/10 hover:text-white hover:border-white/20'
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Tournament List */}
        <div className="space-y-4">
          {tournaments.length === 0 ? (
            <TournamentCard
              tournament={{
                id: 'dummy',
                title: 'Daily Solo Battle (Demo)',
                status: 'upcoming',
                mode: 'solo',
                entryFee: 10,
                prizePool: 250,
                perKillPoint: 2,
                matchDatetime: new Date(Date.now() + 86400000), // tomorrow
                slotsFilled: 5,
                maxSlots: 48,
              }}
            />
          ) : (
            tournaments.map((t: any) => (
              <TournamentCard key={t.id} tournament={t} />
            ))
          )}
        </div>
      </div>

      {/* Simple How to Play */}
      <div className="px-4 mb-16">
        <h3 className="text-xl font-black text-white mb-6 text-center">Kaise Khele?</h3>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Register & Add Money', desc: 'Google se login karo aur wallet mein paise add karo.' },
            { step: '2', title: 'Join Tournament', desc: 'Apne pasand ka match choose karo aur slot book karo.' },
            { step: '3', title: 'Get Room ID & Password', desc: 'Match start hone se 15 minute pehle Room ID app mein milega.' },
            { step: '4', title: 'Play & Win Real Cash', desc: 'Rank aur Kills ke hisaab se jeeta hua amount seedha wallet mein!' }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start glass-card rounded-2xl p-4 border border-white/5">
              <div className="flex-none w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/20">
                {item.step}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-white/5 bg-black/20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mx-auto mb-4 opacity-50">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-gray-500 font-medium mb-4">© 2026 FF Tournament. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
          <Link href="/terms" className="hover:text-orange-400 transition-colors">Terms & Conditions</Link>
          <Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link>
          <Link href="/refund" className="hover:text-orange-400 transition-colors">Refund Policy</Link>
          <Link href="/contact" className="hover:text-orange-400 transition-colors">Contact Us</Link>
          <Link href="/admin/login" className="hover:text-orange-400 transition-colors">Admin Login</Link>
        </div>
      </footer>
    </div>
  )
}

function TournamentCard({ tournament: t }: { tournament: any }) {
  const slotsPercent = getSlotsPercentage(t.slotsFilled, t.maxSlots)
  const isFull = t.slotsFilled >= t.maxSlots

  return (
    <Link href={`/tournaments/${t.id}`}>
      <div className="glass-card rounded-2xl overflow-hidden card-gradient-border hover:border-orange-500/30 transition-all duration-300 active:scale-[0.98]">
        {/* Banner */}
        {t.bannerUrl ? (
          <div className="relative h-36 bg-gradient-to-br from-orange-900/40 to-purple-900/40">
            <img src={t.bannerUrl} alt={t.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-orange-900/30 via-purple-900/20 to-blue-900/30 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Trophy className="w-16 h-16 text-orange-400" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#080812]/80 to-transparent" />
          </div>
        )}

        <div className="p-4">
          {/* Title + Status */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h2 className="text-base font-bold text-white leading-snug flex-1">{t.title}</h2>
            <div className="flex flex-col items-end gap-1.5">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', getStatusBadgeColor(t.status))}>
                {t.status === 'live' && <span className="live-dot inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1" />}
                {getStatusLabel(t.status)}
              </span>
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                {getModeLabel(t.mode)}
              </span>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Entry Fee</p>
              <p className="text-sm font-bold text-white">{formatCurrency(Number(t.entryFee))}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Prize Pool</p>
              <p className="text-sm font-bold text-orange-400">{formatCurrency(Number(t.prizePool))}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Per Kill</p>
              <p className="text-sm font-bold text-green-400">
                {Number(t.perKillReward) > 0 ? formatCurrency(Number(t.perKillReward)) : `${t.perKillPoint} pt`}
              </p>
            </div>
          </div>

          {/* Slots + Time */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>{getTimeUntilMatch(t.matchDatetime)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className={isFull ? 'text-red-400 font-medium' : ''}>
                {t.slotsFilled}/{t.maxSlots} slots
              </span>
            </div>
          </div>

          {/* Slot Progress Bar */}
          <div className="slot-bar mb-3">
            <div
              className={cn('slot-bar-fill', slotsPercent >= 90 ? 'bg-gradient-to-r from-red-500 to-orange-500' : '')}
              style={{ width: `${slotsPercent}%` }}
            />
          </div>

          {/* CTA */}
          <div className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
            isFull
              ? 'bg-gray-700/50 text-gray-500'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white orange-glow'
          )}>
            {isFull ? (
              'Full Ho Gaya'
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Join Now — {formatCurrency(Number(t.entryFee))}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
