import { useErpStore } from '@/stores/useErpStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export default function TaxPage() {
  const { getFilteredTransactions } = useErpStore()
  // Filter for approved
  const transactions = getFilteredTransactions().filter(
    (t) => t.status === 'approved',
  )

  // ICMS Calc
  const icmsDebit = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((acc, t) => acc + t.icmsValue, 0)
  const icmsCredit = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.icmsValue, 0)
  const icmsPayable = Math.max(0, icmsDebit - icmsCredit)

  // PIS Calc (Non-cumulative)
  const pisDebit = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((acc, t) => acc + t.pisValue, 0)
  const pisCredit = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.pisValue, 0)
  const pisPayable = Math.max(0, pisDebit - pisCredit)

  // COFINS Calc (Non-cumulative)
  const cofinsDebit = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((acc, t) => acc + t.cofinsValue, 0)
  const cofinsCredit = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.cofinsValue, 0)
  const cofinsPayable = Math.max(0, cofinsDebit - cofinsCredit)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Apuração de Impostos
        </h1>
        <p className="text-muted-foreground">
          Cálculo de tributos indiretos (ICMS, PIS, COFINS).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ICMS</CardTitle>
            <CardDescription>Imposto Estadual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Débitos (Receitas)</span>
              <span className="text-rose-600">{formatCurrency(icmsDebit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Créditos (Entradas)</span>
              <span className="text-emerald-600">
                {formatCurrency(icmsCredit)}
              </span>
            </div>
            <div className="pt-2 border-t mt-2 flex justify-between font-bold text-lg">
              <span>A Recolher</span>
              <span className="text-primary">
                {formatCurrency(icmsPayable)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>PIS</CardTitle>
            <CardDescription>Federal (Não-Cumulativo)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Débitos (1.65%)</span>
              <span className="text-rose-600">{formatCurrency(pisDebit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Créditos</span>
              <span className="text-emerald-600">
                {formatCurrency(pisCredit)}
              </span>
            </div>
            <div className="pt-2 border-t mt-2 flex justify-between font-bold text-lg">
              <span>A Recolher</span>
              <span className="text-primary">{formatCurrency(pisPayable)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>COFINS</CardTitle>
            <CardDescription>Federal (Não-Cumulativo)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Débitos (7.6%)</span>
              <span className="text-rose-600">
                {formatCurrency(cofinsDebit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Créditos</span>
              <span className="text-emerald-600">
                {formatCurrency(cofinsCredit)}
              </span>
            </div>
            <div className="pt-2 border-t mt-2 flex justify-between font-bold text-lg">
              <span>A Recolher</span>
              <span className="text-primary">
                {formatCurrency(cofinsPayable)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Créditos</CardTitle>
          <CardDescription>
            Despesas que geraram crédito de PIS/COFINS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor Base</TableHead>
                <TableHead className="text-right">PIS (1.65%)</TableHead>
                <TableHead className="text-right">COFINS (7.6%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions
                .filter((t) => t.type === 'expense' && t.hasCreditPisCofins)
                .map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(t.value)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(t.pisValue)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(t.cofinsValue)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
