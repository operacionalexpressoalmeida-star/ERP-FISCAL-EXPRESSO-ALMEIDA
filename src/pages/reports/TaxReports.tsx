import { useErpStore } from '@/stores/useErpStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Printer, CalendarCheck, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { differenceInMonths } from 'date-fns'

export default function TaxReports() {
  const {
    getFilteredTransactions,
    getFilteredLalurEntries,
    getFilteredAssets,
    companies,
    selectedCompanyId,
    requestClosing,
    userRole,
  } = useErpStore()
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))

  // Filter approved transactions for official tax reports
  const transactions = getFilteredTransactions().filter(
    (t) => t.status === 'approved',
  )
  const lalur = getFilteredLalurEntries()
  const assets = getFilteredAssets()

  // Simplified Calculation Logic for the Report
  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((acc, t) => acc + t.value, 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0)

  const icms = transactions.reduce(
    (acc, t) => acc + (t.type === 'revenue' ? t.icmsValue : -t.icmsValue),
    0,
  )
  const pis = transactions.reduce(
    (acc, t) => acc + (t.type === 'revenue' ? t.pisValue : -t.pisValue),
    0,
  )
  const cofins = transactions.reduce(
    (acc, t) => acc + (t.type === 'revenue' ? t.cofinsValue : -t.cofinsValue),
    0,
  )

  // Calculate Total Depreciation for IRPJ/CSLL deduction
  const totalDepreciation = assets.reduce((acc, asset) => {
    // Only count active assets
    if (asset.status !== 'Active') return acc

    const depreciableAmount = Math.max(
      0,
      asset.originalValue - asset.residualValue,
    )
    const monthlyDepreciation =
      asset.usefulLife > 0 ? depreciableAmount / asset.usefulLife : 0

    // Simple check: if asset was acquired before or during this month/year, count depreciation
    // Ideally we check if it is fully depreciated too, but assuming active assets depreciate
    return acc + monthlyDepreciation
  }, 0)

  // Real Profit Estimation
  // Profit = Revenue - Expenses - Depreciation
  const accountingProfit = Math.max(
    0,
    totalRevenue - totalExpenses - totalDepreciation,
  )

  // IRPJ/CSLL Estimation (Real Profit)
  const irpj = accountingProfit * 0.15
  const csll = accountingProfit * 0.09

  const handlePrint = () => {
    window.print()
  }

  const handleClosePeriod = () => {
    if (selectedCompanyId === 'consolidated') {
      toast({
        title: 'Ação Bloqueada',
        description:
          'Selecione uma empresa específica para encerrar o período.',
        variant: 'destructive',
      })
      return
    }
    requestClosing({
      companyId: selectedCompanyId,
      month: Number(month),
      year: Number(year),
      requestedBy: userRole,
      status: 'pending',
    })
    toast({
      title: 'Solicitação Enviada',
      description: 'O fechamento foi enviado para aprovação da administração.',
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Relatórios Fiscais
          </h1>
          <p className="text-muted-foreground">
            Resumo mensal e fechamento de período.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(12)].map((_, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={handleClosePeriod}>
            <Lock className="mr-2 h-4 w-4" /> Encerrar Período
          </Button>
        </div>
      </div>

      {/* Report Container */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex justify-center mb-4">
            <img
              src="https://img.usecurling.com/i?q=Expresso+Almeida&shape=fill&color=blue"
              className="h-16"
              alt="Logo"
            />
          </div>
          <CardTitle className="text-2xl uppercase tracking-wide">
            Expresso Almeida - Relatório Fiscal
          </CardTitle>
          <CardDescription className="text-lg text-foreground">
            Período: {month}/{year} •{' '}
            {companies.find((c) => c.id === selectedCompanyId)?.name ||
              'Consolidado'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Section 1: Revenue */}
          <div>
            <h3 className="font-bold text-lg mb-2 border-l-4 border-primary pl-2">
              1. Receita Bruta
            </h3>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Receita de Fretes e Serviços</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totalRevenue)}
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold bg-muted/20">
                  <TableCell>Total Receitas</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totalRevenue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Section 2: Indirect Taxes */}
          <div>
            <h3 className="font-bold text-lg mb-2 border-l-4 border-primary pl-2">
              2. Impostos Indiretos (Apuração)
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tributo</TableHead>
                  <TableHead className="text-right">Saldo Devedor</TableHead>
                  <TableHead className="text-right">Saldo Credor</TableHead>
                  <TableHead className="text-right">A Recolher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>ICMS</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.abs(icms > 0 ? icms : 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.abs(icms < 0 ? icms : 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Math.max(0, icms))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>PIS (Não-Cumulativo)</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.abs(pis > 0 ? pis : 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.abs(pis < 0 ? pis : 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Math.max(0, pis))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>COFINS (Não-Cumulativo)</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.abs(cofins > 0 ? cofins : 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.abs(cofins < 0 ? cofins : 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Math.max(0, cofins))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Section 3: Direct Taxes */}
          <div>
            <h3 className="font-bold text-lg mb-2 border-l-4 border-primary pl-2">
              3. IRPJ e CSLL (Lucro Real Estimado)
            </h3>
            <CardDescription className="mb-4">
              Base de Cálculo: Receita - Despesas - Depreciação do Ativo
              Imobilizado ({formatCurrency(totalDepreciation)})
            </CardDescription>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>IRPJ (15% sobre Lucro Real)</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(irpj)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CSLL (9% sobre Lucro Real)</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(csll)}
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold bg-muted/20">
                  <TableCell>Total Tributos Diretos</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(irpj + csll)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="pt-8 flex justify-between items-end">
            <div className="text-xs text-muted-foreground">
              <p>Emitido em: {new Date().toLocaleString()}</p>
              <p>Responsável: {userRole}</p>
              <p>Sistema ERP Expresso Almeida</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">Total Geral a Recolher</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(
                  Math.max(0, icms) +
                    Math.max(0, pis) +
                    Math.max(0, cofins) +
                    irpj +
                    csll,
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
