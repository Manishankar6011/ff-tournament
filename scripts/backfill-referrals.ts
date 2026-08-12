import { config } from 'dotenv'
config({ path: '.env.local' })
import { prisma } from '../lib/prisma'

async function main() {
  console.log('Starting backfill of referral codes...')
  const users = await prisma.user.findMany({
    where: {
      referralCode: null,
    },
  })

  console.log(`Found ${users.length} users without a referral code.`)

  for (const user of users) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code },
    })
    console.log(`Updated user ${user.name} with code ${code}`)
  }

  console.log('Backfill complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
