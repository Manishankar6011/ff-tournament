'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Calendar, Users, IndianRupee, MapPin, FileText, Image, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DEFAULT_POINT_TABLE, DEFAULT_PRIZE_DISTRIBUTION } from '@/lib/points-calculator'

const MAPS = ['Bermuda', 'Kalahari', 'Purgatory', 'Alpine', 'Nexterra']

export default function CreateTournamentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    mode: 'solo',
    map: 'Bermuda',
    entryFee: '',
    prizePool: '',
    perKillReward: '',
    perKillPoint: '1',
    maxSlots: '',
    matchDatetime: '',
    rulesText: '',
    bannerUrl: '',
  })

  const [prizeDistrib, setPrizeDistrib] = useState<Record<string, string>>({
    '1': '500', '2': '300', '3': '200',
  })

  const [pointTable, setPointTable] = useState<Record<string, string>>({
    '1': '15', '2': '12', '3': '10', '4': '8', '5': '6', '6': '4',
  })

  const update = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        ...form,
        entryFee: Number(form.entryFee),
        prizePool: Number(form.prizePool),
        perKillReward: Number(form.perKillReward),
        perKillPoint: Number(form.perKillPoint),
        maxSlots: Number(form.maxSlots),
        matchDatetime: new Date(form.matchDatetime).toISOString(),
        prizeDistribution: Object.fromEntries(
          Object.entries(prizeDistrib).map(([k, v]) => [k, Number(v)])
        ),
        pointTable: Object.fromEntries(
          Object.entries(pointTable).map(([k, v]) => [k, Number(v)])
        ),
      }

      if (!payload.bannerUrl) {
        delete payload.bannerUrl
      }

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Tournament create karne mein error')
      }

      toast.success('Tournament create ho gaya! 🎉')
      router.push('/admin/tournaments')
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  const totalPrizeAmount = Object.values(prizeDistrib).reduce((s, v) => s + Number(v), 0)
  const isPrizeValid = totalPrizeAmount === Number(form.prizePool)

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/tournaments">
          <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Create Tournament</h1>
          <p className="text-gray-400 text-sm">Naya tournament setup karo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" />
            Basic Info
          </h2>

          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Tournament Title *</label>
            <input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Jaise: FF India Championship #12"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Mode *</label>
              <select
                value={form.mode}
                onChange={e => update('mode', e.target.value)}
                className="w-full bg-[#1a1a30] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
              >
                <option value="solo">Solo</option>
                <option value="duo">Duo</option>
                <option value="squad">Squad</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Map *</label>
              <select
                value={form.map}
                onChange={e => update('map', e.target.value)}
                className="w-full bg-[#1a1a30] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
              >
                {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Match Date & Time *
            </label>
            <input
              type="datetime-local"
              value={form.matchDatetime}
              onChange={e => update('matchDatetime', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Max Slots *</label>
            <input
              type="number"
              value={form.maxSlots}
              onChange={e => update('maxSlots', e.target.value)}
              placeholder={form.mode === 'solo' ? '48' : form.mode === 'duo' ? '24' : '12'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
              required
            />
          </div>
        </div>

        {/* Prize & Entry */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-green-400" />
            Prize & Entry Fee
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Entry Fee (₹) *</label>
              <input
                type="number"
                value={form.entryFee}
                onChange={e => update('entryFee', e.target.value)}
                placeholder="50"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Total Prize Pool (₹) *</label>
              <input
                type="number"
                value={form.prizePool}
                onChange={e => update('prizePool', e.target.value)}
                placeholder="1000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Per Kill Reward (₹)</label>
              <input
                type="number"
                value={form.perKillReward}
                onChange={e => update('perKillReward', e.target.value)}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Per Kill Points</label>
              <input
                type="number"
                value={form.perKillPoint}
                onChange={e => update('perKillPoint', e.target.value)}
                placeholder="1"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          {/* Prize Distribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Prize Distribution (Exact Amount in ₹)</label>
              <span className={`text-xs font-bold ${isPrizeValid ? 'text-green-400' : 'text-red-400'}`}>
                Total: ₹{totalPrizeAmount} {!isPrizeValid && `(Prize Pool ₹${form.prizePool || 0} ke barabar hona chahiye)`}
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(prizeDistrib).map(([rank, amt]) => (
                <div key={rank} className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 w-16">Rank #{rank}</span>
                  <span className="text-sm text-gray-500">₹</span>
                  <input
                    type="number"
                    value={amt}
                    onChange={e => setPrizeDistrib(p => ({ ...p, [rank]: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                  {Object.keys(prizeDistrib).length > 1 && (
                    <button type="button" onClick={() => {
                      const n = { ...prizeDistrib }; delete n[rank]; setPrizeDistrib(n)
                    }}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const nextRank = (Math.max(...Object.keys(prizeDistrib).map(Number)) + 1).toString()
                  setPrizeDistrib(p => ({ ...p, [nextRank]: '0' }))
                }}
                className="text-xs text-orange-400 flex items-center gap-1 hover:text-orange-300"
              >
                <Plus className="w-3 h-3" /> Add Rank
              </button>
            </div>
          </div>
        </div>

        {/* Point Table */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Point Table</h2>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(pointTable).map(([rank, pts]) => (
              <div key={rank} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 w-12">Rank {rank}</span>
                <input
                  type="number"
                  value={pts}
                  onChange={e => setPointTable(p => ({ ...p, [rank]: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Rules
          </h2>
          <textarea
            value={form.rulesText}
            onChange={e => update('rulesText', e.target.value)}
            placeholder="Tournament rules yahan likho..."
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm resize-none"
          />
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Banner URL (optional)</label>
            <input
              value={form.bannerUrl}
              onChange={e => update('bannerUrl', e.target.value)}
              placeholder="https://... tournament ka banner image URL"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isPrizeValid}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-all active:scale-95"
        >
          {loading ? 'Create ho raha hai...' : '🎮 Tournament Publish Karo'}
        </button>
      </form>
    </div>
  )
}
