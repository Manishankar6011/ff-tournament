'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Gamepad2, Hash, ChevronRight, Flame, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

export default function SetupProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ name: '', phone: '', ffUid: '', ffIgn: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.ffUid || !form.ffIgn) {
      toast.error('Sab fields bharo')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Profile setup failed')

      toast.success('Profile ban gaya! 🎉')
      router.push('/')
    } catch {
      toast.error('Kuch gadbad ho gayi, dobara try karo')
    }
    setLoading(false)
  }

  const fields = [
    {
      key: 'name',
      label: 'Apna Naam',
      placeholder: 'Jaise: Rahul Kumar',
      icon: User,
      type: 'text',
    },
    {
      key: 'phone',
      label: 'WhatsApp Number',
      placeholder: '10 digit mobile number',
      icon: Smartphone,
      type: 'tel',
    },
    {
      key: 'ffUid',
      label: 'Free Fire UID',
      placeholder: '12-digit UID (Profile me milega)',
      icon: Hash,
      type: 'text',
    },
    {
      key: 'ffIgn',
      label: 'In-Game Name (IGN)',
      placeholder: 'Free Fire me jo naam dikh ta hai',
      icon: Gamepad2,
      type: 'text',
    },
  ]

  return (
    <div className="min-h-screen animated-gradient flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mx-auto mb-4 orange-glow">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Profile Setup Karo</h1>
            <p className="text-sm text-gray-400 mt-2">
              Tournaments join karne se pehle apni details bharo
            </p>
          </div>

          {/* Form */}
          <div className="glass-card rounded-2xl p-6 card-gradient-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ key, label, placeholder, icon: Icon, type }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-orange-400" />
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    required
                  />
                </div>
              ))}

              {/* FF UID Help */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                <p className="text-xs text-orange-300/80">
                  💡 FF UID kahan milega? Free Fire app open karo → apna avatar click karo → UID copy karo
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !form.name || !form.phone || !form.ffUid || !form.ffIgn}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? 'Save ho raha hai...' : (
                  <>
                    Profile Complete Karo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
