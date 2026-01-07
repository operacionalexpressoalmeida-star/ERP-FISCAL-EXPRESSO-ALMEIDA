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
} from 'lucide-react'
import { useState, useRef } from 'react'
import { parseFiscalXml, ParsedFiscalDoc } from '@/lib/xml-parser'
import { formatCurrency } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface XmlImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (items: ParsedFiscalDoc[]) => void
}

type UploadStatus = 'idle' | 'processing' | 'complete' | 'error'

export function XmlImportDialog({
  open,
  onOpenChange,
  onConfirm,
}: XmlImportDialogProps) {
  const [items, setItems] = useState<ParsedFiscalDoc[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [errorLog, setErrorLog] = useState<
    { fileName: string; error: string }[]
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: File[]) => {
    setUploadStatus('processing')
    setTotalFiles(files.length)
    setProgress(0)
    setProcessedCount(0)
    setErrorLog([])
    setItems([])

    const CHUNK_SIZE = 20
    const newItems: ParsedFiscalDoc[] = []
    const newErrors: { fileName: string; error: string }[] = []

    // Helper to process a chunk of files
    const processChunk = async (chunk: File[]) => {
      const results = await Promise.all(
        chunk.map(async (file) => {
          try {
            if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
              throw new Error('Formato inválido. Apenas XML permitido.')
            }
            const item = await parseFiscalXml(file)
            calculateTaxesIfNeeded(item)
            return { status: 'success' as const, item }
          } catch (err: any) {
            return {
              status: 'error' as const,
              fileName: file.name,
              error: err.message || 'Erro desconhecido',
            }
          }
        }),
      )
      return results
    }

    // Iterate through chunks
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
      const chunk = files.slice(i, i + CHUNK_SIZE)
      const results = await processChunk(chunk)

      results.forEach((res) => {
        if (res.status === 'success') {
          newItems.push(res.item)
        } else {
          newErrors.push({ fileName: res.fileName, error: res.error })
        }
      })

      const currentProcessed = Math.min(i + CHUNK_SIZE, files.length)
      setProcessedCount(currentProcessed)
      setProgress(Math.round((currentProcessed / files.length) * 100))

      // Yield to main thread to allow UI update
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    setItems(newItems)
    setErrorLog(newErrors)
    setUploadStatus('complete')
  }

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
    processFiles(files)
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
      processFiles(files)
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

  const handleConfirm = () => {
    onConfirm(items)
    handleClose()
  }

  const handleClose = () => {
    setItems([])
    setErrorLog([])
    setUploadStatus('idle')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importação em Massa (XML)</DialogTitle>
          <DialogDescription>
            Arraste arquivos ou clique para selecionar. Limite de 1000 arquivos
            por lote.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {uploadStatus === 'idle' ? (
            <div
              className="border-2 border-dashed rounded-lg flex-1 min-h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
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
          ) : uploadStatus === 'processing' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando...</span>
                  <span>
                    {processedCount} de {totalFiles}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-sm text-muted-foreground">
                Por favor, aguarde enquanto processamos os arquivos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 h-full">
              <div className="grid grid-cols-2 gap-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Sucesso</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {items.length} arquivos lidos corretamente.
                  </AlertDescription>
                </Alert>
                <Alert
                  variant={errorLog.length > 0 ? 'destructive' : 'default'}
                  className={
                    errorLog.length === 0 ? 'bg-gray-50 border-gray-200' : ''
                  }
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erros</AlertTitle>
                  <AlertDescription>
                    {errorLog.length} arquivos falharam.
                  </AlertDescription>
                </Alert>
              </div>

              {errorLog.length > 0 && (
                <div className="border rounded-md p-4 bg-red-50 overflow-y-auto max-h-[100px]">
                  <h4 className="font-semibold text-red-800 text-xs mb-2">
                    Arquivos com erro:
                  </h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {errorLog.map((err, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{err.fileName}</span>
                        <span className="font-mono">{err.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <h3 className="font-semibold text-sm">
                  Pré-visualização dos Itens Válidos
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadStatus('idle')}
                >
                  Nova Importação
                </Button>
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {item.cteNumber || item.documentNumber || '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.type === 'expense' ? 'Despesa' : 'Receita'}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">
                          {formatCurrency(item.value)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setItems(items.filter((_, idx) => idx !== i))
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={items.length === 0 || uploadStatus === 'processing'}
          >
            <Check className="mr-2 h-4 w-4" />
            Importar {items.length} Itens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
