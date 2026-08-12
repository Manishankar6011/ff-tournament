'use client'

import { Share2, Copy } from 'lucide-react'
import { toast } from 'sonner'

export function ShareBanner({ dbUser }: { dbUser: any }) {
  if (!dbUser) return null // Must be logged in
  if (!dbUser.referralCode) return null // Wait for backfill or new user

  const shareUrl = `${window.location.origin}/?ref=${dbUser.referralCode}`
  const shareText = `Maine FF Tournament app join kiya hai, daily free fire khelo aur paise jeeto! Abhi is link se join karo: `

  const handleShare = async () => {
    try {
      const shareData = {
        title: 'FF Tournament - Play & Win',
        text: shareText,
        url: shareUrl
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        toast.success('Referral link copy ho gaya, dosto ko bhej do!')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div className="px-4 pt-4">
      <div 
        onClick={handleShare}
        className="glass-card rounded-2xl p-4 flex flex-col gap-3 cursor-pointer border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Refer & Earn ₹5</h3>
              <p className="text-xs text-green-400">Har naye dost par ₹5 payein!</p>
            </div>
          </div>
          <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/20">
            Share Now
          </div>
        </div>
        
        <div className="bg-black/20 rounded-xl p-2.5 flex items-center justify-between border border-white/5" onClick={(e) => e.stopPropagation()}>
          <code className="text-xs text-gray-300 truncate w-4/5">{shareUrl}</code>
          <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
