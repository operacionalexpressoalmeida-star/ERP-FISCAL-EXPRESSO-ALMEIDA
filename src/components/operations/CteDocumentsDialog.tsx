import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Transaction } from '@/stores/useErpStore'
import { useErpStore } from '@/stores/useErpStore'
import { useState } from 'react'
import { Trash2, Eye, Upload, FileText, ImageIcon } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FilePreviewDialog } from '@/components/operations/FilePreviewDialog'

interface CteDocumentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export function CteDocumentsDialog({
  open,
  onOpenChange,
  transaction,
}: CteDocumentsDialogProps) {
  const { updateTransaction } = useErpStore()
  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)

  if (!transaction) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Máximo 5MB.',
        variant: 'destructive',
      })
      return
    }

    // Convert to base64 mock
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const url = reader.result as string
      const newDoc = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        url: url,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      }

      const currentDocs = transaction.documents || []
      updateTransaction(transaction.id, {
        documents: [...currentDocs, newDoc],
      })

      toast({ title: 'Documento Anexado', description: file.name })
    }
  }

  const handleDelete = (docId: string) => {
    const currentDocs = transaction.documents || []
    const newDocs = currentDocs.filter((d) => d.id !== docId)
    updateTransaction(transaction.id, { documents: newDocs })
    toast({ title: 'Documento Removido' })
  }

  const documents = transaction.documents || []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documentos Complementares</DialogTitle>
            <DialogDescription>
              CT-e: {transaction.cteNumber} - Gerenciar anexos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/20 justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">Adicionar arquivo</p>
                <p className="text-xs text-muted-foreground">
                  PDF ou Imagem (max 5MB)
                </p>
              </div>
              <Input
                type="file"
                className="w-[200px]"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
              />
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        {doc.type.includes('pdf') ? (
                          <FileText className="h-4 w-4 text-red-500" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewFile(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center h-24 text-muted-foreground"
                      >
                        Nenhum documento anexado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
        fileType={previewFile?.type}
      />
    </>
  )
}
