import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCargoStore } from '@/stores/useCargoStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const formSchema = z.object({
  responsibleId: z.string({
    required_error: 'Selecione um responsável.',
  }),
  requestNumber: z.string().min(3, {
    message: 'O número da solicitação deve ter pelo menos 3 caracteres.',
  }),
  cargoValue: z.coerce.number().min(0.01, {
    message: 'O valor da carga deve ser maior que zero.',
  }),
  associatedValue: z.coerce.number().min(0.01, {
    message: 'O valor associado deve ser maior que zero.',
  }),
})

export default function CadastroCarga() {
  const { responsibles, addLoad, addResponsible } = useCargoStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      responsibleId: '',
      requestNumber: '',
      cargoValue: 0,
      associatedValue: 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    addLoad({
      requestNumber: values.requestNumber,
      cargoValue: values.cargoValue,
      associatedValue: values.associatedValue,
      responsibleId: values.responsibleId,
    })

    toast({
      title: 'Carga registrada com sucesso!',
      description: `Solicitação ${values.requestNumber} foi adicionada.`,
    })

    // Optional: Ask user if they want to add another or go back
    form.reset({
      responsibleId: values.responsibleId, // Keep responsible for convenience
      requestNumber: '',
      cargoValue: 0,
      associatedValue: 0,
    })
  }

  const handleCreateResponsible = () => {
    if (searchValue) {
      const newId = addResponsible(searchValue)
      form.setValue('responsibleId', newId)
      setOpen(false)
      toast({
        title: 'Novo responsável criado',
        description: `${searchValue} foi adicionado à lista.`,
      })
    }
  }

  return (
    <div className="flex justify-center p-6 animate-fade-in">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Cadastro de Carga</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para registrar uma nova solicitação de
            carga.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="responsibleId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Responsável</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? responsibles.find((r) => r.id === field.value)
                                  ?.name
                              : 'Selecione ou crie um responsável'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar responsável..."
                            onValueChange={setSearchValue}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">
                                  Responsável não encontrado.
                                </p>
                                <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={handleCreateResponsible}
                                  type="button"
                                >
                                  Criar "{searchValue}"
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {responsibles.map((responsible) => (
                                <CommandItem
                                  value={responsible.name}
                                  key={responsible.id}
                                  onSelect={() => {
                                    form.setValue(
                                      'responsibleId',
                                      responsible.id,
                                    )
                                    setOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      responsible.id === field.value
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {responsible.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Quem é o responsável por esta carga?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Solicitação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: REQ-2024-999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cargoValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Carga (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="associatedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Associado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Registro</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
