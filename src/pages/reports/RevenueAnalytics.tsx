import { useErpStore } from '@/stores/useErpStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { DollarSign, TrendingUp, Truck, MapPin } from 'lucide-react'

export default function RevenueAnalytics() {
  const { getFilteredTransactions, companies, selectedCompanyId } =
    useErpStore()

  // Filter States
  const [routeFilter, setRouteFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Data Preparation
  const transactions = getFilteredTransactions().filter(
    (t) => t.type === 'revenue',
  )

  // Apply Filters
  const filteredData = transactions.filter((t) => {
    if (routeFilter !== 'all') {
      const route = `${t.origin}-${t.destination}`
      if (route !== routeFilter) return false
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (periodFilter === 'current_month') {
      const d = new Date(t.date)
      const now = new Date()
      if (
        d.getMonth() !== now.getMonth() ||
        d.getFullYear() !== now.getFullYear()
      )
        return false
    }
    return true
  })

  // Aggregations
  const totalRevenue = filteredData.reduce((acc, t) => acc + t.value, 0)
  const totalDocs = filteredData.length
  const avgTicket = totalDocs > 0 ? totalRevenue / totalDocs : 0

  // Chart Data: Revenue by Category
  const revenueByCategory = Object.entries(
    filteredData.reduce(
      (acc, t) => {
        const cat = t.category || 'Uncategorized'
        acc[cat] = (acc[cat] || 0) + t.value
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }))

  // Chart Data: Top Routes
  const revenueByRoute = Object.entries(
    filteredData.reduce(
      (acc, t) => {
        if (t.origin && t.destination) {
          const route = `${t.origin} -> ${t.destination}`
          acc[route] = (acc[route] || 0) + t.value
        }
        return acc
      },
      {} as Record<string, number>,
    ),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Chart Data: Trend
  const revenueTrend = Object.entries(
    filteredData.reduce(
      (acc, t) => {
        const date = t.date.substring(0, 7) // YYYY-MM
        acc[date] = (acc[date] || 0) + t.value
        return acc
      },
      {} as Record<string, number>,
    ),
  )
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const chartConfig = {
    value: { label: 'Receita', color: 'hsl(var(--primary))' },
  }

  const colors = ['#0ea5e9', '#22c55e', '#eab308', '#f43f5e', '#8b5cf6']

  // Unique Routes for Filter
  const uniqueRoutes = Array.from(
    new Set(
      transactions
        .filter((t) => t.origin && t.destination)
        .map((t) => `${t.origin}-${t.destination}`),
    ),
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Análise de Receita Avançada
        </h1>
        <p className="text-muted-foreground">
          Dashboard analítico de performance comercial e operacional.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1 w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">
              Rota
            </label>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Rotas</SelectItem>
                {uniqueRoutes.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace('-', ' -> ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">
              Período
            </label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todo o Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="current_month">Mês Atual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">
              Status Fiscal
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Autorizado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgTicket)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por documento emitido
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Volume de Emissões
            </CardTitle>
            <Truck className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocs}</div>
            <p className="text-xs text-muted-foreground">
              Documentos (CT-e/NFS-e)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Categoria</CardTitle>
            <CardDescription>
              Distribuição financeira por tipo de serviço.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.name}
                >
                  {revenueByCategory.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Rotas (Origem/Destino)</CardTitle>
            <CardDescription>Trechos mais rentáveis.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={revenueByRoute}
                layout="vertical"
                margin={{ left: 40 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tendência de Receita</CardTitle>
            <CardDescription>Evolução mensal do faturamento.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
