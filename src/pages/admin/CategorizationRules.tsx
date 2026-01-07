import { useErpStore, CategorizationRule } from '@/stores/useErpStore'
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
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from '@/hooks/use-toast'

const ruleSchema = z.object({
  field: z.enum(['cfop', 'description', 'origin', 'destination']),
  operator: z.enum(['equals', 'contains', 'starts_with']),
  value: z.string().min(1, 'Valor obrigatório'),
  targetCategory: z.string().min(1, 'Categoria obrigatória'),
})

export default function CategorizationRules() {
  const {
    categorizationRules,
    addCategorizationRule,
    removeCategorizationRule,
    updateCategorizationRule,
  } = useErpStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<CategorizationRule | null>(
    null,
  )

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      field: 'cfop',
      operator: 'equals',
      value: '',
      targetCategory: '',
    },
  })

  // Pre-fill form when editing
  useState(() => {
    if (selectedRule) {
      form.reset(selectedRule)
    }
  })

  const openNewDialog = () => {
    setSelectedRule(null)
    form.reset({
      field: 'cfop',
      operator: 'equals',
      value: '',
      targetCategory: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (rule: CategorizationRule) => {
    setSelectedRule(rule)
    form.reset(rule)
    setIsDialogOpen(true)
  }

  function onSubmit(values: z.infer<typeof ruleSchema>) {
    if (selectedRule) {
      updateCategorizationRule(selectedRule.id, values)
      toast({ title: 'Regra Atualizada' })
    } else {
      addCategorizationRule(values)
      toast({ title: 'Regra Criada' })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    removeCategorizationRule(id)
    toast({ title: 'Regra Removida', variant: 'destructive' })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Regras de Categorização
          </h1>
          <p className="text-muted-foreground">
            Defina como o sistema deve classificar automaticamente os CT-es.
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nova Regra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras Ativas</CardTitle>
          <CardDescription>
            Estas regras serão aplicadas na importação de XML e criação manual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Categoria Alvo</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorizationRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="capitalize">{rule.field}</TableCell>
                  <TableCell>
                    {rule.operator === 'equals'
                      ? 'Igual a'
                      : rule.operator === 'contains'
                        ? 'Contém'
                        : 'Começa com'}
                  </TableCell>
                  <TableCell className="font-mono">{rule.value}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {rule.targetCategory}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rule.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {categorizationRules.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhuma regra definida.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Editar Regra' : 'Nova Regra'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campo</FormLabel>
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
                          <SelectItem value="cfop">CFOP</SelectItem>
                          <SelectItem value="description">Descrição</SelectItem>
                          <SelectItem value="origin">Origem (UF)</SelectItem>
                          <SelectItem value="destination">
                            Destino (UF)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição</FormLabel>
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
                          <SelectItem value="equals">Igual a</SelectItem>
                          <SelectItem value="starts_with">
                            Começa com
                          </SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Valor da Condição</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 5352" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplicar Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Transport Revenue">
                          Receita de Transporte
                        </SelectItem>
                        <SelectItem value="Sales Revenue">
                          Venda de Mercadoria
                        </SelectItem>
                        <SelectItem value="Service Revenue">
                          Prestação de Serviço
                        </SelectItem>
                        <SelectItem value="Other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Salvar Regra
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
