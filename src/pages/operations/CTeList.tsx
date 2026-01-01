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
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
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
import { useForm, useWatch } from 'react-hook-form'
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
import { toast } from '@/hooks/use-toast'

const cteSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  date: z.string(),
  description: z.string().min(3),
  value: z.coerce.number().min(0.01),
  cteNumber: z.string().min(1),
  origin: z.string().min(2),
  destination: z.string().min(2),
  icmsValue: z.coerce.number().min(0),
  pisValue: z.coerce.number().min(0),
  cofinsValue: z.coerce.number().min(0),
})

export default function CTeList() {
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
    (t) => t.type === 'revenue',
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null)

  const form = useForm<z.infer<typeof cteSchema>>({
    resolver: zodResolver(cteSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      companyId: selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
      icmsValue: 0,
      pisValue: 0,
      cofinsValue: 0,
      value: 0,
      origin: '',
      destination: '',
    },
  })

  // Watch fields for automatic calculation
  const watchedValue = useWatch({ control: form.control, name: 'value' })
  const watchedOrigin = useWatch({ control: form.control, name: 'origin' })
  const watchedDestination = useWatch({
    control: form.control,
    name: 'destination',
  })

  useEffect(() => {
    // Automatic ICMS and Taxes Engine
    const val = Number(watchedValue) || 0
    if (val > 0) {
      // PIS/COFINS (Lucro Real defaults)
      const pis = parseFloat((val * 0.0165).toFixed(2))
      const cofins = parseFloat((val * 0.076).toFixed(2))

      form.setValue('pisValue', pis)
      form.setValue('cofinsValue', cofins)

      // ICMS Logic
      if (
        watchedOrigin &&
        watchedDestination &&
        watchedOrigin.length === 2 &&
        watchedDestination.length === 2
      ) {
        const origin = watchedOrigin.toUpperCase()
        const destination = watchedDestination.toUpperCase()

        let icmsRate = 0.12 // Default Inter-state

        if (origin === destination) {
          icmsRate = 0.18 // Default Intra-state (Simulated)
        }

        const icms = parseFloat((val * icmsRate).toFixed(2))
        form.setValue('icmsValue', icms)
      }
    }
  }, [watchedValue, watchedOrigin, watchedDestination, form])

  useEffect(() => {
    if (selectedTransaction) {
      form.reset({
        companyId: selectedTransaction.companyId,
        date: selectedTransaction.date,
        description: selectedTransaction.description,
        value: selectedTransaction.value,
        cteNumber: selectedTransaction.cteNumber || '',
        origin: selectedTransaction.origin || '',
        destination: selectedTransaction.destination || '',
        icmsValue: selectedTransaction.icmsValue,
        pisValue: selectedTransaction.pisValue,
        cofinsValue: selectedTransaction.cofinsValue,
      })
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        companyId:
          selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
        description: '',
        value: 0,
        cteNumber: '',
        origin: '',
        destination: '',
        icmsValue: 0,
        pisValue: 0,
        cofinsValue: 0,
      })
    }
  }, [selectedTransaction, form, selectedCompanyId])

  function onSubmit(values: z.infer<typeof cteSchema>) {
    if (selectedTransaction) {
      updateTransaction(selectedTransaction.id, {
        ...values,
        type: 'revenue',
        origin: values.origin.toUpperCase(),
        destination: values.destination.toUpperCase(),
      })
      toast({
        title: 'CT-e Atualizado',
        description: 'As alterações foram salvas com sucesso.',
      })
    } else {
      addTransaction({
        ...values,
        type: 'revenue',
        origin: values.origin.toUpperCase(),
        destination: values.destination.toUpperCase(),
      })
      toast({
        title: 'CT-e Registrado',
        description: 'Receita adicionada com sucesso.',
      })
    }
    setIsDialogOpen(false)
    setSelectedTransaction(null)
  }

  const handleDelete = () => {
    if (transactionToDelete) {
      removeTransaction(transactionToDelete.id)
      toast({
        title: 'Registro excluído',
        description: 'O CT-e foi removido com sucesso.',
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
            Receitas de Frete (CT-e)
          </h1>
          <p className="text-muted-foreground">
            Emissão e controle de Conhecimentos de Transporte - Expresso
            Almeida.
          </p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" /> Novo CT-e
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction
                ? 'Editar CT-e'
                : 'Registrar Receita de Frete'}
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
                  name="cteNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número CT-e</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                      <Input
                        {...field}
                        placeholder="Ex: Frete Carga Fracionada"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Emissão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem (UF)</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} placeholder="Ex: SP" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino (UF)</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} placeholder="Ex: RJ" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-muted/30 p-4 rounded-md border">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  Cálculo Automático de Impostos
                </div>
                <div className="grid grid-cols-4 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel>Valor Total</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="icmsValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ICMS</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            readOnly
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pisValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIS</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            readOnly
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cofinsValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COFINS</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            readOnly
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {selectedTransaction
                  ? 'Salvar Alterações'
                  : 'Registrar Receita'}
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
            <AlertDialogTitle>Excluir CT-e?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação removerá o registro financeiro e recalculará os
              impostos. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de CT-es</CardTitle>
          <CardDescription>
            Registros filtrados pelo contexto selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>CT-e</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Impostos (Est.)</TableHead>
                {userRole === 'admin' && <TableHead className="w-[100px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-mono">{t.cteNumber}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>
                    {t.origin} {'->'} {t.destination}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    {formatCurrency(t.value)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    ICMS: {formatCurrency(t.icmsValue)}
                    <br />
                    PIS/COF: {formatCurrency(t.pisValue + t.cofinsValue)}
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
                    colSpan={userRole === 'admin' ? 7 : 6}
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
