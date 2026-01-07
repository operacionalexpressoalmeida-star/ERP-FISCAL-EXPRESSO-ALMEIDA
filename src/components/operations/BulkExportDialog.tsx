import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface BulkExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkExportDialog({
  open,
  onOpenChange,
}: BulkExportDialogProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [fileType, setFileType] = useState('all')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    // Simulate export delay
    setTimeout(() => {
      setIsExporting(false)
      onOpenChange(false)
      toast({
        title: 'Exportação Concluída',
        description: 'O pacote de arquivos foi baixado com sucesso.',
      })
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportação em Massa</DialogTitle>
          <DialogDescription>
            Baixe documentos fiscais e comprovantes filtrados.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="start" className="text-sm font-medium">
                Data Início
              </label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="end" className="text-sm font-medium">
                Data Fim
              </label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-medium">
              Tipo de Arquivo
            </label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="pdf">Documentos PDF</SelectItem>
                <SelectItem value="image">Imagens (JPG/PNG)</SelectItem>
                <SelectItem value="link">Links Externos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Pacote...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar Arquivos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
