import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Wallet, TrendingUp, Clock, AlertCircle, Plus, ChevronRight } from 'lucide-react'
import { formatCurrency, getStatusBadgeColor, getStatusLabel, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || !['admin', 'sub_admin'].includes(dbUser.role)) {
    redirect('/admin/login')
  }

  // Dashboard stats
  const [
    totalUsers,
    totalTournaments,
    pendingWithdrawals,
    todayTournaments,
    pendingResults,
    recentTransactions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'player' } }),
    prisma.tournament.count(),
    prisma.withdrawalRequest.count({ where: { status: 'pending' } }),
    prisma.tournament.findMany({
      where: {
        matchDatetime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { matchDatetime: 'asc' },
    }),
    prisma.tournament.count({ where: { status: 'live' } }),
    prisma.walletTransaction.findMany({
      where: { type: 'deposit', status: 'success' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ])

  // Revenue stats
  const [totalDeposits, totalPrizes] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { type: 'deposit', status: 'success' },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: 'prize_credit', status: 'success' },
      _sum: { amount: true },
    }),
  ])

  const revenue = Number(totalDeposits._sum.amount || 0)
  const prizes = Number(totalPrizes._sum.amount || 0)
  const profit = revenue - prizes

  const stats = [
    { label: 'Total Players', value: totalUsers.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Tournaments', value: totalTournaments.toString(), icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Pending Withdrawals', value: pendingWithdrawals.toString(), icon: Wallet, color: 'text-red-400', bg: 'bg-red-500/10', urgent: pendingWithdrawals > 0 },
    { label: 'Net Revenue', value: formatCurrency(profit), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back, {dbUser.name}!</p>
        </div>
        <Link
          href="/admin/tournaments/create"
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:from-orange-600 hover:to-orange-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Tournament
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={cn('glass-card rounded-2xl p-5', s.urgent ? 'border border-red-500/30' : 'card-gradient-border')}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's Tournaments */}
        <div className="col-span-2 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              Today's Tournaments
            </h2>
            <Link href="/admin/tournaments" className="text-xs text-orange-400 hover:text-orange-300">
              Sab dekho →
            </Link>
          </div>

          {todayTournaments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Aaj koi tournament nahi</p>
          ) : (
            <div className="space-y-3">
              {todayTournaments.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(t.matchDatetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {' '} • {t.slotsFilled}/{t.maxSlots} slots
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', getStatusBadgeColor(t.status))}>
                      {getStatusLabel(t.status)}
                    </span>
                    <Link href={`/admin/tournaments/${t.id}`}>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            {pendingWithdrawals > 0 && (
              <Link href="/admin/withdrawals">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-red-400">{pendingWithdrawals} Withdrawals</p>
                    <p className="text-xs text-gray-500">Pending approval</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </div>
              </Link>
            )}
            {pendingResults > 0 && (
              <Link href="/admin/tournaments">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-yellow-400">{pendingResults} Live</p>
                    <p className="text-xs text-gray-500">Results pending</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-yellow-400" />
                </div>
              </Link>
            )}
            <Link href="/admin/tournaments/create">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-orange-400">New Tournament</p>
                  <p className="text-xs text-gray-500">Create now</p>
                </div>
                <Plus className="w-4 h-4 text-orange-400" />
              </div>
            </Link>

            {/* Revenue Summary */}
            <div className="glass-card rounded-xl p-3 mt-2 space-y-1.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue Summary</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Deposits</span>
                <span className="text-green-400 font-medium">{formatCurrency(revenue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Prizes</span>
                <span className="text-orange-400 font-medium">{formatCurrency(prizes)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/10 pt-1">
                <span className="text-gray-400 font-medium">Net Profit</span>
                <span className={cn('font-bold', profit >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
