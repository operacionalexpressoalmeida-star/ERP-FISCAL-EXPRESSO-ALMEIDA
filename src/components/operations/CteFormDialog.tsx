import { useForm, useWatch } from 'react-hook-form'
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
import { Transaction, PendencyLog } from '@/stores/useErpStore'
import { useEffect, useState, useMemo } from 'react'
import { useErpStore } from '@/stores/useErpStore'
import { Separator } from '@/components/ui/separator'
import { calculateCteTaxes, validateCte } from '@/lib/tax-utils'
import { AlertTriangle, Calculator, Truck, History } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CteProfitabilityTab } from '@/components/operations/CteProfitabilityTab'
import { ScrollArea } from '@/components/ui/scroll-area'

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
  freightId: z.string().optional(),
  cteType: z.enum(['Normal', 'Complementary', 'Substitution']).optional(),
  originalCteKey: z.string().optional(),
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
  const {
    companies,
    selectedCompanyId,
    transactions,
    validationSettings,
    conditionalRules,
    updateTransaction,
    currentUser,
  } = useErpStore()
  const [activeTab, setActiveTab] = useState('details')

  // Linked Expenses
  const linkedExpenses = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.type === 'expense' && t.relatedTransactionId === initialData?.id,
      ),
    [transactions, initialData?.id],
  )

  const totalLinkedExpenses = useMemo(
    () => linkedExpenses.reduce((acc, t) => acc + t.value, 0),
    [linkedExpenses],
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
      freightId: '',
      cteType: 'Normal',
      originalCteKey: '',
    },
  })

  // Effect to reset form when dialog opens or data changes
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
          freightId: initialData.freightId || '',
          cteType: initialData.cteType || 'Normal',
          originalCteKey: initialData.originalCteKey || '',
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
          freightId: '',
          cteType: 'Normal',
          originalCteKey: '',
        })
      }
    }
  }, [open, initialData, form, selectedCompanyId])

  // Watch values for validation and tax calculation
  const valuesForValidation = useWatch({ control: form.control })

  // Validate with settings
  const validation = validateCte(
    valuesForValidation,
    validationSettings,
    conditionalRules,
  )

  const origin = useWatch({ control: form.control, name: 'origin' })
  const destination = useWatch({ control: form.control, name: 'destination' })
  const value = useWatch({ control: form.control, name: 'value' })

  // Automatic Tax Calculation Effect
  useEffect(() => {
    if (
      value &&
      origin &&
      destination &&
      origin.length === 2 &&
      destination.length === 2
    ) {
      const taxes = calculateCteTaxes(value, origin, destination)
      const currentValues = form.getValues()
      if (
        currentValues.icmsValue !== taxes.icmsValue ||
        currentValues.pisValue !== taxes.pisValue ||
        currentValues.cofinsValue !== taxes.cofinsValue
      ) {
        form.setValue('icmsValue', taxes.icmsValue)
        form.setValue('pisValue', taxes.pisValue)
        form.setValue('cofinsValue', taxes.cofinsValue)
      }
    }
  }, [value, origin, destination, form])

  const handleManualCalc = () => {
    const current = form.getValues()
    const taxes = calculateCteTaxes(
      current.value,
      current.origin,
      current.destination,
    )
    form.setValue('icmsValue', taxes.icmsValue)
    form.setValue('pisValue', taxes.pisValue)
    form.setValue('cofinsValue', taxes.cofinsValue)
  }

  const handleSubmit = (values: CteFormData) => {
    if (initialData) {
      // Create Audit Log
      const changes: string[] = []
      ;(Object.keys(values) as Array<keyof CteFormData>).forEach((key) => {
        const newVal = values[key]
        const oldVal =
          initialData[key as keyof Transaction] ||
          (key === 'cteType' ? 'Normal' : '')
        if (String(newVal) !== String(oldVal)) {
          changes.push(`${key}: ${oldVal} -> ${newVal}`)
        }
      })

      if (changes.length > 0) {
        const newLog: PendencyLog = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          user: currentUser?.name || 'Unknown',
          action: 'Update',
          details: changes.join('; '),
        }
        const updatedHistory = [...(initialData.pendencyHistory || []), newLog]
        // This is a bit of a hack since onSave usually calls updateTransaction which overwrites data
        // We need to ensure the history is merged.
        // Assuming onSave handles the final object merge in CTeList or we update it here directly if needed
        // But onSave is designed for form data.
        // Let's modify the values passed to onSave to include the new history if we can,
        // but CteFormData is strict.
        // Instead, let's call updateTransaction directly for history if possible or rely on parent.
        // Since onSave is used in CTeList to call updateTransaction, we can't easily inject history there without changing CteFormData.
        // So we will call updateTransaction directly here for the log if it exists.
        updateTransaction(initialData.id, { pendencyHistory: updatedHistory })
      }
    }

    onSave(values)
    onOpenChange(false)
  }

  // Net Revenue Calculation
  const icmsValue = useWatch({ control: form.control, name: 'icmsValue' }) || 0
  const pisValue = useWatch({ control: form.control, name: 'pisValue' }) || 0
  const cofinsValue =
    useWatch({ control: form.control, name: 'cofinsValue' }) || 0

  const totalTaxes = icmsValue + pisValue + cofinsValue
  const netRevenue = (value || 0) - totalTaxes - totalLinkedExpenses

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar CT-e' : 'Nova Emissão Manual'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Dados do CT-e</TabsTrigger>
            <TabsTrigger value="profitability" disabled={!initialData}>
              Rentabilidade
            </TabsTrigger>
            <TabsTrigger value="history" disabled={!initialData}>
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 pt-4"
              >
                {/* Validation Alerts */}
                {(validation.warnings.length > 0 ||
                  validation.errors.length > 0) && (
                  <Alert
                    variant={
                      validation.errors.length > 0 ? 'destructive' : 'default'
                    }
                    className={
                      validation.errors.length > 0
                        ? ''
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                      {validation.errors.length > 0
                        ? 'Erros Bloqueantes'
                        : 'Avisos de Validação'}
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 text-xs">
                        {[...validation.errors, ...validation.warnings].map(
                          (w, i) => (
                            <li key={i}>{w}</li>
                          ),
                        )}
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <FormField
                      control={form.control}
                      name="cteType"
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
                              <SelectItem value="Normal">Normal</SelectItem>
                              <SelectItem value="Complementary">
                                Complementar
                              </SelectItem>
                              <SelectItem value="Substitution">
                                Substituição
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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

                {form.watch('cteType') !== 'Normal' && (
                  <FormField
                    control={form.control}
                    name="originalCteKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave do CT-e Original</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Chave referenciada" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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

                {/* Freight & CFOP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="freightId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Truck className="h-3 w-3 text-muted-foreground" /> ID
                          da Carga (Opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: REF-123 (Vínculo Logístico)"
                          />
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
                      onClick={handleManualCalc}
                    >
                      <Calculator className="mr-2 h-3 w-3" /> Recalcular
                      Manualmente
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total do Serviço</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              className="text-lg font-bold"
                            />
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
                  <Button
                    type="submit"
                    disabled={
                      validation.errors.length > 0 &&
                      (validationSettings.blockInvalidCfop ||
                        validationSettings.blockInvalidStates)
                    }
                  >
                    Salvar CT-e
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="profitability">
            <CteProfitabilityTab
              netRevenue={netRevenue}
              totalLinkedExpenses={totalLinkedExpenses}
              linkedExpenses={linkedExpenses}
            />
          </TabsContent>

          <TabsContent value="history">
            <div className="pt-4">
              <ScrollArea className="h-[400px] border rounded-md p-4">
                {initialData?.pendencyHistory &&
                initialData.pendencyHistory.length > 0 ? (
                  <div className="space-y-4">
                    {initialData.pendencyHistory.map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-col gap-1 border-b pb-3 last:border-0"
                      >
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {log.user}
                          </span>
                          <span>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">
                            {log.action}
                          </span>
                          : {log.details}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <History className="h-8 w-8 opacity-20" />
                    <p>Nenhum histórico registrado.</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
