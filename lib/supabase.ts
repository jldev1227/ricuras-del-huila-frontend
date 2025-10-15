import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno de Supabase no configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Configurar el bucket para productos (bucket existente)
export const PRODUCTOS_BUCKET = 'productos'

// Helper para obtener URL pública de imagen
export function getProductImageUrl(imagePath: string | null): string {
  if (!imagePath) return '/placeholder-product.png'
  
  // Crear la URL completa manualmente usando las variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const bucketName = PRODUCTOS_BUCKET
  
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
    return '/placeholder-product.png'
  }
  
  // Construir la URL pública completa
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${imagePath}`

  return publicUrl
}

// Helper para subir imagen de producto
export async function uploadProductImage(
  file: File, 
  productId: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${productId}-${Date.now()}.${fileExt}`
    const filePath = `productos/${fileName}` // Organizar en subcarpeta

    console.log('📤 Subiendo archivo:', fileName, 'al bucket:', PRODUCTOS_BUCKET)

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(PRODUCTOS_BUCKET)
      .upload(filePath, file, {
        upsert: true, // Reemplazar si existe
        contentType: file.type,
        cacheControl: '3600' // Cache por 1 hora
      })

    if (error) {
      console.error('❌ Error de Supabase Storage:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Archivo subido exitosamente:', data.path)
    return { success: true, path: data.path }
  } catch (error) {
    console.error('❌ Error general en upload:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al subir archivo' 
    }
  }
}

// Helper para eliminar imagen de producto
export async function deleteProductImage(
  imagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ Eliminando archivo:', imagePath, 'del bucket:', PRODUCTOS_BUCKET)

    const { error } = await supabase.storage
      .from(PRODUCTOS_BUCKET)
      .remove([imagePath])

    if (error) {
      console.warn('⚠️ Error al eliminar archivo de Supabase:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ Archivo eliminado exitosamente')
    return { success: true }
  } catch (error) {
    console.error('❌ Error general en eliminación:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar archivo' 
    }
  }
}

// Helper para obtener información del archivo
export async function getFileInfo(imagePath: string) {
  try {
    const { data, error } = await supabase.storage
      .from(PRODUCTOS_BUCKET)
      .list(imagePath.split('/').slice(0, -1).join('/'), {
        search: imagePath.split('/').pop()
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}