import { useErpStore, Contract } from '@/stores/useErpStore'
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
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { PaginationControls } from '@/components/PaginationControls'
import { Badge } from '@/components/ui/badge'

const contractSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  partyName: z.string().min(3, 'Nome obrigatório'),
  partyRole: z.enum(['Customer', 'Supplier']),
  type: z.enum(['Service', 'Transport', 'Lease']),
  startDate: z.string(),
  endDate: z.string(),
  value: z.coerce.number().min(0),
  status: z.enum(['Active', 'Expired', 'Draft']),
  terms: z.string().optional(),
})

const ITEMS_PER_PAGE = 10

export default function ContractList() {
  const {
    getFilteredContracts,
    addContract,
    updateContract,
    removeContract,
    companies,
    selectedCompanyId,
    userRole,
  } = useErpStore()

  const contracts = getFilteredContracts()
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(contracts.length / ITEMS_PER_PAGE)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  )
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(
    null,
  )

  const form = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      companyId: selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
      status: 'Draft',
      type: 'Transport',
      partyRole: 'Customer',
    },
  })

  // Set form values on edit
  useState(() => {
    if (selectedContract) {
      form.reset(selectedContract)
    } else {
      form.reset({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        companyId:
          selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
        status: 'Draft',
        type: 'Transport',
        partyRole: 'Customer',
        partyName: '',
        value: 0,
        terms: '',
      })
    }
  })

  function onSubmit(values: z.infer<typeof contractSchema>) {
    if (selectedContract) {
      updateContract(selectedContract.id, {
        ...values,
        terms: values.terms || '',
      })
      toast({ title: 'Contrato Atualizado' })
    } else {
      addContract({
        ...values,
        terms: values.terms || '',
      })
      toast({ title: 'Contrato Criado' })
    }
    setIsDialogOpen(false)
    setSelectedContract(null)
  }

  const handleDelete = () => {
    if (contractToDelete) {
      removeContract(contractToDelete.id)
      toast({ title: 'Contrato Excluído', variant: 'destructive' })
      setContractToDelete(null)
    }
  }

  const openNewDialog = () => {
    setSelectedContract(null)
    form.reset({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      companyId: selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
      status: 'Draft',
      type: 'Transport',
      partyRole: 'Customer',
      partyName: '',
      value: 0,
      terms: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (c: Contract) => {
    setSelectedContract(c)
    form.reset({
      companyId: c.companyId,
      partyName: c.partyName,
      partyRole: c.partyRole,
      type: c.type,
      startDate: c.startDate,
      endDate: c.endDate,
      value: c.value,
      status: c.status,
      terms: c.terms,
    })
    setIsDialogOpen(true)
  }

  const currentData = contracts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestão de Contratos
          </h1>
          <p className="text-muted-foreground">
            Contratos de Frete e Fornecedores.
          </p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" /> Novo Contrato
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratos Vigentes</CardTitle>
          <CardDescription>
            Lista de acordos comerciais registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parte</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.partyName}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.partyRole === 'Customer' ? 'Cliente' : 'Fornecedor'}
                    </div>
                  </TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(c.startDate).toLocaleDateString()} até{' '}
                    {new Date(c.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{formatCurrency(c.value)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'Active'
                          ? 'default'
                          : c.status === 'Expired'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {c.status === 'Active'
                        ? 'Ativo'
                        : c.status === 'Expired'
                          ? 'Expirado'
                          : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setContractToDelete(c)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum contrato encontrado.
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedContract ? 'Editar Contrato' : 'Novo Contrato'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={
                          selectedCompanyId !== 'consolidated' &&
                          !selectedContract
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Rascunho</SelectItem>
                          <SelectItem value="Active">Ativo</SelectItem>
                          <SelectItem value="Expired">Expirado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="partyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Parte</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cliente ou Fornecedor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partyRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Papel</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Customer">Cliente</SelectItem>
                          <SelectItem value="Supplier">Fornecedor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contrato</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Transport">Transporte</SelectItem>
                          <SelectItem value="Service">Serviço</SelectItem>
                          <SelectItem value="Lease">Locação</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Global</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termos e Condições</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Detalhes do contrato..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Salvar Contrato
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!contractToDelete}
        onOpenChange={() => setContractToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
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
