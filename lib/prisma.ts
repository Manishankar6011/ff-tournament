import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (connectionString) {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }
  // Fallback: plain client (will use DATABASE_URL from env at runtime)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Lazy singleton — client is created only on first actual use, not at import time
function getPrismaClient(): PrismaClient {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient()
  }
  return global.__prisma
}

// Proxy so `prisma.user.findMany(...)` etc. work normally
// but the actual PrismaClient is never instantiated during build
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }
    return (getPrismaClient() as never)[prop]
  },
})

export default prisma
