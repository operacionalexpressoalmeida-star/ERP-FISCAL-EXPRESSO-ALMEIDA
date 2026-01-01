import { useErpStore } from '@/stores/useErpStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Wallet,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

export default function Index() {
  const { getFilteredTransactions, companies, selectedCompanyId } =
    useErpStore()
  // Filter only approved for financial stats
  const transactions = getFilteredTransactions().filter(
    (t) => t.status === 'approved',
  )

  // KPIs
  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((acc, t) => acc + t.value, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0)

  const totalTaxes = transactions.reduce((acc, t) => {
    // Sum of all taxes from transactions
    return acc + (t.icmsValue || 0) + (t.pisValue || 0) + (t.cofinsValue || 0)
  }, 0)

  const netResult = totalRevenue - totalExpense

  // Chart Data: Revenue vs Expense
  const chartData = [
    {
      name: 'Receita Bruta',
      value: totalRevenue,
      color: 'hsl(var(--primary))',
    },
    {
      name: 'Despesas Totais',
      value: totalExpense,
      color: 'hsl(var(--destructive))',
    },
    {
      name: 'Impostos (Aprox)',
      value: totalTaxes,
      color: 'hsl(var(--secondary))',
    },
    {
      name: 'Resultado Líquido',
      value: netResult,
      color: 'hsl(var(--chart-3))',
    },
  ]

  const chartConfig = {
    value: { label: 'Valor', color: 'hsl(var(--primary))' },
  }

  const contextName =
    selectedCompanyId === 'consolidated'
      ? 'Todas as Empresas'
      : companies.find((c) => c.id === selectedCompanyId)?.name

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Financeiro
        </h1>
        <p className="text-muted-foreground">
          Visão geral:{' '}
          <span className="font-semibold text-foreground">{contextName}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Período Atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas Totais
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              Operacionais e Administrativas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Impostos Destacados
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTaxes)}
            </div>
            <p className="text-xs text-muted-foreground">ICMS, PIS, COFINS</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resultado Líquido
            </CardTitle>
            <Wallet className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netResult >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {formatCurrency(netResult)}
            </div>
            <p className="text-xs text-muted-foreground">Antes do IRPJ/CSLL</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Financeira</CardTitle>
            <CardDescription>
              Comparativo de movimentação financeira.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas transações contabilizadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {t.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div
                    className={`font-medium ${t.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {t.type === 'revenue' ? '+' : '-'}
                    {formatCurrency(t.value)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade recente.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
