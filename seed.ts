import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(20, 0, 0, 0) // 8:00 PM tomorrow

  const tournament = await prisma.tournament.create({
    data: {
      title: 'Free Fire Grand Battle (Test)',
      description: 'Test tournament for platform verification',
      mode: 'squad',
      map: 'bermuda',
      matchDatetime: tomorrow,
      entryFee: 20,
      prizePool: 500,
      perKillReward: 5,
      maxSlots: 12,
      status: 'upcoming',
      roomId: '',
      roomPassword: ''
    }
  })
  
  console.log('Dummy tournament created:', tournament.id)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
