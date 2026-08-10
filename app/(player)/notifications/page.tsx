'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle, ArrowDownLeft, ArrowUpRight, Trophy, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    markAsRead()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (Array.isArray(data)) setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PUT' })
    } catch (error) {
      console.error('Failed to mark as read', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit': return <ArrowDownLeft className="w-5 h-5 text-green-400" />
      case 'withdrawal': return <ArrowUpRight className="w-5 h-5 text-red-400" />
      case 'tournament': return <Trophy className="w-5 h-5 text-orange-400" />
      case 'match_alert': return <Clock className="w-5 h-5 text-yellow-400" />
      default: return <Bell className="w-5 h-5 text-blue-400" />
    }
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
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4 flex justify-between items-center">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-400" />
          Alerts
        </h1>
      </div>

      <div className="p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-10">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 font-medium">Koi naya alert nahi hai</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              className={cn(
                "glass-card p-4 rounded-2xl flex gap-4 items-start transition-all",
                !notif.isRead ? "border border-orange-500/30 bg-orange-500/5" : ""
              )}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className={cn("text-sm font-bold", !notif.isRead ? "text-orange-400" : "text-white")}>
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-snug">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
