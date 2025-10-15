import { NextRequest, NextResponse } from 'next/server'
import { uploadProductImage, deleteProductImage } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-server'

export async function POST(request: Request) {
  try {
    console.log('📥 [upload-image] POST request received')
    console.log('🔍 [upload-image] Request URL:', request.url)
    console.log('🔍 [upload-image] Request headers:', Object.fromEntries(request.headers.entries()))
    console.log(request)
    
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    console.log(`🔐 Authorization header: ${authHeader ? 'Present' : 'No header'}`)
    
    if (!authHeader) {
      console.log('❌ No valid authorization header found')
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File || formData.get('file') as File
    const productId = formData.get('productId') as string

    if (!file) {
      return NextResponse.json(
        { message: 'La imagen es requerida' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Solo se permiten archivos de imagen' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'La imagen no puede superar 5MB' },
        { status: 400 }
      )
    }

    let uploadResult;

    if (productId) {
      // Caso 1: Producto existente - verificar que existe y actualizar
      const producto = await prisma.productos.findUnique({
        where: { id: productId }
      })

      if (!producto) {
        return NextResponse.json(
          { message: 'Producto no encontrado' },
          { status: 404 }
        )
      }

      // Eliminar imagen anterior si existe
      if (producto.imagen) {
        console.log('🗑️ Eliminando imagen anterior:', producto.imagen)
        await deleteProductImage(producto.imagen)
      }

      // Subir nueva imagen a Supabase
      console.log('📤 Subiendo imagen para producto existente:', productId)
      uploadResult = await uploadProductImage(file, productId)

      if (!uploadResult.success) {
        return NextResponse.json(
          { message: `Error al subir imagen: ${uploadResult.error}` },
          { status: 500 }
        )
      }

      // Actualizar la ruta de la imagen en la base de datos
      await prisma.productos.update({
        where: { id: productId },
        data: { imagen: uploadResult.imagePath }
      })

      console.log('✅ Imagen actualizada para producto:', productId)
    } else {
      // Caso 2: Producto nuevo - solo subir imagen temporalmente
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      console.log('📤 Subiendo imagen temporal:', tempId)
      uploadResult = await uploadProductImage(file, tempId)

      if (!uploadResult.success) {
        return NextResponse.json(
          { message: `Error al subir imagen: ${uploadResult.error}` },
          { status: 500 }
        )
      }


      console.log('✅ Imagen temporal subida:', tempId)
    }

    console.log('✅ Imagen subida exitosamente:', uploadResult.path)

    return NextResponse.json({
      success: true,
      imagePath: uploadResult.path,
      productId: productId || null,
      message: productId ? 'Imagen actualizada exitosamente' : 'Imagen temporal subida exitosamente'
    })

  } catch (error) {
    console.error('❌ Error en upload de imagen:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para eliminar imagen
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { message: 'ID de producto requerido' },
        { status: 400 }
      )
    }

    const producto = await prisma.productos.findUnique({
      where: { id: productId }
    })

    if (!producto) {
      return NextResponse.json(
        { message: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar imagen de Supabase si existe
    if (producto.imagen) {
      console.log('🗑️ Eliminando imagen de Supabase:', producto.imagen)
      const deleteResult = await deleteProductImage(producto.imagen)
      
      if (!deleteResult.success) {
        console.warn('⚠️ No se pudo eliminar la imagen de Supabase:', deleteResult.error)
        // Continuar de todos modos para actualizar la BD
      }
    }

    // Actualizar producto en la base de datos
    const productoActualizado = await prisma.productos.update({
      where: { id: productId },
      data: { 
        imagen: null,
        actualizado_en: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      producto: productoActualizado
    })

  } catch (error) {
    console.error('❌ Error al eliminar imagen:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
