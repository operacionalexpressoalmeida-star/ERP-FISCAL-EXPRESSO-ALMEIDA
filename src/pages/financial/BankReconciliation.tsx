import { useErpStore, BankTransaction, Transaction } from '@/stores/useErpStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Upload, Link2, CheckCircle2 } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

export default function BankReconciliation() {
  const {
    bankTransactions,
    getFilteredTransactions,
    importBankTransactions,
    reconcileTransaction,
  } = useErpStore()
  const sysTransactions = getFilteredTransactions()

  const [selectedBankTx, setSelectedBankTx] = useState<string | null>(null)
  const [selectedSysTx, setSelectedSysTx] = useState<string | null>(null)

  const unreconciledBank = bankTransactions.filter((t) => !t.isReconciled)
  const unreconciledSys = sysTransactions.filter((t) => !t.isReconciled)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Mock Import
    const mockTxs: Omit<BankTransaction, 'id'>[] = [
      {
        date: '2024-02-10',
        description: 'TED RECEBIDA CLIENTE X',
        amount: 12000,
        type: 'credit',
        isReconciled: false,
      },
      {
        date: '2024-02-05',
        description: 'PGTO POSTO SHELL',
        amount: 4500,
        type: 'debit',
        isReconciled: false,
      },
      {
        date: '2024-02-12',
        description: 'TAR BANCARIA',
        amount: 45.5,
        type: 'debit',
        isReconciled: false,
      },
    ]

    importBankTransactions(mockTxs)
    toast({
      title: 'Arquivo Importado',
      description: `${mockTxs.length} transações carregadas.`,
    })
  }

  const handleReconcile = () => {
    if (selectedBankTx && selectedSysTx) {
      reconcileTransaction(selectedBankTx, selectedSysTx)
      setSelectedBankTx(null)
      setSelectedSysTx(null)
      toast({
        title: 'Conciliado',
        description: 'Transações vinculadas com sucesso.',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Conciliação Bancária
          </h1>
          <p className="text-muted-foreground">
            Importe extratos e vincule aos lançamentos do sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Input
              type="file"
              className="absolute opacity-0 w-full h-full cursor-pointer"
              onChange={handleFileUpload}
              accept=".csv,.ofx"
            />
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Importar Extrato
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Left: Bank */}
        <Card className="flex flex-col h-full">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Extrato
              Bancário (Pendente)
            </CardTitle>
            <CardDescription>Selecione um item para conciliar</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unreconciledBank.map((t) => (
                  <TableRow
                    key={t.id}
                    className={cn(
                      'cursor-pointer',
                      selectedBankTx === t.id &&
                        'bg-blue-100 hover:bg-blue-100',
                    )}
                    onClick={() =>
                      setSelectedBankTx(t.id === selectedBankTx ? null : t.id)
                    }
                  >
                    <TableCell>
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell
                      className={`text-right ${t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {t.type === 'credit' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Center Action (Desktop absolute or flex) */}

        {/* Right: System */}
        <Card className="flex flex-col h-full">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Sistema ERP
              (Pendente)
            </CardTitle>
            <CardDescription>
              Selecione o lançamento correspondente
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unreconciledSys.map((t) => (
                  <TableRow
                    key={t.id}
                    className={cn(
                      'cursor-pointer',
                      selectedSysTx === t.id &&
                        'bg-amber-100 hover:bg-amber-100',
                    )}
                    onClick={() =>
                      setSelectedSysTx(t.id === selectedSysTx ? null : t.id)
                    }
                  >
                    <TableCell>
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell
                      className={`text-right ${t.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {t.type === 'revenue' ? '+' : '-'}
                      {formatCurrency(t.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center p-4 bg-muted/30 rounded-lg border items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {selectedBankTx
            ? '1 Selecionado no Banco'
            : 'Nenhum selecionado no Banco'}
          {' + '}
          {selectedSysTx
            ? '1 Selecionado no Sistema'
            : 'Nenhum selecionado no Sistema'}
        </div>
        <Button
          disabled={!selectedBankTx || !selectedSysTx}
          onClick={handleReconcile}
          className="w-48"
        >
          <Link2 className="mr-2 h-4 w-4" /> Conciliar
        </Button>
      </div>
    </div>
  )
}
