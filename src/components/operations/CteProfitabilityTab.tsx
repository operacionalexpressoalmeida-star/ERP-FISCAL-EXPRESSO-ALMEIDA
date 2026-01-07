import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Transaction } from '@/stores/useErpStore'

interface CteProfitabilityTabProps {
  netRevenue: number
  totalLinkedExpenses: number
  linkedExpenses: Transaction[]
}

export function CteProfitabilityTab({
  netRevenue,
  totalLinkedExpenses,
  linkedExpenses,
}: CteProfitabilityTabProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Receita Líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor do Frete - Impostos - Custos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Custos Vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(totalLinkedExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {linkedExpenses.length} despesas lançadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-md">
        <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
          <h4 className="font-semibold text-sm">Despesas da Operação</h4>
          <Button size="sm" variant="outline">
            <Plus className="h-3 w-3 mr-1" /> Vincular Despesa
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedExpenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.description}</TableCell>
                <TableCell>
                  <span className="text-xs bg-muted px-1 rounded">
                    {e.category}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(e.value)}
                </TableCell>
              </TableRow>
            ))}
            {linkedExpenses.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  Nenhum custo vinculado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
