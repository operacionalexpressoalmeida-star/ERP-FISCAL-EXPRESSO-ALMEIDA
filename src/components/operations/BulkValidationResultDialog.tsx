import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { ValidationResult } from '@/lib/tax-utils'
import { Transaction } from '@/stores/useErpStore'
import { Badge } from '@/components/ui/badge'

interface BulkValidationResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: { tx: Transaction; result: ValidationResult }[]
}

export function BulkValidationResultDialog({
  open,
  onOpenChange,
  results,
}: BulkValidationResultDialogProps) {
  const successCount = results.filter(
    (r) => r.result.isValid && r.result.warnings.length === 0,
  ).length
  const warningCount = results.filter(
    (r) => r.result.isValid && r.result.warnings.length > 0,
  ).length
  const errorCount = results.filter((r) => !r.result.isValid).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Resultado da Validação em Massa</DialogTitle>
          <DialogDescription>
            Comparativo com as regras do CT-e Padrão e configurações globais.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-6 p-4 bg-muted/20 border-y">
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <CheckCircle2 className="h-5 w-5" />
            {successCount} Aprovados
          </div>
          <div className="flex items-center gap-2 text-amber-600 font-medium">
            <AlertTriangle className="h-5 w-5" />
            {warningCount} Com Avisos
          </div>
          <div className="flex items-center gap-2 text-rose-600 font-medium">
            <XCircle className="h-5 w-5" />
            {errorCount} Reprovados
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CT-e</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(({ tx, result }) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.cteNumber}</TableCell>
                  <TableCell>
                    {!result.isValid ? (
                      <Badge variant="destructive">Falha</Badge>
                    ) : result.warnings.length > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800"
                      >
                        Atenção
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 text-emerald-800 border-emerald-200"
                      >
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {result.errors.map((e, i) => (
                        <div
                          key={`err-${i}`}
                          className="flex items-center gap-1 text-rose-600"
                        >
                          <XCircle className="h-3 w-3" /> {e}
                        </div>
                      ))}
                      {result.warnings.map((w, i) => (
                        <div
                          key={`warn-${i}`}
                          className="flex items-center gap-1 text-amber-600"
                        >
                          <AlertTriangle className="h-3 w-3" /> {w}
                        </div>
                      ))}
                      {result.isValid && result.warnings.length === 0 && (
                        <span className="text-muted-foreground italic">
                          Nenhuma inconsistência encontrada.
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
