import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Eye, Trophy } from 'lucide-react'
import { formatCurrency, getModeLabel, getStatusBadgeColor, getStatusLabel, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export default async function AdminTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || !['admin', 'sub_admin'].includes(dbUser.role)) redirect('/admin/login')

  const tournaments = await prisma.tournament.findMany({
    orderBy: { matchDatetime: 'desc' },
    include: {
      _count: { select: { slots: true } },
    },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Tournaments</h1>
          <p className="text-gray-400 text-sm">{tournaments.length} total tournaments</p>
        </div>
        <Link
          href="/admin/tournaments/create"
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Tournament
        </Link>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {['Tournament', 'Mode', 'Date & Time', 'Entry/Prize', 'Slots', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tournaments.map(t => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-white">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.map}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-lg">
                    {getModeLabel(t.mode)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-white">
                    {new Date(t.matchDatetime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.matchDatetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-white">{formatCurrency(Number(t.entryFee))}</p>
                  <p className="text-xs text-orange-400">{formatCurrency(Number(t.prizePool))}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-white">{t.slotsFilled}/{t.maxSlots}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-1 rounded-full border', getStatusBadgeColor(t.status))}>
                    {getStatusLabel(t.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/tournaments/${t.id}`} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      Manage
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
