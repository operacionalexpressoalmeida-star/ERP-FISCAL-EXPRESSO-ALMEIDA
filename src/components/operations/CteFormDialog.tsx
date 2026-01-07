import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Transaction } from '@/stores/useErpStore'
import { useEffect, useState } from 'react'
import { useErpStore } from '@/stores/useErpStore'
import { Separator } from '@/components/ui/separator'
import {
  calculateCteTaxes,
  validateCte,
  ValidationResult,
} from '@/lib/tax-utils'
import {
  AlertCircle,
  AlertTriangle,
  Calculator,
  Link as LinkIcon,
  Plus,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

const cteSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  date: z.string(),
  cteNumber: z.string().min(1, 'Número obrigatório'),
  accessKey: z.string().optional(),
  origin: z.string().min(2, 'Origem obrigatória'),
  destination: z.string().min(2, 'Destino obrigatória'),
  value: z.coerce.number().min(0.01, 'Valor deve ser positivo'),
  takerName: z.string().optional(),
  takerCnpj: z.string().optional(),
  cfop: z.string().optional(),
  icmsValue: z.coerce.number().min(0),
  pisValue: z.coerce.number().min(0),
  cofinsValue: z.coerce.number().min(0),
  category: z.string().optional(),
})

export type CteFormData = z.infer<typeof cteSchema>

interface CteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Transaction | null
  onSave: (data: CteFormData) => void
}

export function CteFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: CteFormDialogProps) {
  const { companies, selectedCompanyId, transactions } = useErpStore()
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  })
  const [activeTab, setActiveTab] = useState('details')

  // Linked Expenses
  const linkedExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.relatedTransactionId === initialData?.id,
  )
  const totalLinkedExpenses = linkedExpenses.reduce(
    (acc, t) => acc + t.value,
    0,
  )

  const form = useForm<CteFormData>({
    resolver: zodResolver(cteSchema),
    defaultValues: {
      companyId: '',
      date: new Date().toISOString().split('T')[0],
      cteNumber: '',
      accessKey: '',
      origin: '',
      destination: '',
      value: 0,
      takerName: '',
      takerCnpj: '',
      cfop: '',
      icmsValue: 0,
      pisValue: 0,
      cofinsValue: 0,
      category: 'Transport Revenue',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          companyId: initialData.companyId,
          date: initialData.date,
          cteNumber: initialData.cteNumber || '',
          accessKey: initialData.accessKey || '',
          origin: initialData.origin || '',
          destination: initialData.destination || '',
          value: initialData.value,
          takerName: initialData.takerName || '',
          takerCnpj: initialData.takerCnpj || '',
          cfop: initialData.cfop || '',
          icmsValue: initialData.icmsValue || 0,
          pisValue: initialData.pisValue || 0,
          cofinsValue: initialData.cofinsValue || 0,
          category: initialData.category || 'Transport Revenue',
        })
      } else {
        form.reset({
          companyId:
            selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
          date: new Date().toISOString().split('T')[0],
          cteNumber: '',
          accessKey: '',
          origin: '',
          destination: '',
          value: 0,
          takerName: '',
          takerCnpj: '',
          cfop: '',
          icmsValue: 0,
          pisValue: 0,
          cofinsValue: 0,
          category: 'Transport Revenue',
        })
      }
    }
  }, [open, initialData, form, selectedCompanyId])

  // Watch for changes to validate and calc taxes
  const watchedValues = form.watch()

  useEffect(() => {
    const result = validateCte(watchedValues)
    setValidation(result)
  }, [watchedValues])

  const handleAutoCalc = () => {
    const { value, origin, destination } = form.getValues()
    const taxes = calculateCteTaxes(value, origin, destination)
    form.setValue('icmsValue', taxes.icmsValue)
    form.setValue('pisValue', taxes.pisValue)
    form.setValue('cofinsValue', taxes.cofinsValue)
  }

  const handleSubmit = (values: CteFormData) => {
    onSave(values)
    onOpenChange(false)
  }

  // Net Revenue Calculation
  const totalTaxes =
    (watchedValues.icmsValue || 0) +
    (watchedValues.pisValue || 0) +
    (watchedValues.cofinsValue || 0)
  const netRevenue =
    (watchedValues.value || 0) - totalTaxes - totalLinkedExpenses

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar CT-e' : 'Nova Emissão Manual'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Dados do CT-e</TabsTrigger>
            <TabsTrigger value="profitability" disabled={!initialData}>
              Rentabilidade e Despesas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 pt-4"
              >
                {/* Validation Alerts */}
                {validation.warnings.length > 0 && (
                  <Alert
                    variant="default"
                    className="bg-amber-50 border-amber-200 text-amber-800"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 text-xs">
                        {validation.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emitente (Empresa)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={
                            selectedCompanyId !== 'consolidated' && !initialData
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
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Emissão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cteNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número CT-e</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="accessKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave de Acesso (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="44 dígitos"
                              maxLength={44}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Route & Taker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem (UF)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: SP"
                            maxLength={2}
                            className="uppercase"
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino (UF)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: RJ"
                            maxLength={2}
                            className="uppercase"
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="takerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tomador (Cliente)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Razão Social" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="takerCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ Tomador</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00.000.000/0000-00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Values & Taxes */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium leading-none">
                      Valores e Tributos
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleAutoCalc}
                    >
                      <Calculator className="mr-2 h-3 w-3" /> Calcular Impostos
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cfop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CFOP</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: 5352" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 border rounded-md bg-muted/20">
                    <FormField
                      control={form.control}
                      name="icmsValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ICMS</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pisValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIS</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cofinsValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>COFINS</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar CT-e</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="profitability" className="space-y-4 pt-4">
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
                {/* This would open Expense Dialog pre-filled with this CT-e as parent */}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
