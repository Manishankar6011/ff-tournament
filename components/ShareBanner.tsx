'use client'

import { useState } from 'react'
import { Share2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ShareBanner({ dbUser }: { dbUser: any }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!dbUser) return null // Must be logged in to see/claim
  if (dbUser.hasClaimedShareBonus) return null // Already claimed, hide banner

  const handleShare = async () => {
    try {
      const shareData = {
        title: 'FF Tournament - Play & Win',
        text: 'Maine FF Tournament app join kiya hai, daily free fire khelo aur paise jeeto! Abhi join karo.',
        url: window.location.origin
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        toast.success('Link copy ho gaya, dosto ko bhej do!')
      }

      // Automatically claim bonus after sharing attempt
      setLoading(true)
      const res = await fetch('/api/user/share-bonus', {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        router.refresh() // Refresh page to update wallet balance and hide banner
      } else {
        toast.error(data.error || 'Bonus claim fail ho gaya')
      }
    } catch (err) {
      console.error(err)
      // Usually user cancelled share, don't show error but don't give bonus if they cancelled immediately, though navigator.share throws AbortError if cancelled.
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-4">
      <div 
        onClick={loading ? undefined : handleShare}
        className="glass-card rounded-2xl p-4 flex items-center justify-between cursor-pointer border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Share App & Get ₹5</h3>
            <p className="text-xs text-green-400">Apne dosto ke sath share karein aur turant ₹5 payein!</p>
          </div>
        </div>
        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/20">
          {loading ? 'Claiming...' : 'Claim ₹5'}
        </div>
      </div>
    </div>
  )
}
