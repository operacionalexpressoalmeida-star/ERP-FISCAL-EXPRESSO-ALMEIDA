import { useErpStore, Company } from '@/stores/useErpStore'
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
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

const companySchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  type: z.enum(['Matrix', 'Branch']),
  state: z.string().length(2, 'Sigla do estado inválida'),
  city: z.string().min(3, 'Cidade muito curta'),
})

export default function OrganizationList() {
  const { companies, addCompany, updateCompany, removeCompany, userRole } =
    useErpStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)

  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      type: 'Branch',
    },
  })

  useEffect(() => {
    if (selectedCompany) {
      form.reset({
        name: selectedCompany.name,
        cnpj: selectedCompany.cnpj,
        type: selectedCompany.type,
        state: selectedCompany.state,
        city: selectedCompany.city,
      })
    } else {
      form.reset({
        name: '',
        cnpj: '',
        type: 'Branch',
        state: '',
        city: '',
      })
    }
  }, [selectedCompany, form])

  function onSubmit(values: z.infer<typeof companySchema>) {
    if (selectedCompany) {
      updateCompany(selectedCompany.id, values)
      toast({
        title: 'Unidade atualizada',
        description: 'As informações foram salvas com sucesso.',
      })
    } else {
      addCompany(values)
      toast({
        title: 'Unidade criada',
        description: 'Nova unidade registrada com sucesso.',
      })
    }
    setIsDialogOpen(false)
    setSelectedCompany(null)
  }

  const handleDelete = () => {
    if (companyToDelete) {
      removeCompany(companyToDelete.id)
      toast({
        title: 'Unidade removida',
        description: 'A unidade foi excluída permanentemente.',
        variant: 'destructive',
      })
      setCompanyToDelete(null)
    }
  }

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setSelectedCompany(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Estrutura Organizacional
          </h1>
          <p className="text-muted-foreground">
            Gerencie matrizes e filiais do grupo.
          </p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" /> Nova Unidade
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? 'Editar Unidade' : 'Cadastrar Unidade'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
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
                          <SelectItem value="Matrix">Matriz</SelectItem>
                          <SelectItem value="Branch">Filial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SP" maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!companyToDelete}
        onOpenChange={(open) => !open && setCompanyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente a
              unidade e pode afetar os registros vinculados.
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

      <Card>
        <CardHeader>
          <CardTitle>Unidades Registradas</CardTitle>
          <CardDescription>Lista de CNPJs ativos no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Regime</TableHead>
                {userRole === 'admin' && <TableHead className="w-[100px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="font-mono">{company.cnpj}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        company.type === 'Matrix' ? 'default' : 'secondary'
                      }
                    >
                      {company.type === 'Matrix' ? 'Matriz' : 'Filial'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {company.city} - {company.state}
                  </TableCell>
                  <TableCell>Lucro Real</TableCell>
                  {userRole === 'admin' && (
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(company)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCompanyToDelete(company)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
