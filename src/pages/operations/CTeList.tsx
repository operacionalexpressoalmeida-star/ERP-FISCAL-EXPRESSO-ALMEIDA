import { useErpStore } from '@/stores/useErpStore'
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
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

const cteSchema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  date: z.string(),
  description: z.string().min(3),
  value: z.coerce.number().min(0.01),
  cteNumber: z.string().min(1),
  origin: z.string().min(2),
  destination: z.string().min(2),
  icmsValue: z.coerce.number().min(0),
  pisValue: z.coerce.number().min(0),
  cofinsValue: z.coerce.number().min(0),
})

export default function CTeList() {
  const {
    getFilteredTransactions,
    addTransaction,
    companies,
    selectedCompanyId,
  } = useErpStore()
  const transactions = getFilteredTransactions().filter(
    (t) => t.type === 'revenue',
  )
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof cteSchema>>({
    resolver: zodResolver(cteSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      companyId: selectedCompanyId !== 'consolidated' ? selectedCompanyId : '',
      icmsValue: 0,
      pisValue: 0,
      cofinsValue: 0,
    },
  })

  function onSubmit(values: z.infer<typeof cteSchema>) {
    addTransaction({
      ...values,
      type: 'revenue',
    })
    setOpen(false)
    form.reset()
  }

  // Helper to auto-calculate taxes (mocked logic for UI convenience)
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0
    form.setValue('value', val)
    form.setValue('pisValue', parseFloat((val * 0.0165).toFixed(2)))
    form.setValue('cofinsValue', parseFloat((val * 0.076).toFixed(2)))
    form.setValue('icmsValue', parseFloat((val * 0.12).toFixed(2))) // Assuming 12% default
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestão de Receitas (CT-e)
          </h1>
          <p className="text-muted-foreground">
            Emissão e controle de Conhecimentos de Transporte.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo CT-e
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Receita de Frete</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa/Filial</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={selectedCompanyId !== 'consolidated'}
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
                    name="cteNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número CT-e</FormLabel>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Frete Carga Fracionada"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Emissão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem (UF)</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={2} />
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
                          <Input {...field} maxLength={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel>Valor Total</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={handleValueChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="icmsValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ICMS (12%)</FormLabel>
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
                        <FormLabel>PIS (1.65%)</FormLabel>
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
                        <FormLabel>COFINS (7.6%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Registrar Receita
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de CT-es</CardTitle>
          <CardDescription>
            Registros filtrados pelo contexto selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>CT-e</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Impostos (Est.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-mono">{t.cteNumber}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>
                    {t.origin} {'->'} {t.destination}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    {formatCurrency(t.value)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    ICMS: {formatCurrency(t.icmsValue)}
                    <br />
                    PIS/COF: {formatCurrency(t.pisValue + t.cofinsValue)}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
