import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useErpStore } from '@/stores/useErpStore'
import { FileText, ArrowRight } from 'lucide-react'

interface AuditLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditLogDialog({ open, onOpenChange }: AuditLogDialogProps) {
  const { standardCteAuditLog, transactions } = useErpStore()

  const getCteNumber = (id: string | null) => {
    if (!id) return 'Nenhum'
    const tx = transactions.find((t) => t.id === id)
    return tx ? tx.cteNumber : 'Desconhecido'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações: CT-e Padrão</DialogTitle>
          <DialogDescription>
            Log de auditoria das modificações no documento de referência.
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Alteração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standardCteAuditLog.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {log.userName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        {getCteNumber(log.previousCteId)}
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-blue-700 font-semibold border border-blue-100">
                        <FileText className="h-3 w-3" />
                        {getCteNumber(log.newCteId)}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {standardCteAuditLog.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro de alteração encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
