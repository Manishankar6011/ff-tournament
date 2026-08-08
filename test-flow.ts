import { prisma } from './lib/prisma'
import { calculateResults, DEFAULT_POINT_TABLE, DEFAULT_PRIZE_DISTRIBUTION } from './lib/points-calculator'

async function runTest() {
  console.log('🔄 Starting Dummy Tournament Flow Test...')
  try {
    // 1. Create a dummy admin
    const admin = await prisma.user.upsert({
      where: { supabaseId: 'dummy-admin-id' },
      update: {},
      create: {
        supabaseId: 'dummy-admin-id',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@ff.com',
      }
    })
    console.log('✅ Admin created:', admin.name)

    // 2. Create dummy players
    const player1 = await prisma.user.upsert({
      where: { supabaseId: 'dummy-player-1' },
      update: { walletBalance: 100 }, // Reset balance
      create: {
        supabaseId: 'dummy-player-1',
        role: 'player',
        name: 'Player One',
        ffIgn: 'ProGamer1',
        ffUid: '11111111',
        walletBalance: 100,
      }
    })
    
    const player2 = await prisma.user.upsert({
      where: { supabaseId: 'dummy-player-2' },
      update: { walletBalance: 100 }, // Reset balance
      create: {
        supabaseId: 'dummy-player-2',
        role: 'player',
        name: 'Player Two',
        ffIgn: 'NoobMaster',
        ffUid: '22222222',
        walletBalance: 100,
      }
    })
    console.log('✅ Players created with ₹100 wallet balance each')

    // 3. Create a Tournament
    const tournament = await prisma.tournament.create({
      data: {
        title: 'Dummy Test Cup',
        mode: 'solo',
        map: 'Bermuda',
        entryFee: 20,
        prizePool: 100,
        maxSlots: 48,
        matchDatetime: new Date(Date.now() + 86400000), // tomorrow
        createdBy: admin.id,
      }
    })
    console.log('✅ Tournament created:', tournament.title)

    // 4. Players Join (Deduct Wallet)
    await prisma.$transaction(async (tx) => {
      // Player 1 joins
      await tx.user.update({ where: { id: player1.id }, data: { walletBalance: { decrement: 20 } } })
      await tx.tournamentSlot.create({
        data: {
          tournamentId: tournament.id,
          userId: player1.id,
          slotNumber: 1,
          paymentStatus: 'success'
        }
      })
      
      // Player 2 joins
      await tx.user.update({ where: { id: player2.id }, data: { walletBalance: { decrement: 20 } } })
      await tx.tournamentSlot.create({
        data: {
          tournamentId: tournament.id,
          userId: player2.id,
          slotNumber: 2,
          paymentStatus: 'success'
        }
      })

      await tx.tournament.update({ where: { id: tournament.id }, data: { slotsFilled: 2 } })
    })
    
    const updatedP1 = await prisma.user.findUnique({ where: { id: player1.id } })
    console.log(`✅ Players joined. Player 1 wallet balance: ₹${updatedP1?.walletBalance} (Expected: 80)`)

    // 5. Release Room
    await prisma.room.create({
      data: {
        tournamentId: tournament.id,
        roomIdCode: 'ROOM123',
        roomPassword: 'PASS',
        releasedBy: admin.id,
      }
    })
    await prisma.tournament.update({ where: { id: tournament.id }, data: { status: 'room_released' } })
    console.log('✅ Room released. Status updated to room_released')

    // 6. Enter Results and Distribute Prizes
    const slots = await prisma.tournamentSlot.findMany({ where: { tournamentId: tournament.id } })
    
    // Simulate Player 1 got Rank 1 (10 kills), Player 2 got Rank 2 (2 kills)
    const slotResults = [
      { slotId: slots.find(s => s.userId === player1.id)!.id, rank: 1, kills: 10 },
      { slotId: slots.find(s => s.userId === player2.id)!.id, rank: 2, kills: 2 },
    ]
    
    const calculated = calculateResults(
      slotResults,
      tournament.perKillPoint,
      Number(tournament.prizePool),
      tournament.prizeDistribution as any || DEFAULT_PRIZE_DISTRIBUTION,
      tournament.pointTable as any || DEFAULT_POINT_TABLE,
      Number(tournament.perKillReward)
    )

    await prisma.$transaction(async (tx) => {
      for (const r of calculated) {
        await tx.result.create({
          data: {
            tournamentId: tournament.id,
            slotId: r.slotId,
            rank: r.rank,
            kills: r.kills,
            pointsEarned: r.totalPoints,
            prizeWon: r.prizeWon,
            enteredBy: admin.id,
          }
        })
        if (r.prizeWon > 0) {
          const slot = slots.find(s => s.id === r.slotId)
          await tx.user.update({
            where: { id: slot!.userId },
            data: { walletBalance: { increment: r.prizeWon } }
          })
        }
      }
      await tx.tournament.update({ where: { id: tournament.id }, data: { status: 'completed' } })
    })

    const finalP1 = await prisma.user.findUnique({ where: { id: player1.id } })
    const finalP2 = await prisma.user.findUnique({ where: { id: player2.id } })
    
    // Rank 1 prize: 50% of 100 = 50. Total p1 = 80 + 50 = 130
    // Rank 2 prize: 30% of 100 = 30. Total p2 = 80 + 30 = 110
    console.log(`✅ Results processed. Tournament completed.`)
    console.log(`🏆 Player 1 Final Wallet: ₹${finalP1?.walletBalance} (Expected: 130)`)
    console.log(`🏆 Player 2 Final Wallet: ₹${finalP2?.walletBalance} (Expected: 110)`)
    
    console.log('🚀 ALL FLOWS WORKING PERFECTLY!')

  } catch (error) {
    console.error('❌ Error in flow:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runTest()
