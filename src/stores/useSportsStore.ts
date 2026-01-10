import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TeamMetrics, LeagueId, LEAGUE_AVERAGES } from '@/lib/sports-math'

interface SportsState {
  teams: TeamMetrics[]
  addTeam: (team: TeamMetrics) => void
  updateTeam: (id: string, data: Partial<TeamMetrics>) => void
  deleteTeam: (id: string) => void
  getTeamsByLeague: (leagueId: LeagueId) => TeamMetrics[]
  resetMockData: () => void
}

// Initial Mock Data Generator
const generateMockTeams = (): TeamMetrics[] => {
  return [
    // BR_A
    {
      id: 'bra_flamengo',
      name: 'Flamengo',
      leagueId: 'BR_A',
      attackStrengthHome: 1.35,
      attackStrengthAway: 1.15,
      defenseWeaknessHome: 0.7,
      defenseWeaknessAway: 0.9,
      avgGoalsForHome: 1.9,
      avgGoalsForAway: 1.4,
      avgGoalsConcededHome: 0.6,
      avgGoalsConcededAway: 1.1,
      recentForm: ['W', 'W', 'D', 'W', 'L'],
    },
    {
      id: 'bra_palmeiras',
      name: 'Palmeiras',
      leagueId: 'BR_A',
      attackStrengthHome: 1.4,
      attackStrengthAway: 1.1,
      defenseWeaknessHome: 0.65,
      defenseWeaknessAway: 0.8,
      avgGoalsForHome: 2.0,
      avgGoalsForAway: 1.3,
      avgGoalsConcededHome: 0.5,
      avgGoalsConcededAway: 0.9,
      recentForm: ['D', 'W', 'W', 'W', 'W'],
    },
    {
      id: 'bra_vasco',
      name: 'Vasco da Gama',
      leagueId: 'BR_A',
      attackStrengthHome: 1.1,
      attackStrengthAway: 0.9,
      defenseWeaknessHome: 1.1,
      defenseWeaknessAway: 1.3,
      avgGoalsForHome: 1.4,
      avgGoalsForAway: 0.8,
      avgGoalsConcededHome: 1.2,
      avgGoalsConcededAway: 1.6,
      recentForm: ['L', 'D', 'W', 'L', 'D'],
    },
    // DE_1
    {
      id: 'de_bayern',
      name: 'Bayern München',
      leagueId: 'DE_1',
      attackStrengthHome: 1.8,
      attackStrengthAway: 1.6,
      defenseWeaknessHome: 0.6,
      defenseWeaknessAway: 0.7,
      avgGoalsForHome: 3.1,
      avgGoalsForAway: 2.4,
      avgGoalsConcededHome: 0.8,
      avgGoalsConcededAway: 1.0,
      recentForm: ['W', 'W', 'W', 'L', 'W'],
    },
    {
      id: 'de_dortmund',
      name: 'Borussia Dortmund',
      leagueId: 'DE_1',
      attackStrengthHome: 1.6,
      attackStrengthAway: 1.4,
      defenseWeaknessHome: 0.9,
      defenseWeaknessAway: 1.1,
      avgGoalsForHome: 2.8,
      avgGoalsForAway: 1.9,
      avgGoalsConcededHome: 1.2,
      avgGoalsConcededAway: 1.5,
      recentForm: ['W', 'D', 'W', 'W', 'D'],
    },
    // ES_1
    {
      id: 'es_real',
      name: 'Real Madrid',
      leagueId: 'ES_1',
      attackStrengthHome: 1.5,
      attackStrengthAway: 1.4,
      defenseWeaknessHome: 0.6,
      defenseWeaknessAway: 0.7,
      avgGoalsForHome: 2.4,
      avgGoalsForAway: 1.8,
      avgGoalsConcededHome: 0.6,
      avgGoalsConcededAway: 0.9,
      recentForm: ['W', 'W', 'W', 'W', 'D'],
    },
    {
      id: 'es_barca',
      name: 'FC Barcelona',
      leagueId: 'ES_1',
      attackStrengthHome: 1.6,
      attackStrengthAway: 1.3,
      defenseWeaknessHome: 0.7,
      defenseWeaknessAway: 0.8,
      avgGoalsForHome: 2.5,
      avgGoalsForAway: 1.7,
      avgGoalsConcededHome: 0.8,
      avgGoalsConcededAway: 1.0,
      recentForm: ['W', 'L', 'W', 'D', 'W'],
    },
  ]
}

export const useSportsStore = create<SportsState>()(
  persist(
    (set, get) => ({
      teams: generateMockTeams(),

      addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),

      updateTeam: (id, data) =>
        set((state) => ({
          teams: state.teams.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      deleteTeam: (id) =>
        set((state) => ({ teams: state.teams.filter((t) => t.id !== id) })),

      getTeamsByLeague: (leagueId) => {
        return get().teams.filter((t) => t.leagueId === leagueId)
      },

      resetMockData: () => set({ teams: generateMockTeams() }),
    }),
    {
      name: 'sports-analytics-store',
    },
  ),
)
