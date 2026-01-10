/**
 * Sports Analytics Math Library
 * Implements Poisson Distribution and Probability Models for Football
 */

export type LeagueId = 'BR_A' | 'BR_B' | 'DE_1' | 'IT_1' | 'ES_1' | 'FR_1'

export interface TeamMetrics {
  id: string
  name: string
  leagueId: LeagueId
  // Offensive Strength (Relative to League Avg)
  attackStrengthHome: number
  attackStrengthAway: number
  // Defensive Weakness (Relative to League Avg)
  defenseWeaknessHome: number
  defenseWeaknessAway: number
  // Raw Averages
  avgGoalsForHome: number
  avgGoalsForAway: number
  avgGoalsConcededHome: number
  avgGoalsConcededAway: number
  // Recent Form (Last 5)
  recentForm: ('W' | 'D' | 'L')[]
}

// League Base Averages (Mocked based on historical data)
export const LEAGUE_AVERAGES: Record<
  LeagueId,
  { homeGoals: number; awayGoals: number }
> = {
  BR_A: { homeGoals: 1.45, awayGoals: 1.05 }, // ~2.5 total
  BR_B: { homeGoals: 1.3, awayGoals: 0.9 }, // ~2.2 total, lower scoring
  DE_1: { homeGoals: 1.65, awayGoals: 1.35 }, // ~3.0 total, high scoring
  IT_1: { homeGoals: 1.48, awayGoals: 1.15 },
  ES_1: { homeGoals: 1.42, awayGoals: 1.08 },
  FR_1: { homeGoals: 1.4, awayGoals: 1.1 },
}

// Factorial helper
function factorial(n: number): number {
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

// Poisson Probability Mass Function
// P(k; λ) = (e^-λ * λ^k) / k!
function poisson(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k)
}

export interface MatchPrediction {
  homeTeam: string
  awayTeam: string
  homeXg: number
  awayXg: number
  winProb: number
  drawProb: number
  lossProb: number
  bttsProb: number
  overUnder: {
    o05: number
    u05: number
    o15: number
    u15: number
    o25: number
    u25: number
    o35: number
    u35: number
  }
  exactScores: { score: string; probability: number }[]
}

export function calculateMatchPrediction(
  homeTeam: TeamMetrics,
  awayTeam: TeamMetrics,
  useLeagueFallback = false,
): MatchPrediction {
  const league = homeTeam.leagueId
  const averages = LEAGUE_AVERAGES[league]

  // Business Logic: Brazilian Leagues Adjustment
  // BR leagues tend to have higher home advantage variance, we can slighty adjust base expectations
  let homeAdvantageFactor = 1.0
  if (league === 'BR_A' || league === 'BR_B') {
    homeAdvantageFactor = 1.05 // 5% boost to home strength calculation
  }

  // 1. Calculate Expected Goals (xG)
  // Formula: (Team Attack / League Avg Attack) * (Opponent Defense / League Avg Defense) * League Avg
  // If insufficient data (useLeagueFallback), we assume strength is 1.0 (Average)

  const hAttack = useLeagueFallback ? 1.0 : homeTeam.attackStrengthHome
  const aDefense = useLeagueFallback ? 1.0 : awayTeam.defenseWeaknessAway
  const hXg = hAttack * aDefense * averages.homeGoals * homeAdvantageFactor

  const aAttack = useLeagueFallback ? 1.0 : awayTeam.attackStrengthAway
  const hDefense = useLeagueFallback ? 1.0 : homeTeam.defenseWeaknessHome
  const aXg = aAttack * hDefense * averages.awayGoals

  // 2. Probability Distribution (Poisson) for 0-5 goals
  const maxGoals = 5
  const homeProbs: number[] = []
  const awayProbs: number[] = []

  for (let i = 0; i <= maxGoals; i++) {
    homeProbs[i] = poisson(i, hXg)
    awayProbs[i] = poisson(i, aXg)
  }

  // 3. Cross Probabilities (Score Matrix)
  let winP = 0
  let drawP = 0
  let lossP = 0
  let bttsP = 0
  const scoreMatrix: { score: string; prob: number }[] = []

  // Over/Under accumulators (inverse logic: sum prob of having X goals)
  // We'll calculate prob of total goals being <= N to get Under, then 1 - Under for Over.
  // Actually simpler: iterate matrix and sum total goals.
  let probTotal0 = 0
  let probTotal1 = 0
  let probTotal2 = 0
  let probTotal3 = 0

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = homeProbs[h] * awayProbs[a]
      scoreMatrix.push({ score: `${h}-${a}`, prob })

      // 1X2
      if (h > a) winP += prob
      else if (h === a) drawP += prob
      else lossP += prob

      // BTTS
      if (h > 0 && a > 0) bttsP += prob

      // Total Goals
      const total = h + a
      if (total <= 0) probTotal0 += prob
      if (total <= 1) probTotal1 += prob
      if (total <= 2) probTotal2 += prob
      if (total <= 3) probTotal3 += prob
    }
  }

  // Normalize probabilities if they don't sum to 1 (due to capping at 5 goals)
  const totalProbSpace = winP + drawP + lossP
  if (totalProbSpace > 0) {
    winP /= totalProbSpace
    drawP /= totalProbSpace
    lossP /= totalProbSpace
    bttsP /= totalProbSpace // Approximate normalization

    // Sort scores
    scoreMatrix.sort((a, b) => b.prob - a.prob)
    // Normalize top scores just for display correctness relative to the subset?
    // No, display absolute probability
  }

  return {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    homeXg: hXg,
    awayXg: aXg,
    winProb: winP,
    drawProb: drawP,
    lossProb: lossP,
    bttsProb: bttsP,
    overUnder: {
      o05: 1 - probTotal0 / totalProbSpace,
      u05: probTotal0 / totalProbSpace,
      o15: 1 - probTotal1 / totalProbSpace,
      u15: probTotal1 / totalProbSpace,
      o25: 1 - probTotal2 / totalProbSpace,
      u25: probTotal2 / totalProbSpace,
      o35: 1 - probTotal3 / totalProbSpace,
      u35: probTotal3 / totalProbSpace,
    },
    exactScores: scoreMatrix.slice(0, 5).map((s) => ({
      score: s.score,
      probability: s.prob / totalProbSpace,
    })),
  }
}
