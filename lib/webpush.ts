import webpush from 'web-push'

const initWebPush = () => {
  webpush.setVapidDetails(
    'mailto:admin@ff-tournament.com', // Update this with a valid email
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  )
}

initWebPush()

export const sendPushNotification = async (subscription: any, payload: any) => {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    )
    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

export const sendAppNotification = async (userId: string, title: string, message: string, type: string = 'info', url: string = '/') => {
  try {
    // 1. Save to database
    // We import prisma dynamically here to avoid circular dependencies if any
    const { prisma } = await import('@/lib/prisma')
    
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    })

    // 2. Send Push Notification if subscribed
    const subs = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    const payload = { title, body: message, url, icon: '/logo.png' }

    for (const sub of subs) {
      await sendPushNotification(sub.keys ? { endpoint: sub.endpoint, keys: sub.keys } : sub, payload)
    }

  } catch (error) {
    console.error('Failed to send app notification:', error)
  }
}
