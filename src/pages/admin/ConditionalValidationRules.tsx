import { useErpStore, ConditionalRule } from '@/stores/useErpStore'
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
  name: z.string().min(3, 'Nome muito curto'),
  conditionField: z.string().min(1, 'Campo obrigatório'),
  conditionOperator: z.enum(['equals', 'not_equals', 'contains']),
  conditionValue: z.string().min(1, 'Valor obrigatório'),
  targetField: z.string().min(1, 'Campo alvo obrigatório'),
  ruleType: z.enum(['mandatory', 'match_value']),
  ruleValue: z.string().optional(),
  errorMessage: z.string().min(5, 'Mensagem de erro obrigatória'),
})

export default function ConditionalValidationRules() {
  const {
    conditionalRules,
    addConditionalRule,
    removeConditionalRule,
    updateConditionalRule,
  } = useErpStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ConditionalRule | null>(null)

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      conditionField: 'cteType',
      conditionOperator: 'equals',
      conditionValue: '',
      targetField: 'originalCteKey',
      ruleType: 'mandatory',
      ruleValue: '',
      errorMessage: '',
    },
  })

  useState(() => {
    if (selectedRule) {
      form.reset(selectedRule)
    }
  })

  const openNewDialog = () => {
    setSelectedRule(null)
    form.reset({
      name: '',
      conditionField: 'cteType',
      conditionOperator: 'equals',
      conditionValue: '',
      targetField: 'originalCteKey',
      ruleType: 'mandatory',
      ruleValue: '',
      errorMessage: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (rule: ConditionalRule) => {
    setSelectedRule(rule)
    form.reset(rule)
    setIsDialogOpen(true)
  }

  function onSubmit(values: z.infer<typeof ruleSchema>) {
    if (selectedRule) {
      updateConditionalRule(selectedRule.id, values)
      toast({ title: 'Regra Condicional Atualizada' })
    } else {
      addConditionalRule(values)
      toast({ title: 'Regra Condicional Criada' })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    removeConditionalRule(id)
    toast({ title: 'Regra Removida', variant: 'destructive' })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Validações Condicionais
          </h1>
          <p className="text-muted-foreground">
            Crie regras de validação baseadas em lógica "Se... Então...".
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
            Regras aplicadas durante a validação de CT-es.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Validação</TableHead>
                <TableHead>Mensagem de Erro</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conditionalRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    Se {rule.conditionField}{' '}
                    {rule.conditionOperator === 'equals'
                      ? '='
                      : rule.conditionOperator}{' '}
                    "{rule.conditionValue}"
                  </TableCell>
                  <TableCell>
                    Então {rule.targetField} é{' '}
                    {rule.ruleType === 'mandatory'
                      ? 'Obrigatório'
                      : `Igual a "${rule.ruleValue}"`}
                  </TableCell>
                  <TableCell className="text-muted-foreground italic text-xs">
                    {rule.errorMessage}
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
              {conditionalRules.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhuma regra condicional definida.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Editar Regra' : 'Nova Regra Condicional'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Regra</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Validação de CT-e de Substituição"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4 border p-4 rounded-md bg-muted/10">
                <div className="col-span-3 font-semibold text-sm">
                  SE (Condição)
                </div>
                <FormField
                  control={form.control}
                  name="conditionField"
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
                          <SelectItem value="cteType">Tipo do CT-e</SelectItem>
                          <SelectItem value="value">Valor</SelectItem>
                          <SelectItem value="cfop">CFOP</SelectItem>
                          <SelectItem value="origin">Origem</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conditionOperator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operador</FormLabel>
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
                          <SelectItem value="not_equals">
                            Diferente de
                          </SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conditionValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Substitution" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 border p-4 rounded-md bg-muted/10">
                <div className="col-span-3 font-semibold text-sm">
                  ENTÃO (Validação)
                </div>
                <FormField
                  control={form.control}
                  name="targetField"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campo Alvo</FormLabel>
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
                          <SelectItem value="originalCteKey">
                            Chave Original
                          </SelectItem>
                          <SelectItem value="freightId">ID de Frete</SelectItem>
                          <SelectItem value="takerCnpj">
                            CNPJ Tomador
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ruleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regra</FormLabel>
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
                          <SelectItem value="mandatory">
                            É Obrigatório
                          </SelectItem>
                          <SelectItem value="match_value">
                            Deve ser Igual a
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ruleValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Valor esperado"
                          disabled={form.watch('ruleType') === 'mandatory'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="errorMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem de Erro Personalizada</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: CT-e de Substituição exige Chave Original"
                      />
                    </FormControl>
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
