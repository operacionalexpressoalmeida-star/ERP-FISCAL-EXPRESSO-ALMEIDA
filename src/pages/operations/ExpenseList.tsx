import {
  useErpStore,
  Transaction,
  TransactionStatus,
} from '@/stores/useErpStore'
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
  RefreshCw,
  FileUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Paperclip,
  Download,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { XmlImportDialog } from '@/components/operations/XmlImportDialog'
import { ParsedFiscalDoc } from '@/lib/xml-parser'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  // Fleet fields
  fuelType: z.string().optional(),
  fuelQuantity: z.coerce.number().optional(),
  odometer: z.coerce.number().optional(),
  attachment: z.any().optional(), // File input handler
})

const ITEMS_PER_PAGE = 10
const TARGET_CNPJ = '49.069.638/0001-78'

// Helper to convert file to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export default function ExpenseList() {
  const {
    getFilteredTransactions,
    getFilteredContracts,
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearExpenses,
    addIntegrationLog,
    syncSefazExpenses,
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
  const [isXmlImportOpen, setIsXmlImportOpen] = useState(false)
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null)
  const [generatingCiotFor, setGeneratingCiotFor] = useState<string | null>(
    null,
  )
  const [activeTab, setActiveTab] = useState('list')

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
      category: 'Other',
    },
  })

  // Watch category to conditionally show fuel fields
  const watchedCategory = form.watch('category')

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
        fuelType: selectedTransaction.fuelType || '',
        fuelQuantity: selectedTransaction.fuelQuantity || 0,
        odometer: selectedTransaction.odometer || 0,
        attachment: undefined,
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
        category: 'Other',
        isDeductibleIrpjCsll: true,
        hasCreditPisCofins: true,
        hasCreditIcms: false,
        contractId: 'no_contract',
        fuelType: '',
        fuelQuantity: 0,
        odometer: 0,
        attachment: undefined,
      })
    }
  }, [selectedTransaction, form, selectedCompanyId])

  async function onSubmit(values: z.infer<typeof expenseSchema>) {
    const pisValue = values.hasCreditPisCofins ? values.value * 0.0165 : 0
    const cofinsValue = values.hasCreditPisCofins ? values.value * 0.076 : 0
    const icmsValue = values.hasCreditIcms ? values.value * 0.12 : 0

    const contractId =
      values.contractId && values.contractId !== 'no_contract'
        ? values.contractId
        : undefined

    let attachmentUrl = selectedTransaction?.attachmentUrl

    if (values.attachment && values.attachment.length > 0) {
      try {
        const file = values.attachment[0]
        if (file.type !== 'application/pdf') {
          toast({
            title: 'Arquivo Inválido',
            description: 'Apenas arquivos PDF são permitidos.',
            variant: 'destructive',
          })
          return
        }
        // In a real app, upload to S3/Storage and get URL.
        // For this demo, we use DataURL to simulate persistence.
        attachmentUrl = await fileToBase64(file)
      } catch (error) {
        toast({
          title: 'Erro no Upload',
          description: 'Não foi possível processar o arquivo.',
          variant: 'destructive',
        })
        return
      }
    }

    if (selectedTransaction) {
      updateTransaction(selectedTransaction.id, {
        ...values,
        type: 'expense',
        pisValue,
        cofinsValue,
        icmsValue,
        contractId,
        attachmentUrl,
      })
      toast({
        title: 'Despesa Atualizada',
        description: 'Registro alterado com sucesso.',
      })
    } else {
      addTransaction({
        ...values,
        type: 'expense',
        status: 'approved', // Manual entry is approved
        pisValue,
        cofinsValue,
        icmsValue,
        contractId,
        attachmentUrl,
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

  const handleDeleteAll = () => {
    clearExpenses()
    setIsDeleteAllOpen(false)
    toast({
      title: 'Módulo Resetado',
      description: 'Todas as despesas foram apagadas com sucesso.',
      variant: 'destructive',
    })
  }

  const handleApprove = (t: Transaction) => {
    updateTransaction(t.id, { status: 'approved' })
    toast({ title: 'Despesa Aprovada', description: 'Registro contabilizado.' })
  }

  const handleReject = (t: Transaction) => {
    updateTransaction(t.id, { status: 'rejected' })
    toast({
      title: 'Despesa Rejeitada',
      description: 'Registro descartado.',
      variant: 'destructive',
    })
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

  const handleSyncSefaz = async () => {
    try {
      setIsSyncing(true)
      const count = await syncSefazExpenses(TARGET_CNPJ)
      if (count > 0) {
        toast({
          title: 'Sincronização Concluída',
          description: `${count} novas despesas importadas. Verifique em "Pendente".`,
        })
      } else {
        toast({
          title: 'Tudo em Dia',
          description: 'Não foram encontrados novos documentos na SEFAZ.',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro na Sincronização',
        description: 'Falha ao comunicar com SEFAZ.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleXmlConfirm = (items: ParsedFiscalDoc[]) => {
    let count = 0
    items.forEach((item) => {
      addTransaction({
        ...item,
        companyId:
          selectedCompanyId !== 'consolidated' ? selectedCompanyId : 'c1',
        status: 'pending', // Imported items need approval
        isDeductibleIrpjCsll: true,
      })
      count++
    })
    toast({
      title: 'Importação Concluída',
      description: `${count} registros adicionados para aprovação.`,
    })
  }

  const openEditDialog = (t: Transaction) => {
    setSelectedTransaction(t)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setSelectedTransaction(null)
    setIsDialogOpen(true)
  }

  const handleCategoryChange = (category: string) => {
    form.setValue('category', category)

    // Automated Tax Categorization Logic
    let taxSettings = {
      isDeductibleIrpjCsll: true,
      hasCreditPisCofins: false,
      hasCreditIcms: false,
    }

    switch (category) {
      case 'Fuel':
      case 'Maintenance':
      case 'FreightPayment': // CT-e / Subcontracting
        taxSettings = {
          isDeductibleIrpjCsll: true,
          hasCreditPisCofins: true,
          hasCreditIcms: true,
        }
        break
      case 'Tolls':
        taxSettings = {
          isDeductibleIrpjCsll: true,
          hasCreditPisCofins: false,
          hasCreditIcms: false,
        }
        break
      case 'Administrative':
        taxSettings = {
          isDeductibleIrpjCsll: true,
          hasCreditPisCofins: true, // e.g. electricity, rent (sometimes)
          hasCreditIcms: false,
        }
        break
      case 'Personnel':
        taxSettings = {
          isDeductibleIrpjCsll: true,
          hasCreditPisCofins: false,
          hasCreditIcms: false,
        }
        break
      case 'Uncategorized':
        taxSettings = {
          isDeductibleIrpjCsll: false,
          hasCreditPisCofins: false,
          hasCreditIcms: false,
        }
        break
      default: // Other
        taxSettings = {
          isDeductibleIrpjCsll: true,
          hasCreditPisCofins: false,
          hasCreditIcms: false,
        }
    }

    form.setValue('isDeductibleIrpjCsll', taxSettings.isDeductibleIrpjCsll)
    form.setValue('hasCreditPisCofins', taxSettings.hasCreditPisCofins)
    form.setValue('hasCreditIcms', taxSettings.hasCreditIcms)
  }

  const currentData = transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  // Chart Data Preparation
  const expensesByCategory = Object.entries(
    transactions.reduce(
      (acc, t) => {
        const cat = t.category || 'Uncategorized'
        acc[cat] = (acc[cat] || 0) + t.value
        return acc
      },
      {} as Record<string, number>,
    ),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const chartConfig = {
    value: { label: 'Valor', color: 'hsl(var(--primary))' },
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestão de Despesas
          </h1>
          <p className="text-muted-foreground">
            Controle de custos operacionais e administrativos.
          </p>
        </div>
        {userRole === 'admin' && (
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              onClick={handleSyncSefaz}
              disabled={isSyncing}
              className="hidden sm:flex"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
              />
              Sincronizar SEFAZ
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleSyncSefaz}>
                  Sincronizar SEFAZ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsXmlImportOpen(true)}>
                  Importar XML
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteAllOpen(true)}
                >
                  Apagar Todos os Dados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="secondary"
              onClick={() => setIsXmlImportOpen(true)}
              className="hidden sm:flex"
            >
              <FileUp className="mr-2 h-4 w-4" /> Importar XML
            </Button>
            <Button onClick={openNewDialog} variant="default">
              <Plus className="mr-2 h-4 w-4" /> Nova Despesa
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteAllOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Apagar Todos os Dados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <XmlImportDialog
        open={isXmlImportOpen}
        onOpenChange={setIsXmlImportOpen}
        onConfirm={handleXmlConfirm}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="list">Lista de Despesas</TabsTrigger>
          <TabsTrigger value="analytics">Dashboard Analítico</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Despesas</CardTitle>
              <CardDescription>
                Custos operacionais registrados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhes</TableHead>
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
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {t.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t.category || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {t.status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Pendente
                          </Badge>
                        )}
                        {t.status === 'approved' && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            Aprovado
                          </Badge>
                        )}
                        {t.status === 'rejected' && (
                          <Badge variant="destructive">Rejeitado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {t.category === 'Fuel' && t.fuelQuantity && (
                            <span className="text-xs text-muted-foreground">
                              {t.fuelQuantity} L • {t.fuelType}
                            </span>
                          )}
                          {t.documentNumber && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3" />{' '}
                              {t.documentNumber}
                            </span>
                          )}
                          {t.attachmentUrl ? (
                            <div className="flex items-center gap-1">
                              <a
                                href={t.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Paperclip className="h-3 w-3" /> Comprovante
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Sem anexo
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-600">
                        -{formatCurrency(t.value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {t.status === 'pending' && userRole === 'admin' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(t)}
                                title="Aprovar"
                              >
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReject(t)}
                                title="Rejeitar"
                              >
                                <XCircle className="h-4 w-4 text-rose-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(t)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {t.category === 'FreightPayment' &&
                                !t.ciotCode && (
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
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setTransactionToDelete(t)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
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
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>
                  Distribuição de gastos do período.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[350px] w-full"
                >
                  <BarChart data={expensesByCategory}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Categorias</CardTitle>
                <CardDescription>Maiores ofensores de custo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expensesByCategory.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-rose-500' : 'bg-gray-400'}`}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
                        onValueChange={handleCategoryChange}
                        defaultValue={field.value}
                        value={field.value}
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
                            Pagamento de Frete (CT-e)
                          </SelectItem>
                          <SelectItem value="Administrative">
                            Administrativo
                          </SelectItem>
                          <SelectItem value="Personnel">Pessoal</SelectItem>
                          <SelectItem value="Tolls">Pedágio</SelectItem>
                          <SelectItem value="Other">Outros</SelectItem>
                          <SelectItem value="Uncategorized">
                            Não Categorizado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedCategory === 'Fuel' && (
                <div className="bg-muted/20 p-4 rounded-md border border-dashed border-primary/20 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <Truck className="h-4 w-4" /> Dados de Abastecimento
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="fuelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
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
                              <SelectItem value="Diesel S10">
                                Diesel S10
                              </SelectItem>
                              <SelectItem value="Diesel S500">
                                Diesel S500
                              </SelectItem>
                              <SelectItem value="Gasolina">Gasolina</SelectItem>
                              <SelectItem value="Etanol">Etanol</SelectItem>
                              <SelectItem value="Arla 32">Arla 32</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fuelQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Litros</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="odometer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Odômetro (km)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

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

              {/* Attachment Field */}
              <FormField
                control={form.control}
                name="attachment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anexar Comprovante (PDF)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) =>
                            field.onChange(
                              e.target.files ? e.target.files : null,
                            )
                          }
                        />
                        {selectedTransaction?.attachmentUrl && (
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Arquivo atual anexado.{' '}
                            <a
                              href={selectedTransaction.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline text-primary"
                            >
                              Visualizar
                            </a>
                          </div>
                        )}
                      </div>
                    </FormControl>
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

      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Atenção: Apagar Todos os Dados
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir TODAS as despesas registradas no
              módulo. Esta ação não pode ser desfeita e removerá permanentemente
              todo o histórico financeiro de despesas.
              <br />
              <br />
              Tem certeza absoluta que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
