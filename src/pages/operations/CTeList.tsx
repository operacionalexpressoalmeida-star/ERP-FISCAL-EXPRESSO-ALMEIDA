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
  RefreshCw,
  FileText,
  Upload,
  AlertCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  FileBarChart,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { PaginationControls } from '@/components/PaginationControls'
import { Badge } from '@/components/ui/badge'
import { XmlImportDialog } from '@/components/operations/XmlImportDialog'
import {
  CteFormDialog,
  CteFormData,
} from '@/components/operations/CteFormDialog'
import { ParsedFiscalDoc } from '@/lib/xml-parser'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { calculateCteTaxes } from '@/lib/tax-utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

const ITEMS_PER_PAGE = 10

export default function CTeList() {
  const {
    getFilteredTransactions,
    addTransaction,
    addTransactions,
    updateTransaction,
    removeTransaction,
    validateTransactionsWithSefaz,
    selectedCompanyId,
    userRole,
  } = useErpStore()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] =
    useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null)
  const [selectedTab, setSelectedTab] = useState('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)

  const allTransactions = getFilteredTransactions()
  // Filter for Revenue CT-e
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.type === 'revenue' && t.cteNumber),
    [allTransactions],
  )

  // Filter based on Tab
  const filteredData = useMemo(() => {
    if (selectedTab === 'pending') {
      return transactions.filter(
        (t) =>
          t.status === 'pending' ||
          (t.consistencyWarnings && t.consistencyWarnings.length > 0) ||
          t.sefazStatus === 'unchecked',
      )
    }
    if (selectedTab === 'processed') {
      return transactions.filter(
        (t) =>
          t.status === 'approved' &&
          (!t.consistencyWarnings || t.consistencyWarnings.length === 0) &&
          t.sefazStatus !== 'unchecked',
      )
    }
    return transactions
  }, [transactions, selectedTab])

  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const currentData = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredData, currentPage],
  )

  const handleImportConfirm = (items: ParsedFiscalDoc[]) => {
    let duplicateCount = 0
    const existingKeys = new Set(
      transactions.map((t) => t.accessKey || t.cteNumber),
    )

    const newTransactions: any[] = []

    items.forEach((item) => {
      const isDuplicate = item.accessKey
        ? existingKeys.has(item.accessKey)
        : existingKeys.has(item.cteNumber)

      if (isDuplicate) {
        duplicateCount++
        return
      }

      let finalItem = { ...item }
      if (
        finalItem.origin &&
        finalItem.destination &&
        finalItem.value &&
        finalItem.icmsValue === 0
      ) {
        const taxes = calculateCteTaxes(
          finalItem.value,
          finalItem.origin,
          finalItem.destination,
        )
        finalItem = { ...finalItem, ...taxes }
      }

      // If imported via Dialog, status logic is handled there (pending if warnings)
      // but ensure we pass it correctly
      newTransactions.push({
        ...finalItem,
        companyId:
          selectedCompanyId === 'consolidated' ? 'c1' : selectedCompanyId,
        status: finalItem.status || 'approved',
      })
    })

    if (newTransactions.length > 0) {
      addTransactions(newTransactions)
    }

    if (duplicateCount > 0) {
      toast({
        title: 'Duplicidades Ignoradas',
        description: `${duplicateCount} documentos já existiam e não foram importados.`,
        variant: 'warning',
      })
    }
  }

  const handleManualSave = (data: CteFormData) => {
    if (transactionToEdit) {
      // If editing, assume regularization if it was pending
      updateTransaction(transactionToEdit.id, {
        ...data,
        type: 'revenue',
        status: 'approved', // Resolve pending status
        consistencyWarnings: [], // Clear warnings after manual edit
      })
      toast({
        title: 'CT-e Atualizado',
        description: 'As alterações foram salvas e a pendência resolvida.',
      })
    } else {
      addTransaction({
        ...data,
        type: 'revenue',
        status: 'approved',
      })
      toast({
        title: 'CT-e Registrado',
        description: 'Novo conhecimento de transporte adicionado.',
      })
    }
    setTransactionToEdit(null)
  }

  const handleDelete = () => {
    if (transactionToDelete) {
      removeTransaction(transactionToDelete.id)
      toast({
        title: 'CT-e Excluído',
        description: 'O registro foi removido permanentemente.',
        variant: 'destructive',
      })
      setTransactionToDelete(null)
    }
  }

  const handleValidateSefaz = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'Seleção Vazia',
        description: 'Selecione pelo menos um item para validar.',
        variant: 'warning',
      })
      return
    }

    setIsValidating(true)
    try {
      await validateTransactionsWithSefaz(selectedItems)
      toast({
        title: 'Validação Concluída',
        description: `${selectedItems.length} registros atualizados com a SEFAZ.`,
      })
      setSelectedItems([])
    } catch (error) {
      toast({
        title: 'Erro na Validação',
        description: 'Falha ao comunicar com SEFAZ.',
        variant: 'destructive',
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(currentData.map((t) => t.id))
    } else {
      setSelectedItems([])
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const openEditDialog = (t: Transaction) => {
    setTransactionToEdit(t)
    setIsFormOpen(true)
  }

  const openNewDialog = () => {
    setTransactionToEdit(null)
    setIsFormOpen(true)
  }

  const getAlertStatus = (t: Transaction) => {
    const today = new Date()
    const docDate = new Date(t.date)
    const diffTime = Math.abs(today.getTime() - docDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (!t.accessKey) {
      return {
        type: 'error',
        icon: AlertCircle,
        message: 'Chave de acesso ausente',
        class: 'text-rose-500',
      }
    }

    if (t.status === 'pending') {
      if (diffDays > 30) {
        return {
          type: 'overdue',
          icon: Clock,
          message: `Pendente há ${diffDays} dias`,
          class: 'text-rose-500',
        }
      }
      return {
        type: 'pending',
        icon: AlertTriangle,
        message: 'Aguardando aprovação',
        class: 'text-amber-500',
      }
    }

    return null
  }

  const getSefazBadge = (status?: string) => {
    switch (status) {
      case 'authorized':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
          >
            <ShieldCheck className="h-3 w-3" /> Autorizado
          </Badge>
        )
      case 'canceled':
        return (
          <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="h-3 w-3" /> Cancelado
          </Badge>
        )
      case 'denied':
        return (
          <Badge variant="destructive" className="gap-1">
            <ShieldX className="h-3 w-3" /> Denegado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <AlertCircle className="h-3 w-3" /> Não verif.
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Conhecimentos de Transporte (CT-e)
          </h1>
          <p className="text-muted-foreground">
            Gestão de emissões, validação fiscal e controle de pendências.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedItems.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleValidateSefaz}
              disabled={isValidating}
            >
              {isValidating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Validar SEFAZ ({selectedItems.length})
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/reports/cte-tax">
              <FileBarChart className="mr-2 h-4 w-4" /> Relatório Fiscal
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar XML
          </Button>
          {userRole === 'admin' && (
            <Button variant="default" onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" /> Nova Emissão
            </Button>
          )}
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">
            Dashboard de Pendências
            {transactions.filter(
              (t) =>
                t.status === 'pending' ||
                (t.consistencyWarnings && t.consistencyWarnings.length > 0),
            ).length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1">
                {
                  transactions.filter(
                    (t) =>
                      t.status === 'pending' ||
                      (t.consistencyWarnings &&
                        t.consistencyWarnings.length > 0),
                  ).length
                }
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processados</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTab === 'pending'
                  ? 'Pendências para Regularização'
                  : 'Histórico de Emissões'}
              </CardTitle>
              <CardDescription>
                {selectedTab === 'pending'
                  ? 'Itens que requerem atenção manual ou validação.'
                  : 'Documentos emitidos, status fiscal e tributos.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          currentData.length > 0 &&
                          selectedItems.length === currentData.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Origem / Destino</TableHead>
                    <TableHead>Autenticidade SEFAZ</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status Interno</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((t) => {
                    const alert = getAlertStatus(t)
                    const hasWarnings =
                      t.consistencyWarnings && t.consistencyWarnings.length > 0

                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(t.id)}
                            onCheckedChange={() => toggleSelect(t.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {(alert || hasWarnings) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-transparent"
                                >
                                  {hasWarnings ? (
                                    <AlertOctagon className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <alert!.icon
                                      className={`h-4 w-4 ${alert!.class}`}
                                    />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {hasWarnings ? (
                                  <ul className="list-disc pl-4 text-xs">
                                    {t.consistencyWarnings?.map((w, i) => (
                                      <li key={i}>{w}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>{alert?.message}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(t.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 font-mono">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span>{t.cteNumber}</span>
                            </div>
                            {t.accessKey && (
                              <span
                                className="text-[10px] text-muted-foreground truncate max-w-[120px]"
                                title={t.accessKey}
                              >
                                {t.accessKey}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {t.origin && t.destination ? (
                            <div className="flex items-center gap-1 text-sm">
                              <span className="font-semibold">{t.origin}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-semibold">
                                {t.destination}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getSefazBadge(t.sefazStatus)}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(t.value)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              t.status === 'approved'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }
                          >
                            {t.status === 'approved'
                              ? 'Autorizado'
                              : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {t.status === 'pending' && userRole === 'admin' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(t)}
                                title="Regularizar / Editar"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(t)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {userRole === 'admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setTransactionToDelete(t)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {currentData.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center h-24 text-muted-foreground"
                      >
                        Nenhum registro encontrado nesta visão.
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
      </Tabs>

      <XmlImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onConfirm={handleImportConfirm}
      />

      <CteFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={transactionToEdit}
        onSave={handleManualSave}
      />

      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir CT-e?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita e removerá o registro fiscal.
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
    </div>
  )
}
