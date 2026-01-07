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
import { useErpStore } from '@/stores/useErpStore'
import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

interface ValidationSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ValidationSettingsDialog({
  open,
  onOpenChange,
}: ValidationSettingsDialogProps) {
  const { validationSettings, updateValidationSettings } = useErpStore()
  const [localSettings, setLocalSettings] = useState(validationSettings)

  useEffect(() => {
    setLocalSettings(validationSettings)
  }, [validationSettings, open])

  const handleSave = () => {
    updateValidationSettings(localSettings)
    toast({
      title: 'Configurações Salvas',
      description: 'As regras de validação foram atualizadas.',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurações de Validação (CT-e)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
