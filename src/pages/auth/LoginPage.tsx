import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useErpStore } from '@/stores/useErpStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Loader2, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useErpStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        toast({
          title: 'Bem-vindo ao ERP Fiscal',
          description: 'Login realizado com sucesso.',
        })
        navigate('/')
      } else {
        toast({
          title: 'Falha no Login',
          description: 'Credenciais inválidas. Tente novamente.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao tentar fazer login.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-blue-900 text-white">
              <img
                src="https://img.usecurling.com/i?q=Expresso+Almeida&shape=fill&color=white"
                alt="Logo"
                className="size-8 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                ERP Fiscal
              </span>
              <span className="text-sm font-medium text-slate-500">
                Expresso Almeida
              </span>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-center">
              Digite seu e-mail e senha para entrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a
                    href="#"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={(e) => {
                      e.preventDefault()
                      toast({
                        title: 'Recuperação de Senha',
                        description: 'Contate o administrador do sistema.',
                      })
                    }}
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <div className="text-xs text-center text-muted-foreground bg-muted p-2 rounded w-full">
              <p>Credenciais de Demonstração:</p>
              <p>Admin: admin@expressoalmeida.com / 123456</p>
              <p>Operador: operador@expressoalmeida.com / 123456</p>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          &copy; 2025 Expresso Almeida Logística. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
