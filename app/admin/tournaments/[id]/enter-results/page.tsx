'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trophy, Skull } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getModeLabel } from '@/lib/utils'

interface Slot {
  id: string
  slotNumber: number
  paymentStatus: string
  user: { name: string; ffIgn: string; ffUid: string }
  teamMembers: any[]
  result?: { rank: number; kills: number }
}

interface SlotResult {
  slotId: string
  rank: number
  kills: number
}

export default function EnterResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [slots, setSlots] = useState<Slot[]>([])
  const [results, setResults] = useState<Record<string, SlotResult>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [tournament, setTournament] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, tRes] = await Promise.all([
        fetch(`/api/tournaments/${id}/join`),
        fetch(`/api/tournaments/${id}`),
      ])
      const slotsData = await sRes.json()
      const tData = await tRes.json()
      setSlots(slotsData.filter((s: any) => s.paymentStatus === 'success'))
      setTournament(tData)

      // Init results from existing or empty
      const initial: Record<string, SlotResult> = {}
      slotsData.forEach((s: Slot) => {
        if (s.paymentStatus === 'success') {
          initial[s.id] = {
            slotId: s.id,
            rank: s.result?.rank || 0,
            kills: s.result?.kills || 0,
          }
        }
      })
      setResults(initial)
      setFetching(false)
    }
    fetchData()
  }, [id])

  const updateResult = (slotId: string, field: 'rank' | 'kills', value: number) => {
    setResults(prev => ({
      ...prev,
      [slotId]: { ...prev[slotId], slotId, [field]: value },
    }))
  }

  const handleSubmit = async () => {
    const payload = Object.values(results).filter(r => r.rank > 0)

    if (payload.length === 0) {
      toast.error('Koi result enter nahi hua')
      return
    }

    // Check for duplicate ranks
    const ranks = payload.map(r => r.rank)
    const uniqueRanks = new Set(ranks)
    if (ranks.length !== uniqueRanks.size) {
      toast.error('Duplicate ranks hain! Har team/player ka rank alag hona chahiye')
      return
    }

    setLoading(true)
    const res = await fetch(`/api/results/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: payload }),
    })

    if (res.ok) {
      toast.success('Results publish ho gaye! Prizes auto-credit ho gaye hain. 🏆')
      router.push(`/admin/tournaments/${id}`)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Results submit karne mein error')
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href={`/admin/tournaments/${id}`}>
            <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Enter Results</h1>
            <p className="text-gray-400 text-sm">
              {tournament?.title} • {slots.length} players
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Publish ho raha hai...' : 'Publish Results & Credit Prizes'}
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-orange-400" />
          <p className="text-sm text-orange-300">
            Rank aur Kills enter karo. Points aur prizes automatically calculate ho jayenge.
          </p>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs font-bold text-gray-400 px-4 py-3">Slot #</th>
              <th className="text-left text-xs font-bold text-gray-400 px-4 py-3">Player / Team</th>
              <th className="text-left text-xs font-bold text-gray-400 px-4 py-3 w-28">
                <Trophy className="w-3.5 h-3.5 inline text-yellow-400 mr-1" />
                Rank
              </th>
              <th className="text-left text-xs font-bold text-gray-400 px-4 py-3 w-28">
                <Skull className="w-3.5 h-3.5 inline text-red-400 mr-1" />
                Kills
              </th>
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => {
              const r = results[slot.id]
              return (
                <tr key={slot.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-gray-400">#{slot.slotNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{slot.user.name}</p>
                    <p className="text-xs text-gray-500">{slot.user.ffIgn}</p>
                    {slot.teamMembers?.length > 0 && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        +{slot.teamMembers.length} teammates
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="1"
                      max={slots.length}
                      value={r?.rank || ''}
                      onChange={e => updateResult(slot.id, 'rank', Number(e.target.value))}
                      placeholder="1–48"
                      className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={r?.kills !== undefined ? r.kills : ''}
                      onChange={e => updateResult(slot.id, 'kills', Number(e.target.value))}
                      placeholder="0"
                      className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:border-red-500"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
