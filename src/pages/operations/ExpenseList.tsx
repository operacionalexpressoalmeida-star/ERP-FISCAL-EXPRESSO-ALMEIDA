import { useErpStore, Transaction } from '@/stores/useErpStore'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

const expenseSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  date: z.string(),
  description: z.string().min(3),
  value: z.coerce.number().min(0.01),
  category: z.string(),
  isDeductibleIrpjCsll: z.boolean().default(false),
  hasCreditPisCofins: z.boolean().default(false),
  hasCreditIcms: z.boolean().default(false),
})

export default function ExpenseList() {
  const {
    getFilteredTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    companies,
    selectedCompanyId,
    userRole,
  } = useErpStore()
  const transactions = getFilteredTransactions().filter(
    (t) => t.type === 'expense',
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null)

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      companyId: selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
      isDeductibleIrpjCsll: true,
      hasCreditPisCofins: true,
      hasCreditIcms: false,
    },
  })

  useEffect(() => {
    if (selectedTransaction) {
      form.reset({
        companyId: selectedTransaction.companyId,
        date: selectedTransaction.date,
        description: selectedTransaction.description,
        value: selectedTransaction.value,
        category: selectedTransaction.category || '',
        isDeductibleIrpjCsll: selectedTransaction.isDeductibleIrpjCsll || false,
        hasCreditPisCofins: selectedTransaction.hasCreditPisCofins || false,
        hasCreditIcms: selectedTransaction.hasCreditIcms || false,
      })
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        companyId:
          selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
        description: '',
        value: 0,
        category: '',
        isDeductibleIrpjCsll: true,
        hasCreditPisCofins: true,
        hasCreditIcms: false,
      })
    }
  }, [selectedTransaction, form, selectedCompanyId])

  function onSubmit(values: z.infer<typeof expenseSchema>) {
    // Calc credits mock
    const pisValue = values.hasCreditPisCofins ? values.value * 0.0165 : 0
    const cofinsValue = values.hasCreditPisCofins ? values.value * 0.076 : 0
    const icmsValue = values.hasCreditIcms ? values.value * 0.12 : 0

    if (selectedTransaction) {
      updateTransaction(selectedTransaction.id, {
        ...values,
        type: 'expense',
        pisValue,
        cofinsValue,
        icmsValue,
      })
      toast({
        title: 'Despesa Atualizada',
        description: 'Registro alterado com sucesso.',
      })
    } else {
      addTransaction({
        ...values,
        type: 'expense',
        pisValue,
        cofinsValue,
        icmsValue,
      })
      toast({
        title: 'Despesa Lançada',
        description: 'Custo registrado com sucesso.',
      })
    }
    setIsDialogOpen(false)
    setSelectedTransaction(null)
  }

  const handleDelete = () => {
    if (transactionToDelete) {
      removeTransaction(transactionToDelete.id)
      toast({
        title: 'Despesa Excluída',
        description: 'Registro removido permanentemente.',
        variant: 'destructive',
      })
      setTransactionToDelete(null)
    }
  }

  const openEditDialog = (t: Transaction) => {
    setSelectedTransaction(t)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setSelectedTransaction(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestão de Despesas
          </h1>
          <p className="text-muted-foreground">
            Controle de custos operacionais e administrativos.
          </p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={openNewDialog} variant="destructive">
            <Plus className="mr-2 h-4 w-4" /> Nova Despesa
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? 'Editar Despesa' : 'Registrar Despesa'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa/Filial</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={
                          selectedCompanyId !== 'consolidated' &&
                          !selectedTransaction
                        }
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Fuel">Combustível</SelectItem>
                          <SelectItem value="Maintenance">
                            Manutenção
                          </SelectItem>
                          <SelectItem value="Administrative">
                            Administrativo
                          </SelectItem>
                          <SelectItem value="Personnel">Pessoal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
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
                      <FormLabel>Valor Total</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="isDeductibleIrpjCsll"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Dedutível IRPJ</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasCreditPisCofins"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Crédito PIS/COF</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasCreditIcms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Crédito ICMS</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" variant="destructive" className="w-full">
                {selectedTransaction
                  ? 'Salvar Alterações'
                  : 'Registrar Despesa'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível e afetará os cálculos de impostos e DRE.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Despesas</CardTitle>
          <CardDescription>Custos operacionais registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Fiscal</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                {userRole === 'admin' && <TableHead className="w-[100px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell className="text-center text-xs">
                    {t.isDeductibleIrpjCsll && (
                      <span className="bg-green-100 text-green-800 px-1 rounded mr-1">
                        IR
                      </span>
                    )}
                    {t.hasCreditPisCofins && (
                      <span className="bg-blue-100 text-blue-800 px-1 rounded">
                        PIS
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-rose-600">
                    -{formatCurrency(t.value)}
                  </TableCell>
                  {userRole === 'admin' && (
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setTransactionToDelete(t)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={userRole === 'admin' ? 6 : 5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado.
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
