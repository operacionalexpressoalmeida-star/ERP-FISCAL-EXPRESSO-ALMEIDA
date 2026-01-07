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
import { Upload, Loader2, Trash2, Check, FileUp } from 'lucide-react'
import { useState, useRef } from 'react'
import { parseFiscalXml, ParsedFiscalDoc } from '@/lib/xml-parser'
import { formatCurrency } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'

interface XmlImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (items: ParsedFiscalDoc[]) => void
}

export function XmlImportDialog({
  open,
  onOpenChange,
  onConfirm,
}: XmlImportDialogProps) {
  const [items, setItems] = useState<ParsedFiscalDoc[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    setIsProcessing(true)
    const newItems: ParsedFiscalDoc[] = []
    let errors = 0
    let importedCount = 0

    const files = Array.from(e.target.files)

    for (const file of files) {
      try {
        const item = await parseFiscalXml(file)
        calculateTaxesIfNeeded(item)
        newItems.push(item)
        importedCount++
      } catch (err) {
        console.error(err)
        errors++
      }
    }

    if (errors > 0) {
      toast({
        title: 'Erros na Leitura',
        description: `${errors} arquivos falharam. ${importedCount} processados com sucesso.`,
        variant: 'destructive',
      })
    } else if (importedCount > 0) {
      toast({
        title: 'Arquivos Processados',
        description: `${importedCount} arquivos XML lidos com sucesso. Verifique os dados abaixo.`,
      })
    }

    setItems((prev) => [...prev, ...newItems])
    setIsProcessing(false)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const calculateTaxesIfNeeded = (item: ParsedFiscalDoc) => {
    const val = item.value

    // Only estimate if values are 0 (not parsed from XML)
    if (item.pisValue === 0 && item.cofinsValue === 0) {
      // PIS/COFINS (Lucro Real Presumption)
      item.pisValue = parseFloat((val * 0.0165).toFixed(2))
      item.cofinsValue = parseFloat((val * 0.076).toFixed(2))
    }

    if (item.icmsValue === 0 && item.origin && item.destination) {
      const isInternal = item.origin === item.destination
      const rate = isInternal ? 0.18 : 0.12
      item.icmsValue = parseFloat((val * rate).toFixed(2))
    }
  }

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    onConfirm(items)
    setItems([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar XML (NF-e, NFS-e, CT-e)</DialogTitle>
          <DialogDescription>
            Carregue arquivos XML para extração automática de dados fiscais.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {items.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg flex-1 min-h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 rounded-full bg-background border group-hover:scale-110 transition-transform">
                <FileUp className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-foreground">
                  Clique para selecionar arquivos
                </p>
                <p className="text-sm">
                  Suporta múltiplos arquivos .xml (CT-e, NF-e, NFS-e)
                </p>
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
            <div className="flex flex-col gap-4 h-full">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{items.length}</span>
                  <span className="text-muted-foreground">
                    registros encontrados
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItems([])}
                  >
                    Limpar Tudo
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Adicionar mais
                  </Button>
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

              <ScrollArea className="flex-1 border rounded-md h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Número / Chave</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Parceiro</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[150px]">
                          <div className="truncate font-semibold">
                            {item.cteNumber || item.documentNumber || '-'}
                          </div>
                          {item.accessKey && (
                            <div
                              className="truncate text-[10px] text-muted-foreground"
                              title={item.accessKey}
                            >
                              {item.accessKey}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.type === 'expense' ? 'Despesa' : 'Receita'}
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]">
                          {item.type === 'revenue'
                            ? item.takerName || item.recipientCnpj
                            : item.providerName || item.providerCnpj}
                        </TableCell>
                        <TableCell
                          className="max-w-[180px] truncate text-xs"
                          title={item.description}
                        >
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.value)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(i)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive opacity-70 hover:opacity-100" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4 bg-muted/20 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" /> Processando arquivos
              XML...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={items.length === 0 || isProcessing}
          >
            <Check className="mr-2 h-4 w-4" /> Confirmar Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
