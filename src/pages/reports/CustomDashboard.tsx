import { useErpStore } from '@/stores/useErpStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
} from 'recharts'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export default function CustomDashboard() {
  const { getFilteredTransactions, assets } = useErpStore()
  // Filter for approved
  const transactions = getFilteredTransactions().filter(
    (t) => t.status === 'approved',
  )

  // Config State
  const [showRevenueByOrigin, setShowRevenueByOrigin] = useState(true)
  const [showAssetDist, setShowAssetDist] = useState(true)
  const [showExpenseTrend, setShowExpenseTrend] = useState(true)

  // Data Prep
  const revenueByOrigin = Object.entries(
    transactions
      .filter((t) => t.type === 'revenue' && t.origin)
      .reduce(
        (acc, t) => {
          acc[t.origin!] = (acc[t.origin!] || 0) + t.value
          return acc
        },
        {} as Record<string, number>,
      ),
  ).map(([name, value]) => ({ name, value }))

  const assetDistribution = Object.entries(
    assets.reduce(
      (acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }))

  const expenseTrend = transactions
    .filter((t) => t.type === 'expense')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString(),
      value: t.value,
    }))

  const colors = ['#3730a3', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Interativo
          </h1>
          <p className="text-muted-foreground">
            Personalize sua visão gerencial.
          </p>
        </div>
        <Card className="p-4 w-[300px]">
          <h4 className="font-semibold mb-3 text-sm">
            Configuração de Widgets
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="w1"
                checked={showRevenueByOrigin}
                onCheckedChange={(c) => setShowRevenueByOrigin(!!c)}
              />
              <Label htmlFor="w1">Receita por Origem (UF)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="w2"
                checked={showAssetDist}
                onCheckedChange={(c) => setShowAssetDist(!!c)}
              />
              <Label htmlFor="w2">Distribuição de Ativos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="w3"
                checked={showExpenseTrend}
                onCheckedChange={(c) => setShowExpenseTrend(!!c)}
              />
              <Label htmlFor="w3">Tendência de Despesas</Label>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {showRevenueByOrigin && (
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Receita por Origem (UF)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: 'Valor', color: 'hsl(var(--primary))' },
                }}
                className="h-[300px] w-full"
              >
                <BarChart data={revenueByOrigin}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {showAssetDist && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Frota e Equipamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={assetDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {assetDistribution.map((_, index) => (
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
        )}

        {showExpenseTrend && (
          <Card className="col-span-1 md:col-span-3">
            <CardHeader>
              <CardTitle>Evolução de Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: 'Valor', color: 'hsl(var(--destructive))' },
                }}
                className="h-[300px] w-full"
              >
                <LineChart data={expenseTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
