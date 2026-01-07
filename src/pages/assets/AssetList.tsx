import { useErpStore, Asset } from '@/stores/useErpStore'
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
import {
  Plus,
  Pencil,
  Trash2,
  PenTool,
  AlertTriangle,
  FileText,
  Calculator,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
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
import { Badge } from '@/components/ui/badge'
import { differenceInMonths } from 'date-fns'

const assetSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  name: z.string().min(3),
  plate: z.string().optional(),
  category: z.enum(['Vehicle', 'Machinery', 'Equipment', 'Other']),
  acquisitionDate: z.string(),
  originalValue: z.coerce.number().min(0.01),
  residualValue: z.coerce.number().min(0),
  usefulLife: z.coerce.number().min(1, 'Vida útil deve ser maior que 0'),
  status: z.enum([
    'Active',
    'Sold',
    'WrittenOff',
    'In Maintenance',
    'Doc Pending',
  ]),
  licensingExpiryDate: z.string().optional(),
  insuranceExpiryDate: z.string().optional(),
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
    checkCertificatesExpiry,
  } = useErpStore()

  const assets = getFilteredAssets()
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(assets.length / ITEMS_PER_PAGE)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMaintDialogOpen, setIsMaintDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)

  // Run expiry check on mount
  useEffect(() => {
    checkCertificatesExpiry()
  }, [checkCertificatesExpiry])

  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      acquisitionDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      category: 'Vehicle',
      usefulLife: 60,
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
      form.reset({
        ...selectedAsset,
        plate: selectedAsset.plate || '',
        licensingExpiryDate: selectedAsset.licensingExpiryDate || '',
        insuranceExpiryDate: selectedAsset.insuranceExpiryDate || '',
      })
    } else if (!isMaintDialogOpen) {
      form.reset({
        companyId:
          selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
        name: '',
        plate: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        originalValue: 0,
        residualValue: 0,
        usefulLife: 60,
        status: 'Active',
        category: 'Vehicle',
        licensingExpiryDate: '',
        insuranceExpiryDate: '',
      })
    }
  }, [selectedAsset, form, selectedCompanyId, isMaintDialogOpen])

  function calculateAssetFinancials(asset: Asset) {
    const today = new Date()
    const acquisition = new Date(asset.acquisitionDate)
    const monthsElapsed = Math.max(0, differenceInMonths(today, acquisition))

    const depreciableAmount = Math.max(
      0,
      asset.originalValue - asset.residualValue,
    )
    const monthlyDepreciation =
      asset.usefulLife > 0 ? depreciableAmount / asset.usefulLife : 0

    // Calculate Accumulated Depreciation (capped at depreciable amount)
    const accumulatedDepreciation = Math.min(
      monthlyDepreciation * monthsElapsed,
      depreciableAmount,
    )

    const netBookValue = asset.originalValue - accumulatedDepreciation
    const isFullyDepreciated =
      accumulatedDepreciation >= depreciableAmount && depreciableAmount > 0

    return {
      monthlyDepreciation,
      accumulatedDepreciation,
      netBookValue,
      isFullyDepreciated,
      monthsElapsed,
    }
  }

  // Dashboard Aggregations
  const dashboardStats = assets.reduce(
    (stats, asset) => {
      const financials = calculateAssetFinancials(asset)

      stats.totalOriginalValue += asset.originalValue
      stats.totalNetBookValue += financials.netBookValue
      stats.totalAccumulatedDepreciation += financials.accumulatedDepreciation

      if (asset.status === 'Active') {
        stats.currentPeriodDepreciation += financials.monthlyDepreciation
      }

      return stats
    },
    {
      totalOriginalValue: 0,
      totalNetBookValue: 0,
      totalAccumulatedDepreciation: 0,
      currentPeriodDepreciation: 0,
    },
  )

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
        status: 'approved',
        icmsValue: 0,
        pisValue: 0,
        cofinsValue: 0,
      })
      toast({
        title: 'Manutenção Registrada',
        description: 'Despesa criada e histórico atualizado.',
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

  const getStatusBadge = (asset: Asset) => {
    const financials = calculateAssetFinancials(asset)

    if (financials.isFullyDepreciated) {
      return (
        <Badge
          variant="secondary"
          className="bg-gray-200 text-gray-800 border-gray-300"
        >
          Depreciado
        </Badge>
      )
    }

    switch (asset.status) {
      case 'Active':
        return <Badge className="bg-emerald-600">Ativo</Badge>
      case 'In Maintenance':
        return <Badge className="bg-amber-600">Em Manutenção</Badge>
      case 'Doc Pending':
        return <Badge className="bg-rose-600">Doc. Pendente</Badge>
      case 'Sold':
        return <Badge variant="secondary">Vendido</Badge>
      case 'WrittenOff':
        return <Badge variant="destructive">Baixado</Badge>
      default:
        return <Badge variant="outline">{asset.status}</Badge>
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
            Gestão de Ativos Imobilizados
          </h1>
          <p className="text-muted-foreground">
            Controle contábil, depreciação automática e gestão de frota.
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
            <CardTitle className="text-sm">Valor de Aquisição Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardStats.totalOriginalValue)}
            </div>
            <p className="text-xs text-muted-foreground">Custo Histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Depreciação Acumulada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(dashboardStats.totalAccumulatedDepreciation)}
            </div>
            <p className="text-xs text-muted-foreground">Total Depreciado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Valor Contábil Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(dashboardStats.totalNetBookValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor Atual da Frota
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Depreciação do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(dashboardStats.currentPeriodDepreciation)}
            </div>
            <p className="text-xs text-muted-foreground">
              Impacto no Resultado
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Bens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bem / Placa</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Aquisição</TableHead>
                <TableHead>Vida Útil</TableHead>
                <TableHead className="text-right">Valor Original</TableHead>
                <TableHead className="text-right">Dep. Acumulada</TableHead>
                <TableHead className="text-right">Valor Líquido</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {userRole === 'admin' && <TableHead className="w-[120px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((asset) => {
                const financials = calculateAssetFinancials(asset)
                const isOverdue =
                  asset.nextMaintenanceDate &&
                  new Date(asset.nextMaintenanceDate) < new Date()

                return (
                  <TableRow
                    key={asset.id}
                    className={
                      financials.isFullyDepreciated ? 'bg-muted/10' : ''
                    }
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{asset.name}</span>
                        {asset.plate && (
                          <span className="text-xs text-muted-foreground font-mono bg-muted px-1 rounded w-fit">
                            {asset.plate}
                          </span>
                        )}
                        {isOverdue && (
                          <div className="flex items-center gap-1 text-[10px] text-rose-600 font-bold mt-1">
                            <AlertTriangle className="h-3 w-3" /> Manutenção
                            Vencida
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>
                      {new Date(asset.acquisitionDate).toLocaleDateString(
                        'pt-BR',
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {financials.monthsElapsed} / {asset.usefulLife} meses
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(asset.originalValue)}
                    </TableCell>
                    <TableCell className="text-right text-rose-600 text-xs">
                      {formatCurrency(financials.accumulatedDepreciation)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-700">
                      {formatCurrency(financials.netBookValue)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(asset)}
                    </TableCell>
                    {userRole === 'admin' && (
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Lançar Manutenção"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
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
                </div>
                <FormField
                  control={form.control}
                  name="plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa / Identificador</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC1234" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-muted/30 p-4 rounded-md border space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" /> Dados Contábeis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <FormLabel>Valor de Aquisição</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="usefulLife"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vida Útil (Meses)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-md border space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Controle de Documentação
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="licensingExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimento Licenciamento/IPVA</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="insuranceExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimento Seguro</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Operacional</FormLabel>
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
                        <SelectItem value="In Maintenance">
                          Em Manutenção
                        </SelectItem>
                        <SelectItem value="Doc Pending">
                          Doc. Pendente
                        </SelectItem>
                        <SelectItem value="Sold">Vendido</SelectItem>
                        <SelectItem value="WrittenOff">Baixado</SelectItem>
                      </SelectContent>
                    </Select>
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
