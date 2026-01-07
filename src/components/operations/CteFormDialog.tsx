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
import { useEffect } from 'react'
import { useErpStore } from '@/stores/useErpStore'
import { Separator } from '@/components/ui/separator'

const cteSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  date: z.string(),
  cteNumber: z.string().min(1, 'Número obrigatório'),
  accessKey: z.string().optional(),
  origin: z.string().min(2, 'Origem obrigatória'),
  destination: z.string().min(2, 'Destino obrigatório'),
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
  const { companies, selectedCompanyId } = useErpStore()

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

  const handleSubmit = (values: CteFormData) => {
    onSave(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar CT-e' : 'Nova Emissão Manual'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
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
                      <Input {...field} placeholder="Ex: SP" maxLength={2} />
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
                      <Input {...field} placeholder="Ex: RJ" maxLength={2} />
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
              <h4 className="text-sm font-medium leading-none">
                Valores e Tributos
              </h4>
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
      </DialogContent>
    </Dialog>
  )
}
