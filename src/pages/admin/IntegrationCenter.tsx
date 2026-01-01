import { useErpStore, ApiConfig } from '@/stores/useErpStore'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RefreshCw, Save, Server, Globe } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

export default function IntegrationCenter() {
  const { apiConfigs, updateApiConfig } = useErpStore()

  // Helper to init config state
  const getConfig = (id: string, defaultName: string) => {
    return (
      apiConfigs.find((c) => c.id === id) || {
        id,
        serviceName: defaultName,
        endpoint: '',
        apiKey: '',
        isActive: false,
      }
    )
  }

  const [omnilink, setOmnilink] = useState<ApiConfig>(
    getConfig('api_omni', 'Omnilink Rastreamento'),
  )
  const [sascar, setSascar] = useState<ApiConfig>(
    getConfig('api_sascar', 'Sascar Fleet'),
  )

  const handleSave = (config: ApiConfig) => {
    updateApiConfig(config)
    toast({
      title: 'Configuração Salva',
      description: `Integração com ${config.serviceName} atualizada.`,
    })
  }

  const handleSync = (config: ApiConfig) => {
    toast({
      title: 'Sincronização Iniciada',
      description: `Buscando dados de ${config.serviceName}...`,
    })
    // Mock async process
    setTimeout(() => {
      updateApiConfig({ ...config, lastSync: new Date().toISOString() })
      toast({
        title: 'Sucesso',
        description: 'Dados atualizados com sucesso.',
      })
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Central de Integrações
        </h1>
        <p className="text-muted-foreground">
          Conecte plataformas externas de rastreamento e gestão de frota.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Omnilink Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <CardTitle>Omnilink Rastreamento</CardTitle>
              </div>
              <Switch
                checked={omnilink.isActive}
                onCheckedChange={(c) =>
                  setOmnilink({ ...omnilink, isActive: c })
                }
              />
            </div>
            <CardDescription>
              Importação automática de posicionamento e status de veículos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Endpoint API</Label>
              <Input
                value={omnilink.endpoint}
                onChange={(e) =>
                  setOmnilink({ ...omnilink, endpoint: e.target.value })
                }
                placeholder="https://api.omnilink.com.br/v1"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key / Token</Label>
              <Input
                type="password"
                value={omnilink.apiKey}
                onChange={(e) =>
                  setOmnilink({ ...omnilink, apiKey: e.target.value })
                }
                placeholder="****************"
              />
            </div>
            {omnilink.lastSync && (
              <p className="text-xs text-muted-foreground">
                Última sincronização:{' '}
                {new Date(omnilink.lastSync).toLocaleString()}
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={() => handleSync(omnilink)}
              disabled={!omnilink.isActive}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Agora
            </Button>
            <Button onClick={() => handleSave(omnilink)}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </CardFooter>
        </Card>

        {/* Sascar Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-500" />
                <CardTitle>Sascar Fleet</CardTitle>
              </div>
              <Switch
                checked={sascar.isActive}
                onCheckedChange={(c) => setSascar({ ...sascar, isActive: c })}
              />
            </div>
            <CardDescription>
              Monitoramento de telemetria e jornada de motorista.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Endpoint API</Label>
              <Input
                value={sascar.endpoint}
                onChange={(e) =>
                  setSascar({ ...sascar, endpoint: e.target.value })
                }
                placeholder="https://webservice.sascar.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label>Token de Acesso</Label>
              <Input
                type="password"
                value={sascar.apiKey}
                onChange={(e) =>
                  setSascar({ ...sascar, apiKey: e.target.value })
                }
                placeholder="****************"
              />
            </div>
            {sascar.lastSync && (
              <p className="text-xs text-muted-foreground">
                Última sincronização:{' '}
                {new Date(sascar.lastSync).toLocaleString()}
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={() => handleSync(sascar)}
              disabled={!sascar.isActive}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Agora
            </Button>
            <Button onClick={() => handleSave(sascar)}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
