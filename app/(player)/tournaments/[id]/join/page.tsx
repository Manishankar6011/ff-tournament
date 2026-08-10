'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Users, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { openRazorpayCheckout } from '@/lib/razorpay'

interface Tournament {
  id: string
  title: string
  mode: string
  entryFee: number
  teamSize: number
  slotsFilled: number
  maxSlots: number
}

interface Teammate {
  name: string
  ffUid: string
  ffIgn: string
}

export default function JoinTournamentPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [userBalance, setUserBalance] = useState(0)
  const [teammates, setTeammates] = useState<Teammate[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details')

  useEffect(() => {
    const fetchData = async () => {
      const [tRes, uRes] = await Promise.all([
        fetch(`/api/tournaments/${id}`),
        fetch('/api/auth/me'),
      ])
      const t = await tRes.json()
      const u = await uRes.json()
      setTournament(t)
      setUserBalance(u?.walletBalance || 0)

      // Init teammates for duo/squad
      if (t.mode === 'duo') setTeammates([{ name: '', ffUid: '', ffIgn: '' }])
      if (t.mode === 'squad') setTeammates([
        { name: '', ffUid: '', ffIgn: '' },
        { name: '', ffUid: '', ffIgn: '' },
        { name: '', ffUid: '', ffIgn: '' },
      ])
    }
    fetchData()
  }, [id])

  const addTeammate = () => setTeammates(prev => [...prev, { name: '', ffUid: '', ffIgn: '' }])
  const removeTeammate = (i: number) => setTeammates(prev => prev.filter((_, idx) => idx !== i))
  const updateTeammate = (i: number, field: keyof Teammate, value: string) => {
    setTeammates(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  const handleJoin = async () => {
    if (!tournament) return

    const entryFee = Number(tournament.entryFee)

    if (Number(userBalance) < entryFee) {
      toast.error('Wallet balance kam hai! Paise add karo.')
      router.push('/wallet')
      return
    }

    setLoading(true)
    try {
      if (Number(userBalance) >= entryFee) {
        // Use wallet balance directly
        const joinRes = await fetch(`/api/tournaments/${id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teammates, paymentMethod: 'wallet' }),
        })

        if (!joinRes.ok) {
          const err = await joinRes.json()
          throw new Error(err.error || 'Join failed')
        }

        setStep('success')
      } else {
        throw new Error('Wallet balance kam hai')
      }
    } catch (err: any) {
      toast.error(err.message || 'Kuch gadbad ho gayi')
    }
    setLoading(false)
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animated-gradient">
        <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-6 pulse-ring">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Congratulations! 🎉</h1>
        <p className="text-gray-400 mb-2">Tumne tournament join kar liya!</p>
        <p className="text-sm text-gray-500 mb-8">
          Room ID/Password match se 30-60 minute pehle milega. Notification on rakho!
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <Link
            href="/my-matches"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl text-white font-bold"
          >
            My Matches Dekho
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 glass-card rounded-2xl text-gray-300 font-medium"
          >
            Aur Tournaments Dekho
          </Link>
        </div>
      </div>
    )
  }

  const needsTeammates = tournament.mode === 'duo' || tournament.mode === 'squad'

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/tournaments/${id}`}>
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <div>
            <h1 className="font-bold text-white">Join Tournament</h1>
            <p className="text-xs text-gray-400">{tournament.title}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Payment Summary */}
        <div className="glass-card rounded-2xl p-4 card-gradient-border">
          <h2 className="text-sm font-bold text-white mb-3">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Entry Fee</span>
              <span className="font-bold text-white">{formatCurrency(Number(tournament.entryFee))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Wallet Balance</span>
              <span className={`font-bold ${Number(userBalance) >= Number(tournament.entryFee) ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(Number(userBalance))}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
              <span className="text-gray-300 font-medium">Balance After Joining</span>
              <span className="font-bold text-white">
                {formatCurrency(Number(userBalance) - Number(tournament.entryFee))}
              </span>
            </div>
          </div>
        </div>

        {/* Teammates Section */}
        {needsTeammates && (
          <div className="glass-card rounded-2xl p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Teammates Details
              <span className="text-xs text-gray-500 ml-auto">
                {tournament.mode === 'duo' ? '1 teammate chahiye' : '3 teammates chahiye'}
              </span>
            </h2>

            <div className="space-y-4">
              {teammates.map((tm, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-orange-400 font-medium">Teammate #{i + 1}</span>
                    {teammates.length > 1 && i === teammates.length - 1 && (
                      <button onClick={() => removeTeammate(i)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                  {[
                    { field: 'name', placeholder: 'Player ka naam' },
                    { field: 'ffUid', placeholder: 'Free Fire UID' },
                    { field: 'ffIgn', placeholder: 'In-Game Name' },
                  ].map(({ field, placeholder }) => (
                    <input
                      key={field}
                      value={tm[field as keyof Teammate]}
                      onChange={e => updateTeammate(i, field as keyof Teammate, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  ))}
                </div>
              ))}
            </div>

            {tournament.mode === 'squad' && teammates.length < 3 && (
              <button
                onClick={addTeammate}
                className="mt-3 flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"
              >
                <Plus className="w-4 h-4" />
                Teammate Add Karo
              </button>
            )}
          </div>
        )}

        {/* Important Note */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-xs text-blue-300 leading-relaxed">
            📢 <strong>Important:</strong> Room ID/Password match se 30-60 minute pehle milega.
            Notification allow karo aur SMS dekho. Miss mat karna — ye ek time-critical alert hoga!
          </p>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 inset-x-0 px-4 pb-2 z-30">
        {Number(userBalance) < Number(tournament.entryFee) ? (
          <Link
            href="/wallet"
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl text-white font-black text-base orange-glow"
          >
            Wallet me Paise Add Karo →
          </Link>
        ) : (
          <button
            onClick={handleJoin}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 rounded-2xl text-white font-black text-base orange-glow active:scale-95 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {formatCurrency(Number(tournament.entryFee))} Pay Karo & Join Karo
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
