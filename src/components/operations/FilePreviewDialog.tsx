import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ExternalLink } from 'lucide-react'

interface FilePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  fileUrl: string | undefined
  fileName: string | undefined
  fileType: string | undefined
}

export function FilePreviewDialog({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: FilePreviewDialogProps) {
  if (!fileUrl) return null

  const isImage = fileType?.startsWith('image/')
  const isPdf = fileType === 'application/pdf'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="truncate pr-8">
            Visualizar: {fileName || 'Documento'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <a
                href={fileUrl}
                download={fileName}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Baixar</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 bg-slate-50 overflow-auto p-4 flex items-center justify-center min-h-[400px]">
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName || 'Anexo'}
              className="max-w-full max-h-[70vh] object-contain shadow-sm rounded border"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={fileName || 'PDF Viewer'}
              className="w-full h-[70vh] border rounded shadow-sm bg-white"
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-4">
                Visualização não disponível para este tipo de arquivo.
              </p>
              <Button asChild>
                <a href={fileUrl} download={fileName || 'arquivo'}>
                  Baixar Arquivo
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
