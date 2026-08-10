'use client'

import { useState, useEffect } from 'react'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'

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
  const [showPaymentFlow, setShowPaymentFlow] = useState(false)
  const [utrNumber, setUtrNumber] = useState('')
  
  const upiId = "70613388@ybl"
  const upiName = "FF Tournament"

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

  const handleInitiatePayment = () => {
    const amount = selectedAmount || Number(customAmount)
    if (!amount || amount < 10) {
      toast.error('Minimum ₹10 add karo')
      return
    }
    if (amount > 10000) {
      toast.error('Maximum ₹10,000 ek baar mein add ho sakta hai')
      return
    }
    setShowPaymentFlow(true)
  }

  const handleSubmitUtr = async () => {
    if (utrNumber.length !== 12) {
      toast.error('UTR 12 digit ka hona chahiye')
      return
    }

    const amount = selectedAmount || Number(customAmount)
    setAddingMoney(true)
    
    try {
      const res = await fetch('/api/wallet/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, utr: utrNumber }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success('UTR submitted! Admin jaldi verify kar dega.')
        setShowPaymentFlow(false)
        setUtrNumber('')
        setCustomAmount('')
        setSelectedAmount(null)
        // Refresh transactions
        const tRes = await fetch('/api/wallet/transactions')
        setTransactions(await tRes.json())
      } else {
        toast.error(data.error || 'Submit karne mein error')
      }
    } catch {
      toast.error('Kuch gadbad ho gayi')
    }
    setAddingMoney(false)
  }

  const getUpiUrl = () => {
    const amount = selectedAmount || Number(customAmount)
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR`
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

          {!showPaymentFlow ? (
            <>
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
                onClick={handleInitiatePayment}
                disabled={!selectedAmount && !customAmount}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 rounded-xl py-3.5 text-white font-bold active:scale-95 transition-all"
              >
                Add {selectedAmount ? formatCurrency(selectedAmount) : customAmount ? formatCurrency(Number(customAmount)) : 'Money'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-3 rounded-2xl w-48 h-48 flex items-center justify-center">
                <QRCodeCanvas value={getUpiUrl()} size={160} />
              </div>
              
              <div className="text-center w-full">
                <p className="text-sm text-gray-300 mb-1">Scan to pay <strong>{formatCurrency(selectedAmount || Number(customAmount))}</strong></p>
                <p className="text-xs text-orange-400 font-medium mb-3">UPI: {upiId}</p>

                <a 
                  href={getUpiUrl()}
                  className="w-full inline-flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-3 text-white font-bold transition-all mb-4"
                >
                  Pay via UPI App
                </a>
              </div>

              <div className="w-full border-t border-white/10 pt-4">
                <p className="text-xs font-medium text-gray-400 mb-2">Payment karne ke baad UTR/Ref No. daalein:</p>
                <input
                  type="number"
                  placeholder="12-digit UTR Number"
                  value={utrNumber}
                  onChange={e => setUtrNumber(e.target.value.slice(0, 12))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm mb-3 text-center tracking-widest"
                />
                <button
                  onClick={handleSubmitUtr}
                  disabled={addingMoney || utrNumber.length !== 12}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 rounded-xl py-3 text-white font-bold active:scale-95 transition-all"
                >
                  {addingMoney ? 'Submitting...' : 'Submit UTR & Verify'}
                </button>
                <button
                  onClick={() => setShowPaymentFlow(false)}
                  className="w-full mt-2 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', txColor(tx.type))}>
                      {txSign(tx.type)}{formatCurrency(Number(tx.amount))}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {tx.type === 'deposit' && tx.status === 'pending' ? (
                        <span className="text-orange-400 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" /> Verifying
                        </span>
                      ) : tx.status === 'failed' ? (
                        <span className="text-red-400">Payment Failed</span>
                      ) : (
                        tx.status
                      )}
                    </p>
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
