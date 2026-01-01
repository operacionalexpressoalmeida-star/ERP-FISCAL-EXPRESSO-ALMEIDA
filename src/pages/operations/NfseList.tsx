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
  RefreshCw,
  Send,
  FileCheck,
  Ban,
  Loader2,
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
import { PaginationControls } from '@/components/PaginationControls'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

const nfseSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  date: z.string(),
  description: z.string().min(5, 'Descrição detalhada é obrigatória'),
  value: z.coerce.number().min(0.01),
  serviceCode: z.string().min(3, 'Código LC116 obrigatório'),
  takerName: z.string().min(3, 'Nome do tomador obrigatório'),
  takerCnpj: z.string().min(14, 'CNPJ inválido'),
  issRate: z.coerce.number().min(2).max(5),
  issRetained: z.boolean().default(false),
  pisValue: z.coerce.number().min(0),
  cofinsValue: z.coerce.number().min(0),
})

const ITEMS_PER_PAGE = 10

export default function NfseList() {
  const {
    getFilteredTransactions,
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
    (t) => t.type === 'revenue' && t.serviceCode,
  )

  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null)
  const [isTransmitting, setIsTransmitting] = useState(false)

  const sefazConfig = apiConfigs.find((c) => c.type === 'fiscal')

  const form = useForm<z.infer<typeof nfseSchema>>({
    resolver: zodResolver(nfseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      companyId: selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
      issRate: 5,
      issRetained: false,
      value: 0,
      pisValue: 0,
      cofinsValue: 0,
    },
  })

  // Calculations
  const watchedValue = useWatch({ control: form.control, name: 'value' })
  const watchedRetained = useWatch({
    control: form.control,
    name: 'issRetained',
  })

  useEffect(() => {
    const val = Number(watchedValue) || 0
    if (val > 0) {
      const pis = parseFloat((val * 0.0065).toFixed(2)) // 0.65% Presumed
      const cofins = parseFloat((val * 0.03).toFixed(2)) // 3% Presumed
      form.setValue('pisValue', pis)
      form.setValue('cofinsValue', cofins)
    }
  }, [watchedValue, form])

  useEffect(() => {
    if (selectedTransaction) {
      form.reset({
        companyId: selectedTransaction.companyId,
        date: selectedTransaction.date,
        description: selectedTransaction.description,
        value: selectedTransaction.value,
        serviceCode: selectedTransaction.serviceCode || '',
        takerName: selectedTransaction.takerName || '',
        takerCnpj: selectedTransaction.takerCnpj || '',
        issRate: selectedTransaction.issRate || 5,
        issRetained: selectedTransaction.issRetained || false,
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
        serviceCode: '16.01',
        takerName: '',
        takerCnpj: '',
        issRate: 5,
        issRetained: false,
        pisValue: 0,
        cofinsValue: 0,
      })
    }
  }, [selectedTransaction, form, selectedCompanyId])

  function onSubmit(values: z.infer<typeof nfseSchema>) {
    // Calc ISS
    const issValue = (values.value * values.issRate) / 100

    if (selectedTransaction) {
      updateTransaction(selectedTransaction.id, {
        ...values,
        type: 'revenue',
        icmsValue: 0, // Service has no ICMS
        issValue: parseFloat(issValue.toFixed(2)),
      })
      toast({
        title: 'NFS-e Atualizada',
        description: 'Dados salvos com sucesso (Rascunho).',
      })
    } else {
      addTransaction({
        ...values,
        type: 'revenue',
        icmsValue: 0,
        issValue: parseFloat(issValue.toFixed(2)),
        nfseStatus: 'draft',
      })
      toast({
        title: 'NFS-e Criada',
        description: 'Nota de serviço criada em rascunho.',
      })
    }
    setIsDialogOpen(false)
    setSelectedTransaction(null)
  }

  const handleDelete = () => {
    if (transactionToDelete) {
      removeTransaction(transactionToDelete.id)
      toast({
        title: 'NFS-e Excluída',
        description: 'Registro removido.',
        variant: 'destructive',
      })
      setTransactionToDelete(null)
    }
  }

  const handleTransmit = async (t: Transaction) => {
    if (!sefazConfig?.isActive) {
      toast({
        title: 'Integração Inativa',
        description: 'Ative a integração com a SEFAZ no menu Integrações.',
        variant: 'destructive',
      })
      return
    }

    setIsTransmitting(true)
    toast({ title: 'Transmitindo...', description: 'Enviando lote RPS...' })

    // Simulate API delay
    setTimeout(() => {
      const success = Math.random() > 0.1
      if (success) {
        updateTransaction(t.id, {
          nfseStatus: 'authorized',
          rpsNumber: Math.floor(Math.random() * 10000).toString(),
          verificationCode: Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase(),
        })
        addIntegrationLog({
          type: 'SEFAZ',
          action: 'Transmissão RPS',
          status: 'success',
          message: `NFS-e autorizada para ${t.takerName}`,
          timestamp: new Date().toISOString(),
        })
        toast({
          title: 'NFS-e Autorizada',
          description: 'Nota emitida com sucesso.',
        })
      } else {
        updateTransaction(t.id, {
          nfseStatus: 'rejected',
        })
        addIntegrationLog({
          type: 'SEFAZ',
          action: 'Transmissão RPS',
          status: 'error',
          message: 'Erro X999: CNPJ do tomador inválido na base da prefeitura',
          timestamp: new Date().toISOString(),
        })
        toast({
          title: 'Rejeição',
          description: 'A prefeitura rejeitou o lote. Verifique os logs.',
          variant: 'destructive',
        })
      }
      setIsTransmitting(false)
    }, 2000)
  }

  const openEditDialog = (t: Transaction) => {
    if (t.nfseStatus === 'authorized') {
      toast({
        title: 'Bloqueado',
        description: 'Não é possível editar uma nota já autorizada.',
        variant: 'destructive',
      })
      return
    }
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'authorized':
        return <Badge className="bg-emerald-600">Autorizada</Badge>
      case 'transmitted':
        return <Badge className="bg-blue-600">Processando</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Rascunho
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Notas Fiscais de Serviço (NFS-e)
          </h1>
          <p className="text-muted-foreground">
            Emissão e controle de serviços prestados.
          </p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" /> Nova NFS-e
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? 'Editar NFS-e' : 'Emitir Nova NFS-e'}
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
                      <FormLabel>Prestador (Filial)</FormLabel>
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Competência</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 border rounded-md bg-muted/10 space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileCheck className="h-4 w-4" /> Dados do Tomador
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="takerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome do Cliente" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="takerCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ/CPF</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00.000.000/0000-00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discriminação do Serviço</FormLabel>
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
                  name="serviceCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cód. Serviço (LC116)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="16.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-muted/30 p-4 rounded-md border">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  Cálculo de Impostos e Retenções
                </div>
                <div className="grid grid-cols-4 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel>Valor Serviço</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="issRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aliq. ISS (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="issRetained"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 h-10 border rounded px-3 bg-background">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          ISS Retido?
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="pisValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIS</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
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
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {selectedTransaction ? 'Salvar Alterações' : 'Criar Rascunho'}
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
            <AlertDialogTitle>Excluir NFS-e?</AlertDialogTitle>
            <AlertDialogDescription>
              Apenas notas em rascunho ou rejeitadas podem ser excluídas.
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
          <CardTitle>Histórico de Notas de Serviço</CardTitle>
          <CardDescription>
            Gerencie o faturamento de serviços e integrações com prefeituras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emissão</TableHead>
                <TableHead>Tomador</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>RPS / Verif.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {t.takerName}
                    <br />
                    <span className="text-xs text-muted-foreground font-mono">
                      {t.takerCnpj}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-1 bg-muted rounded border mr-1">
                      {t.serviceCode}
                    </span>
                    {t.description}
                  </TableCell>
                  <TableCell>{getStatusBadge(t.nfseStatus)}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {t.rpsNumber || '-'}
                    <br />
                    {t.verificationCode || ''}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(t.value)}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {t.nfseStatus !== 'authorized' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleTransmit(t)}
                          disabled={isTransmitting}
                        >
                          {isTransmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Transmitir
                        </Button>
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
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() =>
                            toast({
                              title: 'Download PDF',
                              description: 'Iniciando download...',
                            })
                          }
                        >
                          <FileCheck className="h-3 w-3" /> PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-50 cursor-not-allowed"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhuma nota fiscal de serviço encontrada.
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
