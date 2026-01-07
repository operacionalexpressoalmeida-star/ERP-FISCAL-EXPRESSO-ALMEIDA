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
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
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

const ITEMS_PER_PAGE = 10

export default function CTeList() {
  const {
    getFilteredTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    selectedCompanyId,
    userRole,
  } = useErpStore()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] =
    useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null)

  // Only Revenue transactions (CT-e)
  const transactions = getFilteredTransactions().filter(
    (t) => t.type === 'revenue' && t.cteNumber,
  )

  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)

  const currentData = transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handleImportConfirm = (items: ParsedFiscalDoc[]) => {
    let addedCount = 0
    let duplicateCount = 0
    const existingKeys = new Set(
      transactions.map((t) => t.accessKey || t.cteNumber),
    )

    items.forEach((item) => {
      const isDuplicate = item.accessKey
        ? existingKeys.has(item.accessKey)
        : existingKeys.has(item.cteNumber)

      if (isDuplicate) {
        duplicateCount++
        return
      }

      // Auto-calc taxes if missing during import
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

      addTransaction({
        ...finalItem,
        companyId:
          selectedCompanyId === 'consolidated'
            ? 'c1' // Default to Matrix if consolidated
            : selectedCompanyId,
        status: 'approved', // Auto-approve imported revenues
      })
      addedCount++
    })

    if (addedCount > 0) {
      toast({
        title: 'Importação Concluída',
        description: `${addedCount} novos CT-es registrados com sucesso. Regras de categorização aplicadas.`,
      })
    }

    if (duplicateCount > 0) {
      toast({
        title: 'Duplicidades Encontradas',
        description: `${duplicateCount} documentos já existiam e foram ignorados.`,
        variant: 'warning',
      })
    }
  }

  const handleManualSave = (data: CteFormData) => {
    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, { ...data, type: 'revenue' })
      toast({
        title: 'CT-e Atualizado',
        description: 'As alterações foram salvas com sucesso.',
      })
    } else {
      addTransaction({
        ...data,
        type: 'revenue',
        status: 'approved', // Manual entry is approved by default
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

  const openEditDialog = (t: Transaction) => {
    setTransactionToEdit(t)
    setIsFormOpen(true)
  }

  const openNewDialog = () => {
    setTransactionToEdit(null)
    setIsFormOpen(true)
  }

  // Alert Logic Helper
  const getAlertStatus = (t: Transaction) => {
    const today = new Date()
    const docDate = new Date(t.date)
    const diffTime = Math.abs(today.getTime() - docDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Mock validation issues
    if (!t.accessKey) {
      return {
        type: 'error',
        icon: AlertCircle,
        message: 'Chave de acesso ausente',
        class: 'text-rose-500',
      }
    }

    // Pending Alert
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Conhecimentos de Transporte (CT-e)
          </h1>
          <p className="text-muted-foreground">
            Gestão de emissões fiscais e alertas operacionais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/reports/cte-tax">
              <FileBarChart className="mr-2 h-4 w-4" /> Relatório Fiscal
            </Link>
          </Button>
          <Button variant="outline" asChild className="hidden lg:flex">
            <Link to="/reports/revenue-analytics">
              <BarChart3 className="mr-2 h-4 w-4" /> Análise Avançada
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
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Emissões</CardTitle>
          <CardDescription>
            Documentos emitidos, status fiscal e tributos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Origem / Destino</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>CFOP</TableHead>
                <TableHead className="text-right">Tributos</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {userRole === 'admin' && <TableHead className="w-[80px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((t) => {
                const alert = getAlertStatus(t)
                const totalTaxes = t.icmsValue + t.pisValue + t.cofinsValue
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      {alert && (
                        <Tooltip>
                          <TooltipTrigger>
                            <alert.icon className={`h-4 w-4 ${alert.class}`} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{alert.message}</p>
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
                          <span className="font-semibold">{t.destination}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {t.category || 'Uncategorized'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {t.cfop || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex flex-col items-end text-xs text-muted-foreground">
                            <span>Imp: {formatCurrency(totalTaxes)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p>ICMS: {formatCurrency(t.icmsValue)}</p>
                            <p>PIS: {formatCurrency(t.pisValue)}</p>
                            <p>COFINS: {formatCurrency(t.cofinsValue)}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
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
                        {t.status === 'approved' ? 'Autorizado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    {userRole === 'admin' && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
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
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum CT-e encontrado.
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
