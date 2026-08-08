'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export function RoomCredential({ label, value }: { label: string; value: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    toast.success(`${label} copy ho gaya!`)
  }

  return (
    <div className="glass-card rounded-2xl p-4 card-gradient-border">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl font-black text-white tracking-wider font-mono">{value}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 bg-orange-500/20 border border-orange-500/30 rounded-xl px-3 py-2 flex items-center gap-1.5 text-orange-400 text-xs font-medium active:scale-95 transition-all"
          title="Copy to clipboard"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
      </div>
    </div>
  )
}
