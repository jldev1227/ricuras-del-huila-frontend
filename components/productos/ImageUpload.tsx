'use client'

import { useState } from 'react'
import { Button } from '@heroui/react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { useAuthStore } from '@/hooks/useAuth'
import ProductImage from './ProductImage'

interface ImageUploadProps {
  productId: string
  currentImage?: string | null
  productName: string
  onImageUpdated?: (imagePath: string | null) => void
  disabled?: boolean
}

export default function ImageUpload({ 
  productId, 
  currentImage, 
  productName,
  onImageUpdated,
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authenticatedFetch = useAuthenticatedFetch()
  const { token } = useAuthStore()

  const handleDebugAuth = () => {
    console.log('🔍 [ImageUpload] Debug Auth:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPrefix: token?.substring(0, 10) + '...'
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validaciones del cliente
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB')
      return
    }

    console.log('🚀 [ImageUpload] Iniciando upload...')
    
    setUploading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('productId', productId)

      console.log('📤 [ImageUpload] Enviando FormData:', { 
        url: '/api/productos/upload-image',
        method: 'POST',
        formDataKeys: Array.from(formData.keys()),
        productId 
      })

      const response = await authenticatedFetch('/api/productos/upload-image', {
        method: 'POST',
        body: formData
      })

      console.log('📨 [ImageUpload] Respuesta:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const data = await response.json()
        onImageUpdated?.(data.imagePath)
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Error al subir imagen')
      }
    } catch (error) {
      console.error('Error en upload:', error)
      setError('Error de conexión al subir imagen')
    } finally {
      setUploading(false)
      // Limpiar input
      event.target.value = ''
    }
  }

  const handleDeleteImage = async () => {
    if (!currentImage) return

    setDeleting(true)
    setError(null)
    
    try {
      const response = await authenticatedFetch('/api/productos/upload-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      if (response.ok) {
        onImageUpdated?.(null)
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Error al eliminar imagen')
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error)
      setError('Error de conexión al eliminar imagen')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Vista previa de imagen actual */}
      {currentImage && (
        <div className="relative inline-block">
          <div className="relative w-48 h-36 rounded-lg overflow-hidden border border-gray-200">
            <ProductImage 
              imagePath={currentImage}
              productName={productName}
              className="rounded-lg"
              fill
            />
          </div>
          <Button
            isIconOnly
            size="sm"
            color="danger"
            className="absolute -top-2 -right-2 shadow-lg"
            onPress={handleDeleteImage}
            isLoading={deleting}
            disabled={disabled || uploading}
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {/* Upload de nueva imagen */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id={`image-upload-${productId}`}
            onChange={handleFileUpload}
            disabled={uploading || disabled}
          />
          <Button
            as="label"
            htmlFor={`image-upload-${productId}`}
            color="primary"
            variant="bordered"
            startContent={<Upload size={16} />}
            isLoading={uploading}
            disabled={disabled}
            className="cursor-pointer"
          >
            {uploading ? 'Subiendo...' : (currentImage ? 'Cambiar imagen' : 'Subir imagen')}
          </Button>
        </div>

        {/* Botón de debug - solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            size="sm"
            variant="ghost"
            onPress={handleDebugAuth}
            className="mt-2"
          >
            🔍 Debug Auth
          </Button>
        )}

        {/* Mostrar error si existe */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Formatos soportados: JPG, PNG, WebP. Tamaño máximo: 5MB
        </p>
      </div>
    </div>
  )
}