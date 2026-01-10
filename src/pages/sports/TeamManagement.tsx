import { useSportsStore } from '@/stores/useSportsStore'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeagueId, TeamMetrics } from '@/lib/sports-math'
import { useState } from 'react'
import { Plus, Trash2, Search, BarChart3 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

const teamSchema = z.object({
  name: z.string().min(2),
  leagueId: z.enum(['BR_A', 'BR_B', 'DE_1', 'IT_1', 'ES_1', 'FR_1']),
  attackStrengthHome: z.coerce.number().min(0.1),
  attackStrengthAway: z.coerce.number().min(0.1),
  defenseWeaknessHome: z.coerce.number().min(0.1),
  defenseWeaknessAway: z.coerce.number().min(0.1),
  avgGoalsForHome: z.coerce.number().min(0),
  avgGoalsForAway: z.coerce.number().min(0),
  avgGoalsConcededHome: z.coerce.number().min(0),
  avgGoalsConcededAway: z.coerce.number().min(0),
  recentFormString: z
    .string()
    .regex(/^[WDL]{5}$/, 'Formato inválido (ex: WWDLL)'),
})

export default function TeamManagement() {
  const { teams, deleteTeam, addTeam } = useSportsStore()
  const [leagueFilter, setLeagueFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      leagueId: 'BR_A',
      attackStrengthHome: 1.0,
      attackStrengthAway: 1.0,
      defenseWeaknessHome: 1.0,
      defenseWeaknessAway: 1.0,
      avgGoalsForHome: 1.5,
      avgGoalsForAway: 1.0,
      avgGoalsConcededHome: 1.0,
      avgGoalsConcededAway: 1.5,
      recentFormString: 'DDDDD',
    },
  })

  const filteredTeams = teams.filter((t) => {
    if (leagueFilter !== 'all' && t.leagueId !== leagueFilter) return false
    if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return false
    return true
  })

  const onSubmit = (values: z.infer<typeof teamSchema>) => {
    const newTeam: TeamMetrics = {
      id: Math.random().toString(36).substring(7),
      name: values.name,
      leagueId: values.leagueId as LeagueId,
      attackStrengthHome: values.attackStrengthHome,
      attackStrengthAway: values.attackStrengthAway,
      defenseWeaknessHome: values.defenseWeaknessHome,
      defenseWeaknessAway: values.defenseWeaknessAway,
      avgGoalsForHome: values.avgGoalsForHome,
      avgGoalsForAway: values.avgGoalsForAway,
      avgGoalsConcededHome: values.avgGoalsConcededHome,
      avgGoalsConcededAway: values.avgGoalsConcededAway,
      recentForm: values.recentFormString.split('') as ('W' | 'D' | 'L')[],
    }
    addTeam(newTeam)
    toast({ title: 'Time adicionado com sucesso' })
    setIsDialogOpen(false)
    form.reset()
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciamento de Times
          </h1>
          <p className="text-muted-foreground">Base de dados estatística.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Time
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar time..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as Ligas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ligas</SelectItem>
                <SelectItem value="BR_A">Brasileirão A</SelectItem>
                <SelectItem value="BR_B">Brasileirão B</SelectItem>
                <SelectItem value="DE_1">Bundesliga</SelectItem>
                <SelectItem value="IT_1">Serie A</SelectItem>
                <SelectItem value="ES_1">LaLiga</SelectItem>
                <SelectItem value="FR_1">Ligue 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Liga</TableHead>
                <TableHead className="text-center">
                  Força Ofensiva (C/F)
                </TableHead>
                <TableHead className="text-center">Defesa (C/F)</TableHead>
                <TableHead className="text-center">Forma Recente</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{team.leagueId}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2 text-xs">
                      <span className="text-emerald-600 font-bold" title="Casa">
                        {team.attackStrengthHome.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-blue-600 font-bold" title="Fora">
                        {team.attackStrengthAway.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2 text-xs">
                      <span className="text-emerald-600 font-bold" title="Casa">
                        {team.defenseWeaknessHome.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-blue-600 font-bold" title="Fora">
                        {team.defenseWeaknessAway.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      {team.recentForm.map((r, i) => (
                        <div
                          key={i}
                          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold text-white 
                            ${r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-gray-400' : 'bg-red-500'}`}
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Time</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Clube</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leagueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Liga</FormLabel>
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
                          <SelectItem value="BR_A">Brasileirão A</SelectItem>
                          <SelectItem value="BR_B">Brasileirão B</SelectItem>
                          <SelectItem value="DE_1">Bundesliga</SelectItem>
                          <SelectItem value="IT_1">Serie A</SelectItem>
                          <SelectItem value="ES_1">LaLiga</SelectItem>
                          <SelectItem value="FR_1">Ligue 1</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4 border p-4 rounded-md">
                <div className="col-span-4 font-semibold text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Métricas Avançadas (Relativo
                  à Média da Liga = 1.0)
                </div>
                <FormField
                  control={form.control}
                  name="attackStrengthHome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atq Casa</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attackStrengthAway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atq Fora</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defenseWeaknessHome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Def Casa</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defenseWeaknessAway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Def Fora</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4 border p-4 rounded-md">
                <div className="col-span-4 font-semibold text-sm">
                  Médias Absolutas de Gols
                </div>
                <FormField
                  control={form.control}
                  name="avgGoalsForHome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pró (C)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avgGoalsForAway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pró (F)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avgGoalsConcededHome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sofr (C)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avgGoalsConcededAway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sofr (F)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="recentFormString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Forma Recente (Últimos 5 jogos - Ex: WDLWW)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={5} className="uppercase" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Cadastrar Time
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
