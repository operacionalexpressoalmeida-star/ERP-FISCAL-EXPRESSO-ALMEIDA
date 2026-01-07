import { useErpStore } from '@/stores/useErpStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useMemo } from 'react'
import { Truck, DollarSign, Package } from 'lucide-react'

export default function FreightDashboard() {
  const { getFilteredTransactions } = useErpStore()
  const [dateRange, setDateRange] = useState('30')
  const [statusFilter, setStatusFilter] = useState('all')

  const transactions = getFilteredTransactions().filter(
    (t) => t.type === 'revenue',
  )

  const filteredData = useMemo(() => {
    const now = new Date()
    const cutoffDate = new Date()
    cutoffDate.setDate(now.getDate() - parseInt(dateRange))

    return transactions.filter((t) => {
      const txDate = new Date(t.date)
      const matchesDate = txDate >= cutoffDate
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : t.freightStatus === statusFilter ||
            (statusFilter === 'NoStatus' && !t.freightStatus)

      return matchesDate && matchesStatus
    })
  }, [transactions, dateRange, statusFilter])

  // KPIs
  const totalFreightValue = filteredData.reduce((acc, t) => acc + t.value, 0)
  const totalVolume = filteredData.length
  const activeFreights = filteredData.filter(
    (t) => t.freightStatus === 'In Transit',
  ).length

  // Charts Data
  const volumeByRecipient = Object.entries(
    filteredData.reduce(
      (acc, t) => {
        const name = t.takerName || 'Desconhecido'
        acc[name] = (acc[name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const freightStatusData = Object.entries(
    filteredData.reduce(
      (acc, t) => {
        const status = t.freightStatus || 'Não Definido'
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }))

  const trendData = Object.entries(
    filteredData.reduce(
      (acc, t) => {
        const date = t.date.substring(5, 10) // MM-DD
        acc[date] = (acc[date] || 0) + t.value
        return acc
      },
      {} as Record<string, number>,
    ),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  const chartConfig = {
    value: { label: 'Valor', color: 'hsl(var(--primary))' },
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard de Fretes
          </h1>
          <p className="text-muted-foreground">
            Análise operacional de cargas e logística.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status Logístico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="In Transit">Em Trânsito</SelectItem>
              <SelectItem value="Delivered">Entregue</SelectItem>
              <SelectItem value="Planned">Planejado</SelectItem>
              <SelectItem value="NoStatus">Sem Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total de Frete
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFreightValue)}
            </div>
            <p className="text-xs text-muted-foreground">No período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVolume}</div>
            <p className="text-xs text-muted-foreground">CT-es emitidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFreights}</div>
            <p className="text-xs text-muted-foreground">Cargas ativas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status Logístico</CardTitle>
            <CardDescription>Distribuição de status das cargas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={freightStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {freightStatusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução de Valor Diário</CardTitle>
            <CardDescription>Tendência de faturamento de frete</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
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

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Tomadores (Volume)</CardTitle>
            <CardDescription>
              Maiores clientes por quantidade de cargas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={volumeByRecipient}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
