/**
 * Points Calculator for FF Tournament
 * Calculates placement points + kill points for each slot
 */

export interface PointTableEntry {
  [rank: string]: number
}

export interface SlotResult {
  slotId: string
  rank: number
  kills: number
}

export interface CalculatedResult extends SlotResult {
  placementPoints: number
  killPoints: number
  totalPoints: number
  prizeWon: number
}

// Default point table (configurable per tournament)
export const DEFAULT_POINT_TABLE: PointTableEntry = {
  '1': 15,
  '2': 12,
  '3': 10,
  '4': 8,
  '5': 8,
  '6': 6,
  '7': 6,
  '8': 4,
  '9': 4,
  '10': 2,
  '11': 1,
  '12': 0,
}

// Default prize distribution (percentage of prize pool)
export const DEFAULT_PRIZE_DISTRIBUTION: Record<string, number> = {
  '1': 50,   // 50% to rank 1
  '2': 30,   // 30% to rank 2
  '3': 20,   // 20% to rank 3
}

export function getPlacementPoints(rank: number, pointTable: PointTableEntry): number {
  // Try exact rank first
  if (pointTable[rank.toString()]) {
    return pointTable[rank.toString()]
  }

  // Find the closest rank bracket
  const keys = Object.keys(pointTable)
    .map(Number)
    .sort((a, b) => a - b)

  for (let i = keys.length - 1; i >= 0; i--) {
    if (rank >= keys[i]) {
      return pointTable[keys[i].toString()] || 0
    }
  }

  return 0
}

export function calculateResults(
  slots: SlotResult[],
  perKillPoint: number,
  prizePool: number,
  prizeDistribution: Record<string, number>,
  pointTable: PointTableEntry,
  perKillReward: number = 0,
): CalculatedResult[] {
  return slots.map(slot => {
    const placementPoints = getPlacementPoints(slot.rank, pointTable)
    const killPoints = slot.kills * perKillPoint
    const totalPoints = placementPoints + killPoints

    // Prize from distribution (Now using Exact Amount in Rupees instead of Percentage)
    const placementPrize = prizeDistribution[slot.rank.toString()] || 0

    // Per-kill reward (separate from prize pool distribution)
    const killPrize = slot.kills * perKillReward

    const prizeWon = placementPrize + killPrize

    return {
      ...slot,
      placementPoints,
      killPoints,
      totalPoints,
      prizeWon: Math.round(prizeWon * 100) / 100,
    }
  })
}

export function rankByPoints(results: CalculatedResult[]): CalculatedResult[] {
  return [...results].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    // Tiebreak: more kills wins
    if (b.kills !== a.kills) return b.kills - a.kills
    // Tiebreak 2: better rank wins
    return a.rank - b.rank
  })
}
