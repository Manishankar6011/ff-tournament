'use client'

import { useState, useEffect } from 'react'
import { Wallet, CheckCircle, XCircle, Search, Clock } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Deposit {
  id: string
  amount: number
  status: string
  referenceId: string
  createdAt: string
  user: {
    name: string
    ffIgn: string
    phone: string
  }
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDeposits()
  }, [])

  const fetchDeposits = async () => {
    try {
      const res = await fetch('/api/admin/deposits')
      const data = await res.json()
      setDeposits(data)
    } catch (error) {
      toast.error('Failed to load deposits')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        toast.success(action === 'approve' ? 'Deposit Approved!' : 'Deposit Rejected')
        fetchDeposits()
      } else {
        const error = await res.json()
        toast.error(error.error || `Failed to ${action}`)
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredDeposits = deposits.filter(d => 
    d.referenceId?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.phone?.includes(search)
  )

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Manual Deposits</h1>
          <p className="text-gray-400 text-sm mt-1">Approve or reject UTR submissions</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search UTR, name, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase">Player</th>
                <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase">UTR / Reference</th>
                <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase">Amount</th>
                <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase">Date</th>
                <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase">Status</th>
                <th className="text-right text-xs font-bold text-gray-400 px-6 py-4 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No deposits found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map(deposit => (
                  <tr key={deposit.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{deposit.user?.name}</p>
                      <p className="text-xs text-gray-500">{deposit.user?.phone || deposit.user?.ffIgn}</p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                        {deposit.referenceId}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-green-400">
                        {formatCurrency(deposit.amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-400">
                        {new Date(deposit.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata',
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        deposit.status === 'pending' && "bg-yellow-500/10 text-yellow-500",
                        deposit.status === 'success' && "bg-green-500/10 text-green-500",
                        deposit.status === 'failed' && "bg-red-500/10 text-red-500"
                      )}>
                        {deposit.status === 'pending' && <Clock className="w-3 h-3" />}
                        {deposit.status === 'success' && <CheckCircle className="w-3 h-3" />}
                        {deposit.status === 'failed' && <XCircle className="w-3 h-3" />}
                        <span className="capitalize">{deposit.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {deposit.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(deposit.id, 'reject')}
                            disabled={processingId === deposit.id}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAction(deposit.id, 'approve')}
                            disabled={processingId === deposit.id}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
