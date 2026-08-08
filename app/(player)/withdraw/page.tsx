'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowUpRight, Wallet, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export default function WithdrawPage() {
  const [user, setUser] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [upiId, setUpiId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
  }, [])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount)

    if (!amt || amt < 10) { toast.error('Minimum ₹10 withdraw karo'); return }
    if (amt > Number(user?.walletBalance)) { toast.error('Balance se zyada withdraw nahi ho sakta'); return }
    if (!upiId || !upiId.includes('@')) { toast.error('Valid UPI ID daalo (jaise: name@upi)'); return }

    setLoading(true)
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt, upiId }),
    })

    if (res.ok) {
      toast.success('Withdrawal request submit ho gayi! 24-48 ghante mein process hogi.')
      setAmount('')
      setUpiId('')
      fetch('/api/auth/me').then(r => r.json()).then(setUser)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Withdrawal request fail ho gayi')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <Link href="/wallet" className="flex items-center gap-2 text-gray-300 mb-2">
          <ArrowLeft className="w-4 h-4" /> Wallet
        </Link>
        <h1 className="text-xl font-black text-white">Withdraw Money</h1>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-sm mx-auto">
        {/* Balance */}
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-xs text-gray-400">Available Balance</p>
            <p className="text-xl font-black text-white">{formatCurrency(Number(user?.walletBalance || 0))}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 card-gradient-border space-y-4">
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Withdrawal Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Minimum ₹10"
                max={Number(user?.walletBalance)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setAmount(String(Math.floor(Number(user?.walletBalance || 0))))}
                className="text-xs text-orange-400 mt-1 hover:text-orange-300"
              >
                Pura balance withdraw karo
              </button>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value.toLowerCase())}
                placeholder="yourname@upi"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
                required
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">
                UPI ID verify karke daalo. Galat UPI ID pe transfer hone ke baad wapas nahi milega.
                Process mein 24-48 ghante lag sakte hain.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !amount || !upiId}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              {loading ? 'Submit ho raha hai...' : 'Withdrawal Request Bhejo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
