import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  Loader2,
  Trash2,
  Check,
  FileUp,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  HelpCircle,
  Download,
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { parseFiscalXml, ParsedFiscalDoc } from '@/lib/xml-parser'
import { formatCurrency } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useErpStore, ImportBatchLog } from '@/stores/useErpStore'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { validateCte } from '@/lib/tax-utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface XmlImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (items: ParsedFiscalDoc[]) => void
}

type UploadStatus = 'idle' | 'processing' | 'complete' | 'error'

interface ProcessedFile {
  status: 'success' | 'partial' | 'error'
  item?: ParsedFiscalDoc
  fileName: string
  error?: string
  suggestion?: string
  missingTags?: string[]
}

export function XmlImportDialog({
  open,
  onOpenChange,
  onConfirm,
}: XmlImportDialogProps) {
  const {
    companies,
    transactions,
    validationSettings,
    conditionalRules,
    addTransactions,
  } = useErpStore()
  const [items, setItems] = useState<ParsedFiscalDoc[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [partialCount, setPartialCount] = useState(0)
  const [failureCount, setFailureCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'valid' | 'errors'>('valid')

  // New Import Settings
  const [validateSchema, setValidateSchema] = useState(true)
  const [importCategory, setImportCategory] = useState<
    'Receitas' | 'Despesas' | 'Outros'
  >('Receitas')

  // Prevent navigation during processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadStatus === 'processing') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [uploadStatus])

  const existingKeys = useMemo(
    () => new Set(transactions.map((t) => t.accessKey || t.cteNumber)),
    [transactions],
  )

  const processFiles = async (files: File[], append = false) => {
    setUploadStatus('processing')
    setTotalFiles((prev) => (append ? prev + files.length : files.length))
    if (!append) {
      setProgress(0)
      setProcessedCount(0)
      setSuccessCount(0)
      setPartialCount(0)
      setFailureCount(0)
      setProcessedFiles([])
      setItems([])
    }

    const CHUNK_SIZE = 10
    const newItems: ParsedFiscalDoc[] = []
    const newProcessed: ProcessedFile[] = []

    const processChunk = async (chunk: File[]) => {
      const results = await Promise.all(
        chunk.map(async (file): Promise<ProcessedFile> => {
          try {
            if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
              throw new Error('Formato de arquivo inválido. Apenas XML.')
            }

            const item = await parseFiscalXml(file)

            const key = item.accessKey || item.cteNumber
            if (key && key !== 'SEM NUMERO' && existingKeys.has(key)) {
              throw new Error('Documento duplicado (já registrado no sistema).')
            }

            // Apply Category Override
            if (importCategory === 'Receitas') {
              item.type = 'revenue'
            } else if (importCategory === 'Despesas') {
              item.type = 'expense'
            } else {
              item.type = 'expense'
              item.category = 'Outros'
            }

            calculateTaxesIfNeeded(item)
            validateConsistency(item)

            // Check Required Tags logic
            let isPartial = false
            const missing = item.missingTags || []
            const criticalMissing: string[] = []

            missing.forEach((tag) => {
              // @ts-expect-error
              const config = validationSettings.xmlTags[tag]
              if (config === 'mandatory') {
                criticalMissing.push(tag)
              } else {
                isPartial = true
              }
            })

            if (criticalMissing.length > 0 && validateSchema) {
              throw new Error(
                `Tags obrigatórias ausentes: ${criticalMissing.join(', ')}`,
              )
            }

            if (validateSchema) {
              const validation = validateCte(
                item,
                validationSettings,
                conditionalRules,
              )
              if (!validation.isValid) {
                throw new Error(
                  `Falha na validação de esquema: ${validation.errors.join(', ')}`,
                )
              }
            }

            if (isPartial) {
              item.importStatus = 'partial'
              item.status = 'pending' // Force pending for review
              item.consistencyWarnings = [
                ...(item.consistencyWarnings || []),
                `Dados parciais: tags ausentes (${missing.join(', ')})`,
              ]
            } else if (
              item.consistencyWarnings &&
              item.consistencyWarnings.length > 0
            ) {
              item.status = 'pending'
              item.importStatus = 'complete'
            } else {
              item.status = 'approved'
              item.importStatus = 'complete'
            }

            return {
              status: isPartial ? 'partial' : 'success',
              item,
              fileName: file.name,
              missingTags: missing,
            }
          } catch (err: any) {
            let suggestion = 'Verifique a estrutura do XML.'
            const msg = err.message || 'Erro desconhecido'

            if (msg.includes('duplicado'))
              suggestion = 'Verifique se o CT-e já não existe.'
            if (msg.includes('Tags obrigatórias'))
              suggestion =
                'Ajuste a configuração de validação para tornar essas tags opcionais.'

            return {
              status: 'error',
              fileName: file.name,
              error: msg,
              suggestion,
            }
          }
        }),
      )
      return results
    }

    let currentProcessedLocal = 0

    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
      const chunk = files.slice(i, i + CHUNK_SIZE)
      const results = await processChunk(chunk)

      results.forEach((res) => {
        newProcessed.push(res)
        if (res.status === 'success') {
          if (res.item) newItems.push(res.item)
          setSuccessCount((prev) => prev + 1)
        } else if (res.status === 'partial') {
          if (res.item) newItems.push(res.item)
          setPartialCount((prev) => prev + 1)
        } else {
          setFailureCount((prev) => prev + 1)
        }
      })

      currentProcessedLocal += chunk.length
      setProcessedCount((prev) => prev + chunk.length)

      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    setItems((prev) => [...prev, ...newItems])
    setProcessedFiles((prev) => [...prev, ...newProcessed])
    setUploadStatus('complete')

    const processingHasErrors = newProcessed.some((p) => p.status === 'error')
    if (processingHasErrors) {
      setActiveTab('errors')
    } else {
      setActiveTab('valid')
    }
  }

  useEffect(() => {
    if (totalFiles > 0) {
      setProgress(Math.round((processedCount / totalFiles) * 100))
    } else {
      setProgress(0)
    }
  }, [processedCount, totalFiles])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    if (files.length > 1000) {
      toast({
        title: 'Limite Excedido',
        description: 'Selecione no máximo 1000 arquivos por vez.',
        variant: 'destructive',
      })
      return
    }
    const append = items.length > 0 || processedFiles.length > 0
    processFiles(files, append)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (uploadStatus === 'processing') return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 1000) {
        toast({
          title: 'Limite Excedido',
          description: 'Selecione no máximo 1000 arquivos por vez.',
          variant: 'destructive',
        })
        return
      }
      const append = items.length > 0 || processedFiles.length > 0
      processFiles(files, append)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const calculateTaxesIfNeeded = (item: ParsedFiscalDoc) => {
    const val = item.value
    if (item.pisValue === 0 && item.cofinsValue === 0) {
      item.pisValue = parseFloat((val * 0.0165).toFixed(2))
      item.cofinsValue = parseFloat((val * 0.076).toFixed(2))
    }
    if (item.icmsValue === 0 && item.origin && item.destination) {
      const isInternal = item.origin === item.destination
      const rate = isInternal ? 0.18 : 0.12
      item.icmsValue = parseFloat((val * rate).toFixed(2))
    }
  }

  const validateConsistency = (item: ParsedFiscalDoc) => {
    const warnings: string[] = []
    if (item.cteNumber === 'SEM NUMERO') {
      warnings.push('Número do documento não encontrado.')
    }
    if (item.type === 'revenue' && item.providerCnpj) {
      const knownIssuer = companies.some((c) => {
        const cCnpj = c.cnpj.replace(/\D/g, '')
        const iCnpj = item.providerCnpj?.replace(/\D/g, '')
        return cCnpj === iCnpj
      })
      if (!knownIssuer) {
        warnings.push('Emitente não reconhecido na base de empresas.')
      }
    }
    const result = validateCte(item, validationSettings, conditionalRules)
    if (!validateSchema) {
      result.errors.forEach((e) => warnings.push(e))
    }
    result.warnings.forEach((w) => warnings.push(w))
    item.consistencyWarnings = warnings
  }

  const errorFiles = processedFiles.filter((p) => p.status === 'error')
  // Fix: Define hasErrors in the component scope to be used in JSX
  const hasErrors = errorFiles.length > 0

  const handleDownloadLog = () => {
    if (errorFiles.length === 0) return
    const content =
      'Arquivo;Erro;Sugestão\n' +
      errorFiles
        .map((e) => `${e.fileName};${e.error};${e.suggestion}`)
        .join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'error_log.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleConfirm = () => {
    // Generate Logs for Batch
    const logs: ImportBatchLog[] = processedFiles.map((p) => ({
      fileName: p.fileName,
      status:
        p.status === 'success'
          ? 'Success'
          : p.status === 'partial'
            ? 'Partial'
            : 'Error',
      details: p.error
        ? [p.error]
        : p.missingTags && p.missingTags.length > 0
          ? [`Tags ausentes: ${p.missingTags.join(', ')}`]
          : [],
    }))

    addTransactions(items, {
      category: importCategory,
      logs: logs,
      totalFiles: totalFiles,
    })

    toast({
      title: 'Importação Concluída',
      description: `${items.length} documentos importados.`,
    })

    handleClose()
  }

  const handleClose = () => {
    if (uploadStatus === 'processing') {
      const confirmCancel = window.confirm(
        'O processamento ainda está em andamento. Deseja cancelar?',
      )
      if (!confirmCancel) return
    }
    setItems([])
    setProcessedFiles([])
    setUploadStatus('idle')
    setTotalFiles(0)
    setProcessedCount(0)
    setSuccessCount(0)
    setPartialCount(0)
    setFailureCount(0)
    onOpenChange(false)
  }

  const clearErrors = () => {
    setProcessedFiles((prev) => prev.filter((p) => p.status !== 'error'))
    setFailureCount(0)
    setActiveTab('valid')
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <span>Importação em Massa (XML)</span>
                {uploadStatus !== 'idle' && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {processedCount} / {totalFiles}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Importe até 1.000 arquivos simultaneamente.
              </DialogDescription>
            </div>

            <div className="flex gap-4 items-center bg-muted/30 p-2 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Switch
                  id="validate-schema"
                  checked={validateSchema}
                  onCheckedChange={setValidateSchema}
                  disabled={uploadStatus === 'processing' || items.length > 0}
                />
                <Label
                  htmlFor="validate-schema"
                  className="text-xs cursor-pointer"
                >
                  Validar Schema XML
                </Label>
              </div>
              <div className="w-px h-6 bg-border mx-1" />
              <div className="flex items-center space-x-2">
                <Label className="text-xs">Categoria:</Label>
                <Select
                  value={importCategory}
                  onValueChange={(v: any) => setImportCategory(v)}
                  disabled={uploadStatus === 'processing' || items.length > 0}
                >
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receitas">Receitas</SelectItem>
                    <SelectItem value="Despesas">Despesas</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6 pt-2 gap-4">
          {uploadStatus === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Processando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex gap-4 text-xs text-muted-foreground justify-center">
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {successCount} Completos
                </span>
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {partialCount} Parciais
                </span>
                <span className="text-rose-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> {failureCount} Falhas
                </span>
              </div>
            </div>
          )}

          {uploadStatus === 'idle' && items.length === 0 && !hasErrors ? (
            <div
              className="border-2 border-dashed rounded-lg flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="p-4 rounded-full bg-background border group-hover:scale-110 transition-transform">
                <FileUp className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-foreground">
                  Arraste seus arquivos XML aqui
                </p>
                <p className="text-sm">ou clique para buscar na pasta</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".xml"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              <div className="flex justify-between items-center">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as any)}
                  className="w-full"
                >
                  <div className="flex justify-between items-center w-full">
                    <TabsList>
                      <TabsTrigger value="valid" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Válidos
                        <Badge variant="secondary" className="ml-1">
                          {items.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="errors"
                        className="gap-2 text-destructive data-[state=active]:text-destructive"
                      >
                        <AlertTriangle className="h-4 w-4" /> Erros
                        {errorFiles.length > 0 && (
                          <Badge variant="destructive" className="ml-1">
                            {errorFiles.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileUp className="mr-2 h-4 w-4" /> Adicionar Mais
                      </Button>
                      {errorFiles.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={clearErrors}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Limpar Erros
                        </Button>
                      )}
                    </div>
                  </div>

                  <TabsContent
                    value="valid"
                    className="mt-4 h-[calc(100%-40px)]"
                  >
                    <ScrollArea className="h-full border rounded-md">
                      <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">
                              Status
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">
                                {item.cteNumber || item.documentNumber || '-'}
                              </TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">
                                {item.description}
                              </TableCell>
                              <TableCell className="text-right font-medium text-xs">
                                {formatCurrency(item.value)}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.importStatus === 'partial' ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-800 border-amber-200"
                                  >
                                    Parcial
                                  </Badge>
                                ) : item.consistencyWarnings &&
                                  item.consistencyWarnings.length > 0 ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-700 border-amber-200 gap-1"
                                      >
                                        <AlertOctagon className="h-3 w-3" />
                                        {item.consistencyWarnings.length}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <ul className="list-disc pl-4 text-xs">
                                        {item.consistencyWarnings.map(
                                          (w, idx) => (
                                            <li key={idx}>{w}</li>
                                          ),
                                        )}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200"
                                  >
                                    Completo
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setItems(
                                      items.filter((_, idx) => idx !== i),
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {items.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center h-24 text-muted-foreground"
                              >
                                Nenhum item válido na lista.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent
                    value="errors"
                    className="mt-4 h-[calc(100%-40px)]"
                  >
                    <div className="h-full flex flex-col gap-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Arquivos Falharam</AlertTitle>
                        <AlertDescription>
                          {errorFiles.length} arquivos não puderam ser
                          processados.
                          <Button
                            variant="link"
                            className="text-white underline p-0 h-auto ml-2"
                            onClick={handleDownloadLog}
                          >
                            <Download className="mr-1 h-3 w-3" /> Baixar Log
                          </Button>
                        </AlertDescription>
                      </Alert>

                      <ScrollArea className="flex-1 border rounded-md bg-red-50/30">
                        <Table>
                          <TableHeader className="bg-red-100/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="w-[30%]">Arquivo</TableHead>
                              <TableHead className="w-[30%]">
                                Erro Detectado
                              </TableHead>
                              <TableHead className="w-[40%]">
                                Sugestão de Correção
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {errorFiles.map((p, i) => (
                              <TableRow key={i} className="hover:bg-red-50">
                                <TableCell className="font-medium text-xs break-all">
                                  {p.fileName}
                                </TableCell>
                                <TableCell className="text-xs text-red-600 font-semibold">
                                  {p.error}
                                </TableCell>
                                <TableCell className="text-xs flex items-center gap-2 text-muted-foreground">
                                  <HelpCircle className="h-3 w-3" />
                                  {p.suggestion}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10">
          <div className="flex justify-between w-full items-center">
            <span className="text-xs text-muted-foreground">
              {items.length} itens prontos para importação.
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={items.length === 0 || uploadStatus === 'processing'}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Confirmar Importação
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".xml"
        onChange={handleFileChange}
      />
    </Dialog>
  )
}
