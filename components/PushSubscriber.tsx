'use client'

import { useEffect, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { toast } from 'sonner'

export function PushSubscriber() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'default') {
        // Show prompt after a short delay
        const timer = setTimeout(() => setShowPrompt(true), 3000)
        return () => clearTimeout(timer)
      } else if (Notification.permission === 'granted') {
        subscribeToPush()
      }
    }
  }, [])

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      // Send to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })
    } catch (error) {
      console.error('Failed to subscribe to push', error)
    }
  }

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      setShowPrompt(false)
      
      if (perm === 'granted') {
        await subscribeToPush()
        toast.success('Notifications enabled!')
      } else {
        toast.error('Notifications blocked')
      }
    } catch (error) {
      toast.error('Failed to enable notifications')
    }
    setLoading(false)
  }

  if (!showPrompt || permission !== 'default') return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 glass-card rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex flex-shrink-0 items-center justify-center mt-1">
        <BellRing className="w-5 h-5 text-orange-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-white">Enable Notifications</h3>
        <p className="text-xs text-gray-400 mt-1 mb-3">
          Match start hone se pehle aur wallet updates ka alert paayein!
        </p>
        <div className="flex gap-2">
          <button 
            onClick={handleSubscribe}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-all"
          >
            {loading ? 'Wait...' : 'Turn On'}
          </button>
          <button 
            onClick={() => setShowPrompt(false)}
            className="px-4 py-2 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 active:scale-95 transition-all"
          >
            Not Now
          </button>
        </div>
      </div>
      <button 
        onClick={() => setShowPrompt(false)}
        className="p-1 text-gray-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
