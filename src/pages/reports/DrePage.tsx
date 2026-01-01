import { useErpStore } from '@/stores/useErpStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export default function DrePage() {
  const { getFilteredTransactions, companies, selectedCompanyId } =
    useErpStore()
  const transactions = getFilteredTransactions()

  // DRE Calculation
  const grossRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((acc, t) => acc + t.value, 0)

  const taxDeductions = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((acc, t) => {
      return acc + t.icmsValue + t.pisValue + t.cofinsValue
    }, 0)

  const netRevenue = grossRevenue - taxDeductions

  const costs = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        (t.category === 'Fuel' || t.category === 'Maintenance'),
    )
    .reduce((acc, t) => acc + t.value, 0)

  const grossProfit = netRevenue - costs

  const expenses = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.category !== 'Fuel' &&
        t.category !== 'Maintenance',
    )
    .reduce((acc, t) => acc + t.value, 0)

  const operatingResult = grossProfit - expenses

  const contextName =
    selectedCompanyId === 'consolidated'
      ? 'Consolidado Global'
      : companies.find((c) => c.id === selectedCompanyId)?.name

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DRE Gerencial</h1>
        <p className="text-muted-foreground">
          Demonstração do Resultado do Exercício: {contextName}
        </p>
      </div>

      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>DRE - {new Date().getFullYear()}</CardTitle>
          <CardDescription>Valores acumulados do período.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow className="font-bold text-lg bg-muted/30">
                <TableCell>Receita Bruta Operacional</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grossRevenue)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6 text-muted-foreground">
                  (-) Impostos sobre Vendas (ICMS, PIS, COFINS)
                </TableCell>
                <TableCell className="text-right text-rose-600">
                  ({formatCurrency(taxDeductions)})
                </TableCell>
              </TableRow>
              <TableRow className="font-bold bg-muted/10">
                <TableCell>= Receita Líquida</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(netRevenue)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6 text-muted-foreground">
                  (-) Custos Operacionais (Combustível, Manutenção)
                </TableCell>
                <TableCell className="text-right text-rose-600">
                  ({formatCurrency(costs)})
                </TableCell>
              </TableRow>
              <TableRow className="font-bold bg-muted/10">
                <TableCell>= Lucro Bruto</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grossProfit)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6 text-muted-foreground">
                  (-) Despesas Administrativas e Gerais
                </TableCell>
                <TableCell className="text-right text-rose-600">
                  ({formatCurrency(expenses)})
                </TableCell>
              </TableRow>
              <TableRow className="font-bold text-lg bg-primary/10">
                <TableCell>Resultado Operacional (EBIT)</TableCell>
                <TableCell
                  className={`text-right ${operatingResult >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {formatCurrency(operatingResult)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
