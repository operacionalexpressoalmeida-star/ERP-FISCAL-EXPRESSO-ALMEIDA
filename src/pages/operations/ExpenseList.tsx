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
import {
  Plus,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Truck,
  Loader2,
  FileText,
} from 'lucide-react'
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
import { PaginationControls } from '@/components/PaginationControls'
import { Badge } from '@/components/ui/badge'

const expenseSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  date: z.string(),
  description: z.string().min(3, 'Descrição obrigatória'),
  providerName: z.string().min(2, 'Fornecedor obrigatório'),
  documentNumber: z.string().optional(),
  value: z.coerce.number().min(0.01, 'Valor deve ser positivo'),
  category: z.string().min(1, 'Selecione a categoria'),
  isDeductibleIrpjCsll: z.boolean().default(false),
  hasCreditPisCofins: z.boolean().default(false),
  hasCreditIcms: z.boolean().default(false),
  contractId: z.string().optional(),
})

const ITEMS_PER_PAGE = 10

export default function ExpenseList() {
  const {
    getFilteredTransactions,
    getFilteredContracts,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addIntegrationLog,
    companies,
    selectedCompanyId,
    userRole,
    apiConfigs,
  } = useErpStore()

  const transactions = getFilteredTransactions().filter(
    (t) => t.type === 'expense',
  )
  const contracts = getFilteredContracts().filter(
    (c) => c.status === 'Active' && c.partyRole === 'Supplier',
  )

  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null)
  const [generatingCiotFor, setGeneratingCiotFor] = useState<string | null>(
    null,
  )

  const ciotConfig = apiConfigs.find((c) => c.type === 'payment')

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      companyId: selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
      isDeductibleIrpjCsll: true,
      hasCreditPisCofins: true,
      hasCreditIcms: false,
      contractId: 'no_contract',
    },
  })

  useEffect(() => {
    if (selectedTransaction) {
      form.reset({
        companyId: selectedTransaction.companyId,
        date: selectedTransaction.date,
        description: selectedTransaction.description,
        providerName: selectedTransaction.providerName || '',
        documentNumber: selectedTransaction.documentNumber || '',
        value: selectedTransaction.value,
        category: selectedTransaction.category || '',
        isDeductibleIrpjCsll: selectedTransaction.isDeductibleIrpjCsll || false,
        hasCreditPisCofins: selectedTransaction.hasCreditPisCofins || false,
        hasCreditIcms: selectedTransaction.hasCreditIcms || false,
        contractId: selectedTransaction.contractId || 'no_contract',
      })
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        companyId:
          selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
        description: '',
        providerName: '',
        documentNumber: '',
        value: 0,
        category: '',
        isDeductibleIrpjCsll: true,
        hasCreditPisCofins: true,
        hasCreditIcms: false,
        contractId: 'no_contract',
      })
    }
  }, [selectedTransaction, form, selectedCompanyId])

  function onSubmit(values: z.infer<typeof expenseSchema>) {
    // Calc credits mock
    const pisValue = values.hasCreditPisCofins ? values.value * 0.0165 : 0
    const cofinsValue = values.hasCreditPisCofins ? values.value * 0.076 : 0
    const icmsValue = values.hasCreditIcms ? values.value * 0.12 : 0

    // Handle the "no_contract" sentinel value to return undefined/empty
    const contractId =
      values.contractId && values.contractId !== 'no_contract'
        ? values.contractId
        : undefined

    if (selectedTransaction) {
      updateTransaction(selectedTransaction.id, {
        ...values,
        type: 'expense',
        pisValue,
        cofinsValue,
        icmsValue,
        contractId,
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
        contractId,
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

  const handleGenerateCiot = (t: Transaction) => {
    if (!ciotConfig?.isActive) {
      toast({
        title: 'Integração Inativa',
        description: 'Ative a integração CIOT primeiro.',
        variant: 'destructive',
      })
      return
    }

    setGeneratingCiotFor(t.id)
    toast({
      title: 'Gerando CIOT...',
      description: `Comunicando com ${ciotConfig.provider || 'e-Frete'}...`,
    })

    setTimeout(() => {
      const mockCiot =
        Math.floor(Math.random() * 900000000000) + 100000000000 + ''
      updateTransaction(t.id, {
        ciotCode: mockCiot,
      })
      addIntegrationLog({
        type: 'CIOT',
        action: 'Geração CIOT',
        status: 'success',
        message: `CIOT ${mockCiot} gerado para pagamento de frete.`,
        timestamp: new Date().toISOString(),
      })
      toast({
        title: 'CIOT Gerado com Sucesso',
        description: `Código: ${mockCiot}`,
      })
      setGeneratingCiotFor(null)
    }, 2000)
  }

  const openEditDialog = (t: Transaction) => {
    setSelectedTransaction(t)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setSelectedTransaction(null)
    setIsDialogOpen(true)
  }

  const currentData = transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                          <SelectItem value="FreightPayment">
                            Pagamento de Frete (Terceiros)
                          </SelectItem>
                          <SelectItem value="Administrative">
                            Administrativo
                          </SelectItem>
                          <SelectItem value="Personnel">Pessoal</SelectItem>
                          <SelectItem value="Tolls">Pedágio</SelectItem>
                          <SelectItem value="Other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="providerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nome do estabelecimento"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Documento / NF</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Opcional" />
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
                    <FormLabel>Descrição Detalhada</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Diesel S10 - 500L" />
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

              <FormField
                control={form.control}
                name="contractId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato Vinculado (Opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione se houver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no_contract">Nenhum</SelectItem>
                        {contracts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.partyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                <TableHead>Contrato/Doc</TableHead>
                <TableHead className="text-center">Fiscal</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {t.providerName || t.description}
                      </span>
                      {t.providerName && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {t.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.category === 'FreightPayment'
                      ? 'Pagto. Frete'
                      : t.category}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {t.contractId && (
                        <Badge variant="outline" className="text-xs w-fit">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Contrato
                        </Badge>
                      )}
                      {(t.documentNumber ||
                        (t.cteNumber && t.category === 'Fuel')) && (
                        <Badge variant="outline" className="text-xs w-fit">
                          <FileText className="w-3 h-3 mr-1" />
                          {t.documentNumber || t.cteNumber}
                        </Badge>
                      )}
                      {t.ciotCode && (
                        <Badge
                          variant="secondary"
                          className="text-xs w-fit bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                        >
                          <Truck className="w-3 h-3 mr-1" />
                          {t.ciotCode}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
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
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {t.category === 'FreightPayment' && !t.ciotCode && (
                        <Button
                          variant="outline"
                          size="icon"
                          title="Gerar CIOT"
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() => handleGenerateCiot(t)}
                          disabled={generatingCiotFor === t.id}
                        >
                          {generatingCiotFor === t.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Truck className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {userRole === 'admin' && (
                        <>
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
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
