import { useRef, useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw, Check, Loader2, StopCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface DocumentScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (file: File) => void
}

export function DocumentScanner({
  open,
  onOpenChange,
  onCapture,
}: DocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsStreaming(false)
    }
  }, [stream])

  const startCamera = async () => {
    setIsLoading(true)
    setCapturedImage(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      toast({
        title: 'Erro na Câmera',
        description:
          'Não foi possível acessar a câmera. Verifique as permissões.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setCapturedImage(dataUrl)
        stopStream()
      }
    }
  }

  const handleConfirm = () => {
    if (capturedImage) {
      // Convert base64 to File
      fetch(capturedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File(
            [blob],
            `scanned-doc-${new Date().getTime()}.jpg`,
            { type: 'image/jpeg' },
          )
          onCapture(file)
          handleClose()
        })
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleClose = () => {
    stopStream()
    setCapturedImage(null)
    onOpenChange(false)
  }

  // Cleanup on unmount or close
  useEffect(() => {
    if (!open) {
      stopStream()
    } else if (open && !capturedImage) {
      startCamera()
    }
    return () => {
      stopStream()
    }
  }, [open, stopStream]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Digitalizar Documento</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect usually preferred, but for docs 'environment' facing mode shouldn't be mirrored ideally. Browsers handle logic.
              muted
              playsInline
            />
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isStreaming && !capturedImage && !isLoading && (
            <div className="text-center p-4">
              <p className="text-muted-foreground mb-2">Câmera desativada</p>
              <Button onClick={startCamera} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
              </Button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
          {capturedImage ? (
            <>
              <Button
                variant="outline"
                onClick={handleRetake}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Tirar Outra
              </Button>
              <Button onClick={handleConfirm} className="w-full sm:w-auto">
                <Check className="mr-2 h-4 w-4" /> Usar Foto
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <Button
                onClick={captureImage}
                disabled={!isStreaming}
                className="rounded-full w-12 h-12 p-0"
              >
                <Camera className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
