import { useErpStore, Asset } from '@/stores/useErpStore'
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
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, PenTool } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState, useEffect } from 'react'
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
import { toast } from '@/hooks/use-toast'
import { PaginationControls } from '@/components/PaginationControls'

const assetSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  name: z.string().min(3),
  category: z.enum(['Vehicle', 'Machinery', 'Equipment', 'Other']),
  acquisitionDate: z.string(),
  originalValue: z.coerce.number().min(0.01),
  residualValue: z.coerce.number().min(0),
  depreciationRate: z.coerce.number().min(0).max(100),
  status: z.enum(['Active', 'Sold', 'WrittenOff']),
})

const ITEMS_PER_PAGE = 10

export default function AssetList() {
  const {
    getFilteredAssets,
    addAsset,
    updateAsset,
    removeAsset,
    companies,
    selectedCompanyId,
    userRole,
    addTransaction,
  } = useErpStore()

  const assets = getFilteredAssets()
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(assets.length / ITEMS_PER_PAGE)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMaintDialogOpen, setIsMaintDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)

  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      acquisitionDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      category: 'Vehicle',
    },
  })

  // Maintenance Form
  const maintForm = useForm({
    defaultValues: {
      description: '',
      value: 0,
      date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (selectedAsset && !isMaintDialogOpen) {
      form.reset(selectedAsset)
    } else if (!isMaintDialogOpen) {
      form.reset({
        companyId:
          selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
        name: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        originalValue: 0,
        residualValue: 0,
        depreciationRate: 10,
        status: 'Active',
        category: 'Vehicle',
      })
    }
  }, [selectedAsset, form, selectedCompanyId, isMaintDialogOpen])

  function calculateDepreciation(asset: Asset) {
    const years =
      (new Date().getTime() - new Date(asset.acquisitionDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365)
    if (years < 0) return 0
    const depreciableAmount = asset.originalValue - asset.residualValue
    const depreciation =
      depreciableAmount * (asset.depreciationRate / 100) * years
    return Math.min(depreciation, depreciableAmount)
  }

  function onSubmit(values: z.infer<typeof assetSchema>) {
    if (selectedAsset) {
      updateAsset(selectedAsset.id, values)
      toast({ title: 'Ativo Atualizado' })
    } else {
      addAsset(values)
      toast({ title: 'Ativo Cadastrado' })
    }
    setIsDialogOpen(false)
    setSelectedAsset(null)
  }

  function onMaintSubmit(values: {
    description: string
    value: number
    date: string
  }) {
    if (selectedAsset) {
      addTransaction({
        companyId: selectedAsset.companyId,
        type: 'expense',
        category: 'Maintenance',
        description: `Manutenção: ${selectedAsset.name} - ${values.description}`,
        value: Number(values.value),
        date: values.date,
        assetId: selectedAsset.id,
        icmsValue: 0,
        pisValue: 0,
        cofinsValue: 0,
      })
      toast({
        title: 'Manutenção Registrada',
        description: 'Despesa criada com sucesso.',
      })
      setIsMaintDialogOpen(false)
      setSelectedAsset(null)
      maintForm.reset()
    }
  }

  const handleDelete = () => {
    if (assetToDelete) {
      removeAsset(assetToDelete.id)
      toast({ title: 'Ativo Removido', variant: 'destructive' })
      setAssetToDelete(null)
    }
  }

  const currentData = assets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ativos Imobilizados
          </h1>
          <p className="text-muted-foreground">
            Controle de frota, máquinas e equipamentos.
          </p>
        </div>
        {userRole === 'admin' && (
          <Button
            onClick={() => {
              setSelectedAsset(null)
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Ativo
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Valor Total (Original)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(assets.reduce((a, b) => a + b.originalValue, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Depreciação Acumulada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(
                assets.reduce((a, b) => a + calculateDepreciation(b), 0),
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Valor Contábil Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(
                assets.reduce(
                  (a, b) => a + (b.originalValue - calculateDepreciation(b)),
                  0,
                ),
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assets.filter((a) => a.category === 'Vehicle').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Bens</CardTitle>
          <CardDescription>Bens ativos e inativos da empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bem</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Aquisição</TableHead>
                <TableHead className="text-right">Valor Original</TableHead>
                <TableHead className="text-right">Depreciação</TableHead>
                <TableHead className="text-right">Valor Atual</TableHead>
                <TableHead className="text-right">Status</TableHead>
                {userRole === 'admin' && <TableHead className="w-[120px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((asset) => {
                const depreciation = calculateDepreciation(asset)
                const currentVal = asset.originalValue - depreciation
                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>
                      {new Date(asset.acquisitionDate).toLocaleDateString(
                        'pt-BR',
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(asset.originalValue)}
                    </TableCell>
                    <TableCell className="text-right text-rose-600">
                      -{formatCurrency(depreciation)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">
                      {formatCurrency(currentVal)}
                    </TableCell>
                    <TableCell className="text-right">{asset.status}</TableCell>
                    {userRole === 'admin' && (
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Manutenção"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setIsMaintDialogOpen(true)
                          }}
                        >
                          <PenTool className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setAssetToDelete(asset)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Asset Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAsset ? 'Editar Ativo' : 'Registrar Ativo'}
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
                          selectedCompanyId !== 'consolidated' && !selectedAsset
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
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
                          <SelectItem value="Vehicle">Veículo</SelectItem>
                          <SelectItem value="Machinery">Maquinário</SelectItem>
                          <SelectItem value="Equipment">Equipamento</SelectItem>
                          <SelectItem value="Other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Bem</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="acquisitionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Aquisição</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="originalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Original</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residualValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Residual</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="depreciationRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Depreciação (% a.a.)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
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
                          <SelectItem value="Active">Ativo</SelectItem>
                          <SelectItem value="Sold">Vendido</SelectItem>
                          <SelectItem value="WrittenOff">Baixado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={isMaintDialogOpen} onOpenChange={setIsMaintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Manutenção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descrição do Serviço
              </label>
              <Input
                value={maintForm.watch('description')}
                onChange={(e) =>
                  maintForm.setValue('description', e.target.value)
                }
                placeholder="Ex: Troca de óleo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={maintForm.watch('date')}
                  onChange={(e) => maintForm.setValue('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Custo Total</label>
                <Input
                  type="number"
                  step="0.01"
                  value={maintForm.watch('value')}
                  onChange={(e) =>
                    maintForm.setValue('value', Number(e.target.value))
                  }
                />
              </div>
            </div>
            <Button
              onClick={maintForm.handleSubmit(onMaintSubmit)}
              className="w-full"
            >
              Lançar Despesa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!assetToDelete}
        onOpenChange={() => setAssetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ativo?</AlertDialogTitle>
            <AlertDialogDescription>Ação irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
