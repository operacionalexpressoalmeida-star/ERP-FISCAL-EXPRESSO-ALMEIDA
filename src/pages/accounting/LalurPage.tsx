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
  TableFooter,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const lalurSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  date: z.string(),
  description: z.string().min(3),
  value: z.coerce.number().min(0.01),
  type: z.enum(['addition', 'exclusion']),
})

export default function LalurPage() {
  const {
    getFilteredLalurEntries,
    getFilteredTransactions,
    addLalurEntry,
    companies,
    selectedCompanyId,
  } = useErpStore()
  const entries = getFilteredLalurEntries()
  const transactions = getFilteredTransactions()

  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof lalurSchema>>({
    resolver: zodResolver(lalurSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      companyId: selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
      type: 'addition',
    },
  })

  function onSubmit(values: z.infer<typeof lalurSchema>) {
    addLalurEntry(values)
    setOpen(false)
    form.reset()
  }

  // Calc Logic
  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((acc, t) => acc + t.value, 0)
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0)
  const accountingResult = totalRevenue - totalExpense

  const additions = entries
    .filter((e) => e.type === 'addition')
    .reduce((acc, e) => acc + e.value, 0)
  const exclusions = entries
    .filter((e) => e.type === 'exclusion')
    .reduce((acc, e) => acc + e.value, 0)

  // Automatically add non-deductible expenses to additions simulation
  const nonDeductibleExpenses = transactions
    .filter((t) => t.type === 'expense' && !t.isDeductibleIrpjCsll)
    .reduce((acc, t) => acc + t.value, 0)

  const totalAdditions = additions + nonDeductibleExpenses
  const realProfit = accountingResult + totalAdditions - exclusions

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LALUR</h1>
          <p className="text-muted-foreground">
            Livro de Apuração do Lucro Real.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Ajuste
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Ajuste ao Lucro Real</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={selectedCompanyId !== 'consolidated'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ajuste</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="addition">Adição</SelectItem>
                          <SelectItem value="exclusion">Exclusão</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Histórico</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Registrar Ajuste
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Demonstrativo de Apuração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span>Resultado Contábil (Receitas - Despesas)</span>
                <span
                  className={
                    accountingResult >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }
                >
                  {formatCurrency(accountingResult)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b bg-muted/20 pl-4">
                <span className="text-muted-foreground text-sm">
                  (+) Adições (Despesas Indedutíveis Automáticas)
                </span>
                <span className="text-emerald-600">
                  {formatCurrency(nonDeductibleExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b bg-muted/20 pl-4">
                <span className="text-muted-foreground text-sm">
                  (+) Adições (Manuais)
                </span>
                <span className="text-emerald-600">
                  {formatCurrency(additions)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b bg-muted/20 pl-4">
                <span className="text-muted-foreground text-sm">
                  (-) Exclusões
                </span>
                <span className="text-rose-600">
                  {formatCurrency(exclusions)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 font-bold text-lg">
                <span>= Lucro Real (Base IRPJ/CSLL)</span>
                <span className="text-primary">
                  {formatCurrency(realProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimativa de Impostos</CardTitle>
            <CardDescription>Baseado no Lucro Real Apurado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>IRPJ (15%)</span>
              <span className="font-mono">
                {formatCurrency(Math.max(0, realProfit * 0.15))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Adicional IRPJ (10%)</span>
              <span className="font-mono">
                {formatCurrency(Math.max(0, (realProfit - 20000) * 0.1))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>CSLL (9%)</span>
              <span className="font-mono">
                {formatCurrency(Math.max(0, realProfit * 0.09))}
              </span>
            </div>
            <div className="pt-2 border-t mt-2 flex justify-between font-bold">
              <span>Total a Pagar</span>
              <span>
                {formatCurrency(
                  Math.max(
                    0,
                    realProfit * 0.24 + Math.max(0, (realProfit - 20000) * 0.1),
                  ),
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ajustes Manuais</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {new Date(e.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {e.type === 'addition' ? 'Adição' : 'Exclusão'}
                  </TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell
                    className={`text-right ${e.type === 'addition' ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {e.type === 'addition' ? '+' : '-'}
                    {formatCurrency(e.value)}
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
