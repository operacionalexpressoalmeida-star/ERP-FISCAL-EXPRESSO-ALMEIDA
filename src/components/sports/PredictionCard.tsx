import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MatchPrediction } from '@/lib/sports-math'
import { Trophy, Percent, TrendingUp, AlertTriangle } from 'lucide-react'

interface PredictionCardProps {
  prediction: MatchPrediction
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const formatProb = (val: number) => `${(val * 100).toFixed(1)}%`

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* Main Probabilities */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Probabilidades de Resultado (1X2)
          </CardTitle>
          <CardDescription>
            Estimativa baseada em força relativa e fator casa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>{prediction.homeTeam} (Casa)</span>
              <span>{formatProb(prediction.winProb)}</span>
            </div>
            <Progress
              value={prediction.winProb * 100}
              className="h-2 bg-slate-100 [&>div]:bg-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Empate</span>
              <span>{formatProb(prediction.drawProb)}</span>
            </div>
            <Progress
              value={prediction.drawProb * 100}
              className="h-2 bg-slate-100 [&>div]:bg-slate-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>{prediction.awayTeam} (Fora)</span>
              <span>{formatProb(prediction.lossProb)}</span>
            </div>
            <Progress
              value={prediction.lossProb * 100}
              className="h-2 bg-slate-100 [&>div]:bg-blue-500"
            />
          </div>

          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-center">
            <div className="bg-muted/20 p-2 rounded">
              <span className="block text-xs text-muted-foreground">
                xG Casa
              </span>
              <span className="text-xl font-bold text-emerald-700">
                {prediction.homeXg.toFixed(2)}
              </span>
            </div>
            <div className="bg-muted/20 p-2 rounded">
              <span className="block text-xs text-muted-foreground">
                xG Fora
              </span>
              <span className="text-xl font-bold text-blue-700">
                {prediction.awayXg.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exact Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Top 5 Placares Prováveis
          </CardTitle>
          <CardDescription>
            Resultados exatos mais frequentes no modelo Poisson.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {prediction.exactScores.map((score, idx) => (
              <div
                key={score.score}
                className="flex items-center justify-between p-2 rounded hover:bg-muted/50 border border-transparent hover:border-border transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-mono text-lg font-bold">
                    {score.score}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={score.probability * 100 * 4}
                    className="w-24 h-1.5"
                  />
                  {/* Multiplied by 4 visually to make bar visible for small probs */}
                  <span className="text-sm font-medium w-12 text-right">
                    {formatProb(score.probability)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Derived Markets */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-purple-500" />
            Mercados Derivados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-4 border-r pr-4 last:border-0">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Ambas Marcam (BTTS)
              </h4>
              <div className="flex justify-between items-center">
                <span>Sim</span>
                <span className="font-bold text-emerald-600">
                  {formatProb(prediction.bttsProb)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Não</span>
                <span className="font-bold text-rose-600">
                  {formatProb(1 - prediction.bttsProb)}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-r pr-4 last:border-0">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Over 1.5
              </h4>
              <div className="flex justify-between">
                <span>Over</span>
                <span className="font-bold">
                  {formatProb(prediction.overUnder.o15)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Under</span>
                <span className="text-muted-foreground">
                  {formatProb(prediction.overUnder.u15)}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-r pr-4 last:border-0">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Over 2.5
              </h4>
              <div className="flex justify-between">
                <span>Over</span>
                <span className="font-bold">
                  {formatProb(prediction.overUnder.o25)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Under</span>
                <span className="text-muted-foreground">
                  {formatProb(prediction.overUnder.u25)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Over 3.5
              </h4>
              <div className="flex justify-between">
                <span>Over</span>
                <span className="font-bold">
                  {formatProb(prediction.overUnder.o35)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Under</span>
                <span className="text-muted-foreground">
                  {formatProb(prediction.overUnder.u35)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/10 border-t py-3">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            Isenção de responsabilidade: Este sistema é puramente estatístico.
            Não garantimos resultados. Não constitui recomendação de aposta.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
