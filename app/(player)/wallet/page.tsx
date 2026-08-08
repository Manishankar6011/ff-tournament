'use client'

import { useState, useEffect } from 'react'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { toast } from 'sonner'
import Link from 'next/link'

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  createdAt: string
}

interface UserData {
  name: string
  walletBalance: number
}

const ADD_AMOUNTS = [50, 100, 200, 500, 1000, 2000]

export default function WalletPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [addingMoney, setAddingMoney] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const [uRes, tRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/wallet/transactions'),
      ])
      setUser(await uRes.json())
      setTransactions(await tRes.json())
      setLoading(false)
    }
    fetchData()

    // Check URL params for payment status (PhonePe redirect)
    const searchParams = new URLSearchParams(window.location.search)
    const paymentStatus = searchParams.get('payment')
    const errorStatus = searchParams.get('error')

    if (paymentStatus === 'success') {
      toast.success('Wallet recharged successfully! 🎉')
      window.history.replaceState(null, '', '/wallet')
    } else if (errorStatus) {
      toast.error('Payment failed or cancelled.')
      window.history.replaceState(null, '', '/wallet')
    }
  }, [])

  const handleAddMoney = async () => {
    const amount = selectedAmount || Number(customAmount)
    if (!amount || amount < 10) {
      toast.error('Minimum ₹10 add karo')
      return
    }
    if (amount > 10000) {
      toast.error('Maximum ₹10,000 ek baar mein add ho sakta hai')
      return
    }

    setAddingMoney(true)
    try {
      const res = await fetch('/api/wallet/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type: 'deposit' }),
      })
      
      const data = await res.json()
      
      if (data.url) {
        // Redirect to PhonePe payment page
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Payment gateway connection failed')
        setAddingMoney(false)
      }
    } catch {
      toast.error('Kuch gadbad ho gayi')
      setAddingMoney(false)
    }
  }

  const txIcon = (type: string) => {
    if (type === 'deposit') return <ArrowDownLeft className="w-4 h-4 text-green-400" />
    if (type === 'prize_credit' || type === 'refund') return <ArrowDownLeft className="w-4 h-4 text-green-400" />
    return <ArrowUpRight className="w-4 h-4 text-red-400" />
  }

  const txColor = (type: string) => {
    if (['deposit', 'prize_credit', 'refund'].includes(type)) return 'text-green-400'
    return 'text-red-400'
  }

  const txSign = (type: string) => {
    if (['deposit', 'prize_credit', 'refund'].includes(type)) return '+'
    return '-'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <h1 className="text-xl font-black text-white">Wallet</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Balance Card */}
        <div className="relative overflow-hidden glass-card rounded-3xl p-6 card-gradient-border">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Total Balance</span>
            </div>
            <p className="text-4xl font-black text-white mb-4">
              {formatCurrency(user?.walletBalance || 0)}
            </p>
            <div className="flex gap-2">
              <Link
                href="/withdraw"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 glass-card rounded-xl text-sm font-medium text-gray-300 border border-white/10"
              >
                <ArrowUpRight className="w-4 h-4" />
                Withdraw
              </Link>
            </div>
          </div>
        </div>

        {/* Add Money */}
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-400" />
            Paise Add Karo
          </h2>

          {/* Quick Amounts */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {ADD_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95',
                  selectedAmount === amt
                    ? 'bg-orange-500 text-white orange-glow'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                )}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <input
            type="number"
            placeholder="Ya custom amount type karo..."
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm mb-3"
          />

          <button
            onClick={handleAddMoney}
            disabled={addingMoney || (!selectedAmount && !customAmount)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 rounded-xl py-3.5 text-white font-bold active:scale-95 transition-all"
          >
            {addingMoney ? 'Processing...' : `Add ${selectedAmount ? formatCurrency(selectedAmount) : customAmount ? formatCurrency(Number(customAmount)) : 'Money'}`}
          </button>
        </div>

        {/* Transaction History */}
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Koi transaction nahi hui abhi</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{tx.description || tx.type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', txColor(tx.type))}>
                      {txSign(tx.type)}{formatCurrency(Number(tx.amount))}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
