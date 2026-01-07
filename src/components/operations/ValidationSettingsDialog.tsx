import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useErpStore, ValidationSettings } from '@/stores/useErpStore'
import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { ShieldOff, Tags } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'

interface ValidationSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Default values to prevent crashes if store state is incomplete
const DEFAULT_XML_TAGS = {
  ide: 'mandatory' as const,
  emit: 'mandatory' as const,
  dest: 'mandatory' as const,
  total: 'mandatory' as const,
  infCarga: 'optional' as const,
}

export function ValidationSettingsDialog({
  open,
  onOpenChange,
}: ValidationSettingsDialogProps) {
  const { validationSettings, updateValidationSettings } = useErpStore()

  // Initialize state with fallback to prevent accessing undefined properties
  const [localSettings, setLocalSettings] = useState<ValidationSettings>(
    () => ({
      ...validationSettings,
      xmlTags: validationSettings?.xmlTags || DEFAULT_XML_TAGS,
    }),
  )

  useEffect(() => {
    if (open) {
      setLocalSettings({
        ...validationSettings,
        xmlTags: validationSettings?.xmlTags || DEFAULT_XML_TAGS,
      })
    }
  }, [validationSettings, open])

  const handleSave = () => {
    updateValidationSettings(localSettings)
    toast({
      title: 'Configurações Salvas',
      description: 'As regras de validação foram atualizadas.',
    })
    onOpenChange(false)
  }

  const toggleTag = (
    tag: keyof typeof localSettings.xmlTags,
    checked: boolean,
  ) => {
    // Ensure xmlTags object exists before spreading
    const currentTags = localSettings.xmlTags || DEFAULT_XML_TAGS

    setLocalSettings({
      ...localSettings,
      xmlTags: {
        ...currentTags,
        [tag]: checked ? 'mandatory' : 'optional',
      },
    })
  }

  // Safe access variable for rendering
  const currentXmlTags = localSettings.xmlTags || DEFAULT_XML_TAGS

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações de Validação (CT-e)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between space-x-2 border p-3 rounded-md bg-amber-50 border-amber-200">
            <Label
              htmlFor="disableGlobal"
              className="flex flex-col gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <ShieldOff className="h-4 w-4" />
                Desativar Validação Global
              </div>
              <span className="font-normal text-xs text-amber-700">
                Pula todas as validações automáticas de XML.
                <br />
                <strong>Cuidado:</strong> Documentos inválidos serão aceitos.
              </span>
            </Label>
            <Switch
              id="disableGlobal"
              checked={localSettings.disableGlobalValidation || false}
              onCheckedChange={(c) =>
                setLocalSettings({
                  ...localSettings,
                  disableGlobalValidation: c,
                })
              }
            />
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="tags">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  <span>Tags XML Obrigatórias</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="text-sm text-muted-foreground mb-4">
                  Selecione quais tags do XML são indispensáveis. Se
                  desmarcadas, o sistema aceitará o arquivo como{' '}
                  <strong>Parcial</strong>.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tag-ide"
                      checked={currentXmlTags.ide === 'mandatory'}
                      onCheckedChange={(c) => toggleTag('ide', c)}
                    />
                    <Label htmlFor="tag-ide">Identificação (ide)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tag-emit"
                      checked={currentXmlTags.emit === 'mandatory'}
                      onCheckedChange={(c) => toggleTag('emit', c)}
                    />
                    <Label htmlFor="tag-emit">Emitente (emit)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tag-dest"
                      checked={currentXmlTags.dest === 'mandatory'}
                      onCheckedChange={(c) => toggleTag('dest', c)}
                    />
                    <Label htmlFor="tag-dest">Destinatário (dest)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tag-total"
                      checked={currentXmlTags.total === 'mandatory'}
                      onCheckedChange={(c) => toggleTag('total', c)}
                    />
                    <Label htmlFor="tag-total">Valores Totais (total)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tag-infCarga"
                      checked={currentXmlTags.infCarga === 'mandatory'}
                      onCheckedChange={(c) => toggleTag('infCarga', c)}
                    />
                    <Label htmlFor="tag-infCarga">Info Carga (infCarga)</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Regras de Negócio</h4>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="blockCfop" className="flex flex-col gap-1">
                <span>Bloquear CFOP Inválido</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Impede a emissão se o CFOP não corresponder à UF (5xxx/6xxx).
                </span>
              </Label>
              <Switch
                id="blockCfop"
                checked={localSettings.blockInvalidCfop}
                onCheckedChange={(c) =>
                  setLocalSettings({ ...localSettings, blockInvalidCfop: c })
                }
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="blockState" className="flex flex-col gap-1">
                <span>Validar UF Estrita</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Rejeita siglas de estado que não existem na tabela oficial.
                </span>
              </Label>
              <Switch
                id="blockState"
                checked={localSettings.blockInvalidStates}
                onCheckedChange={(c) =>
                  setLocalSettings({ ...localSettings, blockInvalidStates: c })
                }
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="reqFreight" className="flex flex-col gap-1">
                <span>Exigir ID de Frete</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Alerta se o documento não estiver vinculado a uma carga.
                </span>
              </Label>
              <Switch
                id="reqFreight"
                checked={localSettings.requireFreightId}
                onCheckedChange={(c) =>
                  setLocalSettings({ ...localSettings, requireFreightId: c })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="maxVal">Alerta de Valor Máximo</Label>
                <Input
                  id="maxVal"
                  type="number"
                  value={localSettings.maxValueThreshold}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      maxValueThreshold: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pendingLimit">Limite Pendência (Horas)</Label>
                <Input
                  id="pendingLimit"
                  type="number"
                  value={localSettings.pendingLimitHours}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      pendingLimitHours: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
