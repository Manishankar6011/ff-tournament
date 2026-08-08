'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Handle the case where the app is already installed
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
    })

    // If it's already in standalone mode, it's installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
  }

  if (!isInstallable) return null

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center justify-center gap-2 w-full py-4 mt-4 rounded-2xl text-white font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
    >
      <Download className="w-5 h-5" />
      Install App on Home Screen
    </button>
  )
}
