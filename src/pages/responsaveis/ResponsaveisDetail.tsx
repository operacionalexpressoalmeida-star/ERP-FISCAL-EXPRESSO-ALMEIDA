import { useParams, Link } from 'react-router-dom'
import { useCargoStore } from '@/stores/useCargoStore'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, UserCheck } from 'lucide-react'
import { NotFound } from '@/pages/NotFound' // Assuming NotFound export structure

export default function ResponsaveisDetail() {
  const { id } = useParams<{ id: string }>()
  const { loads, responsibles } = useCargoStore()

  const responsible = responsibles.find((r) => r.id === id)

  if (!responsible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h2 className="text-xl font-bold">Responsável não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/responsaveis">Voltar para lista</Link>
        </Button>
      </div>
    )
  }

  const responsibleLoads = loads.filter((l) => l.responsibleId === id)
  const totalCargo = responsibleLoads.reduce((acc, l) => acc + l.cargoValue, 0)
  const totalAssociated = responsibleLoads.reduce(
    (acc, l) => acc + l.associatedValue,
    0,
  )

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/responsaveis">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {responsible.name}
          </h1>
          <p className="text-muted-foreground">Detalhes de movimentação</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Valor Carga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCargo)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Valor Associado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {formatCurrency(totalAssociated)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Tabela de Cargas
          </CardTitle>
          <CardDescription>
            Histórico completo de solicitações para este responsável.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor da Carga</TableHead>
                <TableHead className="text-right">Valor Associado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responsibleLoads.map((load) => (
                <TableRow
                  key={load.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-mono font-medium">
                    {load.requestNumber}
                  </TableCell>
                  <TableCell>
                    {new Date(load.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(load.cargoValue)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-secondary">
                    {formatCurrency(load.associatedValue)}
                  </TableCell>
                </TableRow>
              ))}
              {responsibleLoads.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground h-24"
                  >
                    Nenhuma carga registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Subtotais</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totalCargo)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totalAssociated)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
