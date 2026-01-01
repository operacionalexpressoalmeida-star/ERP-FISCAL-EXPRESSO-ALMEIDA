import { useErpStore, ClosingPeriod } from '@/stores/useErpStore'
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
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function ApprovalsPage() {
  const { closingPeriods, approveClosing, rejectClosing, companies, userRole } =
    useErpStore()

  const pendingClosings = closingPeriods.filter((c) => c.status === 'pending')

  const handleApprove = (id: string) => {
    approveClosing(id, userRole)
    toast({
      title: 'Aprovado',
      description: 'Fechamento autorizado com sucesso.',
    })
  }

  const handleReject = (id: string) => {
    rejectClosing(id)
    toast({
      title: 'Rejeitado',
      description: 'Solicitação negada.',
      variant: 'destructive',
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Workflow de Aprovação
        </h1>
        <p className="text-muted-foreground">
          Gerenciamento de solicitações pendentes e fechamentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fechamentos Contábeis Pendentes</CardTitle>
          <CardDescription>
            Solicitações de encerramento de período que aguardam autorização.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingClosings.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {companies.find((c) => c.id === item.companyId)?.name}
                  </TableCell>
                  <TableCell>
                    {item.month}/{item.year}
                  </TableCell>
                  <TableCell className="capitalize">
                    {item.requestedBy}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      Pendente
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.id)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(item.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingClosings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma solicitação pendente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aprovador</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closingPeriods
                .filter((c) => c.status !== 'pending')
                .slice(0, 5)
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {companies.find((c) => c.id === item.companyId)?.name}
                    </TableCell>
                    <TableCell>
                      {item.month}/{item.year}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'approved' ? 'default' : 'destructive'
                        }
                      >
                        {item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.approvedBy || '-'}</TableCell>
                    <TableCell>
                      {item.approvedAt
                        ? new Date(item.approvedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
