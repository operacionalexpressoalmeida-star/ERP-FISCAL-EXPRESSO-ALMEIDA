import { useErpStore, Transaction } from '@/stores/useErpStore'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Eye,
  FileText,
  Image as ImageIcon,
  Search,
  Download,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { formatCurrency, formatFileSize } from '@/lib/utils'
import { PaginationControls } from '@/components/PaginationControls'
import { FilePreviewDialog } from '@/components/operations/FilePreviewDialog'
import { Badge } from '@/components/ui/badge'

const ITEMS_PER_PAGE = 10

export default function AttachmentCenter() {
  const { getFilteredTransactions } = useErpStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)

  // Get transactions with attachments
  const attachments = useMemo(() => {
    return getFilteredTransactions()
      .filter((t) => t.attachmentUrl)
      .map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        value: t.value,
        url: t.attachmentUrl!,
        name: t.attachmentName || `Anexo - ${t.description}`,
        type: t.attachmentType || 'application/pdf',
        size: t.attachmentSize || 0,
      }))
      .filter((file) => {
        const matchesSearch = file.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

        let matchesType = true
        if (typeFilter === 'image') {
          matchesType = file.type.startsWith('image/')
        } else if (typeFilter === 'pdf') {
          matchesType = file.type === 'application/pdf'
        }

        return matchesSearch && matchesType
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [getFilteredTransactions, searchTerm, typeFilter])

  const totalPages = Math.ceil(attachments.length / ITEMS_PER_PAGE)
  const currentData = attachments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handlePreview = (file: (typeof attachments)[0]) => {
    setPreviewFile({
      url: file.url,
      name: file.name,
      type: file.type,
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central de Anexos</h1>
        <p className="text-muted-foreground">
          Gestão centralizada de documentos e comprovantes fiscais.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Documentos Armazenados</CardTitle>
              <CardDescription>
                {attachments.length} arquivos encontrados.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Imagens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Tipo</TableHead>
                <TableHead>Nome do Arquivo</TableHead>
                <TableHead>Data Upload</TableHead>
                <TableHead>Referência (Despesa)</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    {file.type.startsWith('image/') ? (
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center text-red-600">
                        <FileText className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className="font-medium truncate max-w-[200px]"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {file.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(file.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className="text-sm truncate max-w-[200px]"
                        title={file.description}
                      >
                        {file.description}
                      </span>
                      <span className="text-xs font-medium text-emerald-600">
                        {formatCurrency(file.value)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(file)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Baixar"
                      >
                        <a href={file.url} download={file.name}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum anexo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <FilePreviewDialog
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
        fileType={previewFile?.type}
      />
    </div>
  )
}
