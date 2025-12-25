/* Home Page - Dashboard */
import { useCargoStore } from '@/stores/useCargoStore'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  FileText,
  DollarSign,
  Users,
  PlusCircle,
  FileBarChart,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Index() {
  const { loads, responsibles, getResponsibleName } = useCargoStore()

  // KPIs
  const totalCargas = loads.length
  const totalValorCarga = loads.reduce((acc, load) => acc + load.cargoValue, 0)
  const totalValorAssociado = loads.reduce(
    (acc, load) => acc + load.associatedValue,
    0,
  )
  const ativosCount = new Set(loads.map((l) => l.responsibleId)).size

  // Recent Activity
  const recentActivity = [...loads]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)

  // Chart Data: Top 5 Responsibles by Total Load Value
  const responsiblesMap = new Map<string, number>()
  loads.forEach((load) => {
    const current = responsiblesMap.get(load.responsibleId) || 0
    responsiblesMap.set(load.responsibleId, current + load.cargoValue)
  })

  const chartData = Array.from(responsiblesMap.entries())
    .map(([id, value]) => ({
      name: getResponsibleName(id),
      value: value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const chartConfig = {
    value: {
      label: 'Valor Total',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Cargas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCargas}</div>
            <p className="text-xs text-muted-foreground">
              Registros no sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Valores (Carga)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValorCarga)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de valores declarados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Valores (Assoc.)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {formatCurrency(totalValorAssociado)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de valores associados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Responsáveis Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ativosCount}</div>
            <p className="text-xs text-muted-foreground">
              Com cargas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top Responsáveis por Volume</CardTitle>
            <CardDescription>
              Os 5 maiores responsáveis em valor total de carga.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={100}
                />
                <XAxis dataKey="value" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" fill="var(--color-value)" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas 5 cargas registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentActivity.map((load) => (
                <div key={load.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getResponsibleName(load.responsibleId)}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {load.requestNumber}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {formatCurrency(load.associatedValue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button asChild size="lg" className="h-24 text-lg" variant="outline">
          <Link to="/cadastro" className="flex flex-col gap-2">
            <PlusCircle className="h-8 w-8 text-primary" />
            Cadastrar Nova Carga
          </Link>
        </Button>
        <Button asChild size="lg" className="h-24 text-lg" variant="outline">
          <Link to="/relatorios" className="flex flex-col gap-2">
            <FileBarChart className="h-8 w-8 text-secondary" />
            Visualizar Relatórios
          </Link>
        </Button>
      </div>
    </div>
  )
}
