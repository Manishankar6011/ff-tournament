import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Key, ClipboardList, Users, Trophy, Ban } from 'lucide-react'
import { formatCurrency, getModeLabel, getStatusBadgeColor, getStatusLabel, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export default async function AdminTournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || !['admin', 'sub_admin'].includes(dbUser.role)) redirect('/admin/login')

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      slots: {
        include: { user: { select: { name: true, phone: true, ffUid: true, ffIgn: true } } },
        orderBy: { slotNumber: 'asc' },
      },
      rooms: true,
      results: { orderBy: { rank: 'asc' } },
    },
  })

  if (!tournament) notFound()

  const room = tournament.rooms[0]

  const actions = [
    {
      href: `/admin/tournaments/${id}/slots`,
      icon: Users,
      label: 'Slot Manager',
      desc: `${tournament.slotsFilled}/${tournament.maxSlots} slots joined`,
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    },
    {
      href: `/admin/tournaments/${id}/release-room`,
      icon: Key,
      label: 'Release Room ID/Password',
      desc: room ? `Released: ${room.roomIdCode}` : 'Abhi release nahi hua',
      color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      disabled: tournament.status === 'completed' || tournament.status === 'cancelled',
    },
    {
      href: `/admin/tournaments/${id}/enter-results`,
      icon: ClipboardList,
      label: 'Enter Results',
      desc: tournament.results.length > 0 ? `${tournament.results.length} results entered` : 'Results pending',
      color: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      disabled: tournament.status === 'cancelled',
    },
    {
      href: `/admin/tournaments/${id}/leaderboard`,
      icon: Trophy,
      label: 'Leaderboard',
      desc: tournament.status === 'completed' ? 'Published' : 'Not published yet',
      color: 'bg-green-500/10 border-green-500/20 text-green-400',
      disabled: tournament.results.length === 0,
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/tournaments">
          <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">{tournament.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', getStatusBadgeColor(tournament.status))}>
              {getStatusLabel(tournament.status)}
            </span>
            <span className="text-xs text-gray-500">{getModeLabel(tournament.mode)} • {tournament.map}</span>
          </div>
        </div>
      </div>

      {/* Tournament Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Entry Fee', value: formatCurrency(Number(tournament.entryFee)), color: 'text-white' },
          { label: 'Prize Pool', value: formatCurrency(Number(tournament.prizePool)), color: 'text-orange-400' },
          { label: 'Slots', value: `${tournament.slotsFilled}/${tournament.maxSlots}`, color: 'text-blue-400' },
          { label: 'Match Time', value: new Date(tournament.matchDatetime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {actions.map(a => (
          a.disabled ? (
            <div key={a.label} className={cn('rounded-2xl p-5 border opacity-50 cursor-not-allowed', a.color)}>
              <a.icon className="w-6 h-6 mb-3" />
              <p className="font-bold text-base">{a.label}</p>
              <p className="text-xs opacity-70 mt-1">{a.desc}</p>
            </div>
          ) : (
            <Link key={a.label} href={a.href}>
              <div className={cn('rounded-2xl p-5 border hover:opacity-80 transition-opacity cursor-pointer', a.color)}>
                <a.icon className="w-6 h-6 mb-3" />
                <p className="font-bold text-base">{a.label}</p>
                <p className="text-xs opacity-70 mt-1">{a.desc}</p>
              </div>
            </Link>
          )
        ))}
      </div>

      {/* Quick Joined Players */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-bold text-white mb-4">Joined Players ({tournament.slots.length})</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tournament.slots.slice(0, 10).map(slot => (
            <div key={slot.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
              <span className="text-sm font-bold text-gray-500 w-8">#{slot.slotNumber}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{slot.user.name}</p>
                <p className="text-xs text-gray-500">{slot.user.ffIgn} • {slot.user.ffUid}</p>
              </div>
              <span className={cn('text-xs px-2 py-0.5 rounded-full',
                slot.paymentStatus === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              )}>
                {slot.paymentStatus}
              </span>
            </div>
          ))}
          {tournament.slots.length > 10 && (
            <Link href={`/admin/tournaments/${id}/slots`} className="text-xs text-orange-400 block text-center pt-2">
              Sab {tournament.slots.length} players dekho →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
