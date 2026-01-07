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
import { Printer, Download, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

export default function CteTaxReport() {
  const { getFilteredTransactions, companies, selectedCompanyId } =
    useErpStore()

  // Filters State
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [issuerFilter, setIssuerFilter] = useState('')
  const [recipientFilter, setRecipientFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')

  const allTransactions = getFilteredTransactions()

  // Advanced Filtering Logic
  const transactions = useMemo(
    () =>
      allTransactions.filter((t) => {
        // Base criteria
        if (t.type !== 'revenue' || !t.cteNumber) return false

        // Date Range
        if (t.date < startDate || t.date > endDate) return false

        // Issuer (Provider)
        if (
          issuerFilter &&
          !t.providerName?.toLowerCase().includes(issuerFilter.toLowerCase()) &&
          !t.providerCnpj?.includes(issuerFilter)
        )
          return false

        // Recipient (Taker/Dest)
        if (
          recipientFilter &&
          !t.takerName?.toLowerCase().includes(recipientFilter.toLowerCase()) &&
          !t.takerCnpj?.includes(recipientFilter) &&
          !t.recipientCnpj?.includes(recipientFilter)
        )
          return false

        // Status
        if (statusFilter !== 'all') {
          if (statusFilter === 'pending' && t.status !== 'pending') return false
          if (statusFilter === 'authorized' && t.status !== 'approved')
            return false
        }

        // Value Range
        if (minValue && t.value < parseFloat(minValue)) return false
        if (maxValue && t.value > parseFloat(maxValue)) return false

        return true
      }),
    [
      allTransactions,
      startDate,
      endDate,
      issuerFilter,
      recipientFilter,
      statusFilter,
      minValue,
      maxValue,
    ],
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

  const handleExport = () => {
    // Mock export functionality
    if (transactions.length === 0) {
      toast({
        title: 'Nada para exportar',
        description: 'Não há dados com os filtros atuais.',
        variant: 'warning',
      })
      return
    }

    toast({
      title: 'Exportação Iniciada',
      description: 'O relatório será baixado em instantes (CSV/Excel).',
    })

    setTimeout(() => {
      // In a real app, generate CSV blob and trigger download here
      console.log('Exporting', transactions)
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Relatório Avançado de CT-e
          </h1>
          <p className="text-muted-foreground">
            Apuração detalhada de tributos com filtros multicritério.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:hidden pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filtros de Relatório</CardTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-medium">Data Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Data Fim</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="authorized">Autorizados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">
                Emitente (Nome/CNPJ)
              </label>
              <Input
                placeholder="Filtrar emitente..."
                value={issuerFilter}
                onChange={(e) => setIssuerFilter(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Tomador (Nome/CNPJ)</label>
              <Input
                placeholder="Filtrar tomador..."
                value={recipientFilter}
                onChange={(e) => setRecipientFilter(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Valor Mín (R$)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Valor Máx (R$)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                className="h-8"
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
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Total Fretes
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(totals.value)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 print:border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Total ICMS
                </p>
                <p className="text-xl font-bold text-rose-600">
                  {formatCurrency(totals.icms)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 print:border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Total PIS
                </p>
                <p className="text-xl font-bold text-rose-600">
                  {formatCurrency(totals.pis)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 print:border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Total COFINS
                </p>
                <p className="text-xl font-bold text-rose-600">
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
                <TableHead>Tomador</TableHead>
                <TableHead>Orig/Dest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">ICMS</TableHead>
                <TableHead className="text-right">PIS/COFINS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{t.cteNumber}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {t.cfop}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] truncate text-xs"
                    title={t.takerName}
                  >
                    {t.takerName || '-'}
                  </TableCell>
                  <TableCell>
                    {t.origin}-{t.destination}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {t.status === 'approved' ? 'Autorizado' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(t.value)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(t.icmsValue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(t.pisValue + t.cofinsValue)}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado com os filtros selecionados.
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
