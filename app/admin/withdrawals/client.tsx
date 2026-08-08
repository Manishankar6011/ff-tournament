'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminWithdrawalsClient({ withdrawals: initial }: { withdrawals: any[] }) {
  const [withdrawals, setWithdrawals] = useState(initial)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id)
    const res = await fetch(`/api/wallet/withdrawal/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        reason: action === 'reject' ? rejectReason[id] : undefined,
      }),
    })

    if (res.ok) {
      toast.success(action === 'approve' ? 'Withdrawal approve ho gayi!' : 'Withdrawal reject ho gayi')
      setWithdrawals(prev =>
        prev.map(w => w.id === id ? { ...w, status: action === 'approve' ? 'approved' : 'rejected' } : w)
      )
    } else {
      toast.error('Action fail ho gayi')
    }
    setProcessing(null)
  }

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    approved: 'text-green-400 bg-green-500/10 border-green-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <div className="space-y-3">
      {withdrawals.map(w => (
        <div key={w.id} className={cn('glass-card rounded-2xl p-5 border', w.status === 'pending' ? 'border-yellow-500/20' : 'border-white/5')}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-white">{w.user.name}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border capitalize', statusColors[w.status])}>
                  {w.status}
                </span>
              </div>
              <p className="text-xs text-gray-400">{w.user.phone}</p>
              <p className="text-sm text-orange-400 font-bold mt-2">{formatCurrency(Number(w.amount))}</p>
              <div className="mt-2 bg-white/5 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400">UPI ID:</p>
                <p className="text-sm text-white font-mono font-medium">{w.upiId}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Requested: {new Date(w.requestedAt).toLocaleString('en-IN')}
              </p>
              {w.reason && <p className="text-xs text-red-400 mt-1">Reason: {w.reason}</p>}
            </div>

            {w.status === 'pending' && (
              <div className="flex flex-col gap-2 shrink-0">
                <input
                  placeholder="Reject reason (optional)"
                  value={rejectReason[w.id] || ''}
                  onChange={e => setRejectReason(p => ({ ...p, [w.id]: e.target.value }))}
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white placeholder-gray-600 w-40 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => handleAction(w.id, 'approve')}
                  disabled={processing === w.id}
                  className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-500/30 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve & Mark Paid
                </button>
                <button
                  onClick={() => handleAction(w.id, 'reject')}
                  disabled={processing === w.id}
                  className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-500/30 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject (Refund)
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {withdrawals.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Koi withdrawal request nahi</p>
        </div>
      )}
    </div>
  )
}
