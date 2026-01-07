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
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { PaginationControls } from '@/components/PaginationControls'
import { Badge } from '@/components/ui/badge'
import { XmlImportDialog } from '@/components/operations/XmlImportDialog'
import { ParsedFiscalDoc } from '@/lib/xml-parser'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const ITEMS_PER_PAGE = 10

export default function CTeList() {
  const { getFilteredTransactions, addTransaction, selectedCompanyId } =
    useErpStore()
  const [isImportOpen, setIsImportOpen] = useState(false)

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

      addTransaction({
        ...item,
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
        description: `${addedCount} novos CT-es registrados com sucesso.`,
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Conhecimentos de Transporte (CT-e)
          </h1>
          <p className="text-muted-foreground">
            Gestão de emissões fiscais e alertas operacionais.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link to="/reports/revenue-analytics">
              <BarChart3 className="mr-2 h-4 w-4" /> Análise Avançada
            </Link>
          </Button>
          <Button variant="default" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar XML
          </Button>
          <Button variant="outline" className="hidden sm:flex">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Emissões</CardTitle>
          <CardDescription>
            Documentos emitidos, status fiscal e alertas.
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
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((t) => {
                const alert = getAlertStatus(t)
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
                      <Badge
                        variant="secondary"
                        className="font-normal text-xs"
                      >
                        {t.category || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {t.cfop || '-'}
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
                  </TableRow>
                )
              })}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
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
    </div>
  )
}
