import { useErpStore, ImportBatch } from '@/stores/useErpStore'
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
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportDashboard() {
  const { importHistory } = useErpStore()
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null)

  // Stats
  const totalProcessed = importHistory.reduce(
    (acc, batch) => acc + batch.totalFiles,
    0,
  )
  const totalSuccess = importHistory.reduce(
    (acc, batch) => acc + batch.successCount,
    0,
  )
  const totalPartial = importHistory.reduce(
    (acc, batch) => acc + batch.partialCount,
    0,
  )
  const totalErrors = importHistory.reduce(
    (acc, batch) => acc + batch.errorCount,
    0,
  )
  const successRate =
    totalProcessed > 0
      ? (((totalSuccess + totalPartial) / totalProcessed) * 100).toFixed(1)
      : '0.0'

  const getStatusBadge = (status: ImportBatch['status']) => {
    switch (status) {
      case 'Success':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-100 text-emerald-700 border-emerald-200"
          >
            Sucesso
          </Badge>
        )
      case 'Partial':
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-700 border-amber-200"
          >
            Parcial
          </Badge>
        )
      case 'Error':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700">
            Erro
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    if (category === 'Receitas')
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Receitas
        </Badge>
      )
    if (category === 'Despesas')
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          Despesas
        </Badge>
      )
    return <Badge variant="outline">Outros</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Arquivos Processados
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcessed}</div>
            <p className="text-xs text-muted-foreground">Total histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Sucesso
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Incluindo parciais</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Importações Parciais
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {totalPartial}
            </div>
            <p className="text-xs text-muted-foreground">Requerem revisão</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {totalErrors}
            </div>
            <p className="text-xs text-muted-foreground">Não importados</p>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Importações</CardTitle>
          <CardDescription>
            Registro de lotes processados pelo sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-center">Qtd. Arquivos</TableHead>
                <TableHead className="text-center">Parciais</TableHead>
                <TableHead className="text-center">Categoria</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importHistory.map((batch) => (
                <TableRow
                  key={batch.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    batch.status !== 'Success' && setSelectedBatch(batch)
                  }
                >
                  <TableCell>
                    {format(new Date(batch.date), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{batch.user}</TableCell>
                  <TableCell className="text-center">
                    {batch.totalFiles}
                  </TableCell>
                  <TableCell className="text-center text-amber-600 font-semibold">
                    {batch.partialCount > 0 ? batch.partialCount : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {getCategoryBadge(batch.category)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(batch.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {batch.status !== 'Success' && (
                      <span className="text-xs text-blue-600 underline cursor-pointer">
                        Ver Logs
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {importHistory.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum histórico disponível.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedBatch}
        onOpenChange={(open) => !open && setSelectedBatch(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lote de Importação</DialogTitle>
            <DialogDescription>
              Lote ID: {selectedBatch?.id} • Processado em{' '}
              {selectedBatch &&
                format(new Date(selectedBatch.date), 'dd/MM/yyyy HH:mm')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Sucessos: {selectedBatch?.successCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Parciais: {selectedBatch?.partialCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-rose-500" />
              <span>Erros: {selectedBatch?.errorCount}</span>
            </div>
          </div>

          <ScrollArea className="h-[300px] border rounded-md">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedBatch?.logs?.map((log, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-xs">
                      {log.fileName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.status === 'Success' ? (
                        <span className="text-emerald-600">Sucesso</span>
                      ) : log.status === 'Partial' ? (
                        <span className="text-amber-600 font-semibold">
                          Parcial
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold">
                          Erro
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.details.join('; ')}
                    </TableCell>
                  </TableRow>
                ))}
                {(!selectedBatch?.logs || selectedBatch?.logs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Logs detalhados não disponíveis para este lote (legado).
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
