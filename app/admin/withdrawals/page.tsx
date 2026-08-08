import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, cn } from '@/lib/utils'
import AdminWithdrawalsClient from './client'

export const dynamic = 'force-dynamic'
export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || !['admin', 'sub_admin'].includes(dbUser.role)) redirect('/admin/login')

  const withdrawals = await prisma.withdrawalRequest.findMany({
    include: { user: { select: { name: true, phone: true, email: true } } },
    orderBy: [{ status: 'asc' }, { requestedAt: 'desc' }],
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Withdrawal Requests</h1>
        <p className="text-gray-400 text-sm">
          {withdrawals.filter(w => w.status === 'pending').length} pending requests
        </p>
      </div>

      <AdminWithdrawalsClient withdrawals={withdrawals} />
    </div>
  )
}
