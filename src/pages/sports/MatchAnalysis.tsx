import { useSportsStore } from '@/stores/useSportsStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useState, useMemo } from 'react'
import {
  calculateMatchPrediction,
  MatchPrediction,
  LeagueId,
} from '@/lib/sports-math'
import { PredictionCard } from '@/components/sports/PredictionCard'
import { Calculator, ArrowRight, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function MatchAnalysis() {
  const { getTeamsByLeague } = useSportsStore()
  const [selectedLeague, setSelectedLeague] = useState<LeagueId>('BR_A')
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [prediction, setPrediction] = useState<MatchPrediction | null>(null)

  const teams = useMemo(
    () => getTeamsByLeague(selectedLeague),
    [selectedLeague, getTeamsByLeague],
  )

  const handlePredict = () => {
    const home = teams.find((t) => t.id === homeTeamId)
    const away = teams.find((t) => t.id === awayTeamId)

    if (home && away) {
      const result = calculateMatchPrediction(home, away)
      setPrediction(result)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Análise de Partida
        </h1>
        <p className="text-muted-foreground">
          Simulador de probabilidades baseado em xG e força relativa.
        </p>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle>Configuração do Confronto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Liga</label>
              <Select
                value={selectedLeague}
                onValueChange={(v: any) => {
                  setSelectedLeague(v)
                  setHomeTeamId('')
                  setAwayTeamId('')
                  setPrediction(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR_A">Brasileirão A</SelectItem>
                  <SelectItem value="BR_B">Brasileirão B</SelectItem>
                  <SelectItem value="DE_1">Bundesliga</SelectItem>
                  <SelectItem value="IT_1">Serie A</SelectItem>
                  <SelectItem value="ES_1">LaLiga</SelectItem>
                  <SelectItem value="FR_1">Ligue 1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium flex justify-between">
                Time da Casa
                {homeTeamId && (
                  <Badge
                    variant="outline"
                    className="text-emerald-600 bg-emerald-50"
                  >
                    Mandante
                  </Badge>
                )}
              </label>
              <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      disabled={t.id === awayTeamId}
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1 flex justify-center pb-2">
              <ArrowRight className="text-muted-foreground h-6 w-6" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium flex justify-between">
                Visitante
                {awayTeamId && (
                  <Badge variant="outline" className="text-blue-600 bg-blue-50">
                    Visitante
                  </Badge>
                )}
              </label>
              <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      disabled={t.id === homeTeamId}
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
              className="w-full md:w-[300px]"
              disabled={!homeTeamId || !awayTeamId}
              onClick={handlePredict}
            >
              {prediction ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <Calculator className="mr-2 h-4 w-4" />
              )}
              {prediction ? 'Recalcular' : 'Gerar Previsão'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {prediction && <PredictionCard prediction={prediction} />}
    </div>
  )
}
