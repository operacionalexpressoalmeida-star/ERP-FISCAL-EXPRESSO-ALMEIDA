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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { Printer } from 'lucide-react'

export default function CteTaxReport() {
  const { getFilteredTransactions, companies, selectedCompanyId } =
    useErpStore()

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  // Optimization: useMemo to avoid recalculating on every render if store updates unrelated data
  // but since getFilteredTransactions returns new array, this memo depends on it.
  // It's mainly to keep consistency with the pattern used in CTeList.
  const allTransactions = getFilteredTransactions()
  const transactions = useMemo(
    () =>
      allTransactions.filter(
        (t) =>
          t.type === 'revenue' &&
          t.cteNumber &&
          t.date >= startDate &&
          t.date <= endDate,
      ),
    [allTransactions, startDate, endDate],
  )

  const totals = useMemo(
    () =>
      transactions.reduce(
        (acc, t) => {
          acc.value += t.value
          acc.icms += t.icmsValue
          acc.pis += t.pisValue
          acc.cofins += t.cofinsValue
          return acc
        },
        { value: 0, icms: 0, pis: 0, cofins: 0 },
      ),
    [transactions],
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Relatório Consolidado de CT-e
          </h1>
          <p className="text-muted-foreground">
            Apuração detalhada de tributos sobre transportes.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:hidden">
          <CardTitle>Filtros</CardTitle>
          <div className="flex gap-4 items-end">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="hidden print:block mb-6 text-center">
            <h2 className="text-xl font-bold">Relatório Fiscal de CT-e</h2>
            <p>
              {companies.find((c) => c.id === selectedCompanyId)?.name ||
                'Consolidado'}
            </p>
            <p className="text-sm">
              Período: {new Date(startDate).toLocaleDateString()} a{' '}
              {new Date(endDate).toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-muted/20 print:border">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Fretes
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totals.value)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 print:border">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total ICMS
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(totals.icms)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 print:border">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total PIS
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(totals.pis)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 print:border">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total COFINS
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(totals.cofins)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Orig/Dest</TableHead>
                <TableHead>CFOP</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">ICMS</TableHead>
                <TableHead className="text-right">PIS</TableHead>
                <TableHead className="text-right">COFINS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{t.cteNumber}</TableCell>
                  <TableCell>
                    {t.origin}-{t.destination}
                  </TableCell>
                  <TableCell>{t.cfop}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(t.value)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(t.icmsValue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(t.pisValue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(t.cofinsValue)}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado no período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
