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
import {
  RefreshCw,
  Save,
  Server,
  Globe,
  Receipt,
  Truck,
  ShieldCheck,
  FileCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Link,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function IntegrationCenter() {
  const {
    apiConfigs,
    updateApiConfig,
    certificates,
    addCertificate,
    removeCertificate,
    integrationLogs,
    addIntegrationLog,
  } = useErpStore()

  // Helper to init config state
  const getConfig = (
    id: string,
    defaultName: string,
    type: ApiConfig['type'] = 'tracking',
  ) => {
    return (
      apiConfigs.find((c) => c.id === id) || {
        id,
        serviceName: defaultName,
        endpoint: '',
        apiKey: '',
        isActive: false,
        type,
      }
    )
  }

  const [omnilink, setOmnilink] = useState<ApiConfig>(
    getConfig('api_omni', 'Omnilink Rastreamento'),
  )
  const [sascar, setSascar] = useState<ApiConfig>(
    getConfig('api_sascar', 'Sascar Fleet'),
  )
  const [sefaz, setSefaz] = useState<ApiConfig>(
    getConfig('api_sefaz', 'SEFAZ Nacional (NFS-e)', 'fiscal'),
  )
  const [ciot, setCiot] = useState<ApiConfig>(
    getConfig('api_ciot', 'Integração CIOT', 'payment'),
  )

  // Certificate State
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certPassword, setCertPassword] = useState('')

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

    // Simulate process
    setTimeout(() => {
      const success = Math.random() > 0.2
      updateApiConfig({ ...config, lastSync: new Date().toISOString() })

      addIntegrationLog({
        type:
          config.type === 'fiscal'
            ? 'SEFAZ'
            : config.type === 'payment'
              ? 'CIOT'
              : 'TRACKING',
        action: 'Sincronização Manual',
        status: success ? 'success' : 'error',
        message: success
          ? 'Dados atualizados com sucesso.'
          : 'Falha na conexão com o servidor.',
        timestamp: new Date().toISOString(),
      })

      if (success) {
        toast({
          title: 'Sucesso',
          description: 'Dados atualizados com sucesso.',
        })
      } else {
        toast({
          title: 'Erro de Conexão',
          description: 'Não foi possível comunicar com o servidor remoto.',
          variant: 'destructive',
        })
      }
    }, 2000)
  }

  // SEFAZ Actions
  const handleIssueNfse = () => {
    if (!sefaz.isActive) {
      toast({
        title: 'Integração Inativa',
        description: 'Ative a integração SEFAZ primeiro.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Emitindo NFS-e...',
      description: 'Enviando XML para a Prefeitura.',
    })
    setTimeout(() => {
      addIntegrationLog({
        type: 'SEFAZ',
        action: 'Emissão NFS-e',
        status: 'success',
        message:
          'NFS-e 4502 autorizada com sucesso. Protocolo: 135240001234567',
        timestamp: new Date().toISOString(),
      })
      toast({
        title: 'NFS-e Autorizada',
        description: 'Nota fiscal emitida com sucesso.',
      })
    }, 1500)
  }

  // CIOT Actions
  const handleGenerateCiot = () => {
    if (!ciot.isActive) {
      toast({
        title: 'Integração Inativa',
        description: 'Ative a integração CIOT primeiro.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Gerando CIOT...',
      description: 'Comunicando com provedor de pagamento.',
    })
    setTimeout(() => {
      addIntegrationLog({
        type: 'CIOT',
        action: 'Geração CIOT',
        status: 'success',
        message: 'CIOT 123456789012 gerado e vinculado ao motorista.',
        timestamp: new Date().toISOString(),
      })
      toast({
        title: 'CIOT Gerado',
        description: 'Código de operação de transporte criado.',
      })
    }, 1500)
  }

  // Certificate Actions
  const handleUploadCert = () => {
    if (!certFile || !certPassword) {
      toast({
        title: 'Dados Incompletos',
        description: 'Selecione o arquivo e digite a senha.',
        variant: 'destructive',
      })
      return
    }

    addCertificate({
      name: certFile.name.replace('.pfx', '').replace('.p12', '').toUpperCase(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // Mock 1 year
      issuer: 'Certisign (Mock)',
      status: 'valid',
    })

    toast({
      title: 'Certificado Importado',
      description: 'Arquivo digital processado com segurança.',
    })
    setCertFile(null)
    setCertPassword('')
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Central de Integrações
        </h1>
        <p className="text-muted-foreground">
          Conecte plataformas externas para rastreamento, fiscal e pagamentos.
        </p>
      </div>

      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-[800px]">
          <TabsTrigger value="tracking">Rastreamento</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal (SEFAZ)</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="certs">Certificados</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  Importação automática de posicionamento.
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={omnilink.apiKey}
                    onChange={(e) =>
                      setOmnilink({ ...omnilink, apiKey: e.target.value })
                    }
                    placeholder="****************"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleSync(omnilink)}
                  disabled={!omnilink.isActive}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar
                </Button>
                <Button onClick={() => handleSave(omnilink)}>
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-green-500" />
                    <CardTitle>Sascar Fleet</CardTitle>
                  </div>
                  <Switch
                    checked={sascar.isActive}
                    onCheckedChange={(c) =>
                      setSascar({ ...sascar, isActive: c })
                    }
                  />
                </div>
                <CardDescription>
                  Telemetria e jornada de motorista.
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
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleSync(sascar)}
                  disabled={!sascar.isActive}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar
                </Button>
                <Button onClick={() => handleSave(sascar)}>
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fiscal" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-amber-500" />
                    <CardTitle>Configuração SEFAZ (NFS-e)</CardTitle>
                  </div>
                  <Switch
                    checked={sefaz.isActive}
                    onCheckedChange={(c) => setSefaz({ ...sefaz, isActive: c })}
                  />
                </div>
                <CardDescription>
                  Emissão de Notas Fiscais de Serviço e comunicação com a
                  prefeitura.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={sefaz.environment || 'homologation'}
                      onValueChange={(v: any) =>
                        setSefaz({ ...sefaz, environment: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologation">
                          Homologação (Teste)
                        </SelectItem>
                        <SelectItem value="production">
                          Produção (Oficial)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Certificado Digital</Label>
                    <Select
                      value={sefaz.certificateId}
                      onValueChange={(v) =>
                        setSefaz({ ...sefaz, certificateId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {certificates.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Webservice URL</Label>
                  <Input
                    value={sefaz.endpoint}
                    onChange={(e) =>
                      setSefaz({ ...sefaz, endpoint: e.target.value })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={() => handleSave(sefaz)}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Configuração
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações de Teste</CardTitle>
                <CardDescription>Diagnóstico e emissão manual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSync(sefaz)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Verificar Status
                  Serviço
                </Button>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={handleIssueNfse}
                >
                  <FileCheck className="mr-2 h-4 w-4" /> Simular Emissão NFS-e
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center w-full">
                  Use o ambiente de homologação para testes seguros.
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-indigo-500" />
                    <CardTitle>Integração CIOT</CardTitle>
                  </div>
                  <Switch
                    checked={ciot.isActive}
                    onCheckedChange={(c) => setCiot({ ...ciot, isActive: c })}
                  />
                </div>
                <CardDescription>
                  Geração de códigos CIOT e pagamento de motoristas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provedor Homologado</Label>
                    <Select
                      value={ciot.provider || 'e-Frete'}
                      onValueChange={(v) => setCiot({ ...ciot, provider: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="e-Frete">e-Frete</SelectItem>
                        <SelectItem value="Repom">Repom</SelectItem>
                        <SelectItem value="Pamcard">
                          Pamcard (Roadcard)
                        </SelectItem>
                        <SelectItem value="NDD">NDD Cargo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Endpoint API</Label>
                    <Input
                      value={ciot.endpoint}
                      onChange={(e) =>
                        setCiot({ ...ciot, endpoint: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Token de Integração</Label>
                  <Input
                    type="password"
                    value={ciot.apiKey}
                    onChange={(e) =>
                      setCiot({ ...ciot, apiKey: e.target.value })
                    }
                    placeholder="Token do Provedor"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={() => handleSave(ciot)}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Configuração
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operações</CardTitle>
                <CardDescription>
                  Gestão de pagamentos e viagens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSync(ciot)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Pagamentos
                </Button>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleGenerateCiot}
                >
                  <Link className="mr-2 h-4 w-4" /> Gerar CIOT (Mock)
                </Button>
              </CardContent>
              <CardFooter>
                <div className="bg-muted p-3 rounded text-xs text-muted-foreground w-full">
                  <p className="font-semibold mb-1">Status Provedor:</p>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Operacional
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Importar Certificado A1</CardTitle>
                <CardDescription>
                  Carregue seu certificado digital (.pfx ou .p12) para
                  autenticação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 bg-muted/20">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Arraste ou clique para selecionar
                  </p>
                  <Input
                    type="file"
                    accept=".pfx,.p12"
                    className="max-w-xs"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha do Certificado</Label>
                  <Input
                    type="password"
                    placeholder="Digite a senha..."
                    value={certPassword}
                    onChange={(e) => setCertPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleUploadCert}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Instalar Certificado
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certificados Instalados</CardTitle>
                <CardDescription>
                  Gerencie as credenciais ativas no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-sm">
                            {cert.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Emissor: {cert.issuer}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Validade:
                          </span>
                          <span
                            className={
                              new Date(cert.expiryDate) < new Date()
                                ? 'text-rose-600 font-bold'
                                : 'text-emerald-600 font-medium'
                            }
                          >
                            {new Date(cert.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCertificate(cert.id)}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {certificates.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Nenhum certificado instalado.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Integração</CardTitle>
              <CardDescription>
                Histórico de transmissões e respostas dos servidores externos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrationLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.type}</Badge>
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === 'success'
                              ? 'default'
                              : log.status === 'error'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className={
                            log.status === 'success' ? 'bg-emerald-600' : ''
                          }
                        >
                          {log.status === 'success'
                            ? 'Sucesso'
                            : log.status === 'error'
                              ? 'Erro'
                              : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="max-w-[300px] truncate text-xs text-muted-foreground"
                        title={log.message}
                      >
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                  {integrationLogs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
