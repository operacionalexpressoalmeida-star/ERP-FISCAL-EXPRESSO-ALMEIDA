import { useErpStore } from '@/stores/useErpStore'
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
import { RefreshCw, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { PaginationControls } from '@/components/PaginationControls'
import { Badge } from '@/components/ui/badge'

const ITEMS_PER_PAGE = 10

export default function CTeList() {
  const { getFilteredTransactions } = useErpStore()

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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Conhecimentos de Transporte (CT-e)
          </h1>
          <p className="text-muted-foreground">
            Gestão de emissões fiscais de transporte.
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Emissões</CardTitle>
          <CardDescription>
            Documentos emitidos e status fiscal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Origem / Destino</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-mono">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      {t.cteNumber}
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
                  <TableCell className="max-w-[250px] truncate">
                    {t.description}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">
                    {formatCurrency(t.value)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Autorizado
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
    </div>
  )
}
