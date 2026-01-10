import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { LEAGUE_AVERAGES } from '@/lib/sports-math'
import { useSportsStore } from '@/stores/useSportsStore'
import { Activity, Users, TrendingUp, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function SportsDashboard() {
  const { teams } = useSportsStore()

  const leagues = [
    { id: 'BR_A', name: 'Brasileirão Série A', country: 'Brasil' },
    { id: 'BR_B', name: 'Brasileirão Série B', country: 'Brasil' },
    { id: 'DE_1', name: 'Bundesliga', country: 'Alemanha' },
    { id: 'IT_1', name: 'Serie A', country: 'Itália' },
    { id: 'ES_1', name: 'LaLiga', country: 'Espanha' },
    { id: 'FR_1', name: 'Ligue 1', country: 'França' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sports Analytics
          </h1>
          <p className="text-muted-foreground">
            Módulo de inteligência estatística para futebol internacional.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/sports/teams">Gerenciar Times</Link>
          </Button>
          <Button asChild>
            <Link to="/sports/match">Nova Análise de Partida</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clubes Monitorados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">
              Em 6 ligas suportadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ligas Ativas</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagues.length}</div>
            <p className="text-xs text-muted-foreground">BR, DE, IT, ES, FR</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status do Modelo
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Ativo</div>
            <p className="text-xs text-muted-foreground">Poisson Engine v1.0</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-4">Indicadores de Liga</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leagues.map((league) => {
          // @ts-expect-error
          const stats = LEAGUE_AVERAGES[league.id]
          const teamCount = teams.filter((t) => t.leagueId === league.id).length

          return (
            <Card key={league.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{league.name}</CardTitle>
                <CardDescription>{league.country}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Média Gols Casa:
                    </span>
                    <span className="font-semibold">
                      {stats.homeGoals.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Média Gols Fora:
                    </span>
                    <span className="font-semibold">
                      {stats.awayGoals.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="text-muted-foreground">
                      Times na base:
                    </span>
                    <span className="bg-muted px-2 rounded-full text-xs font-medium flex items-center">
                      {teamCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
