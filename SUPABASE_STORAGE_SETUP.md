# Configuración del Bucket "productos" en Supabase

## ✅ Bucket ya configurado

El bucket **"productos"** ya está configurado en tu Supabase con:

- **Nombre del bucket:** `productos`
- **URL de almacenamiento:** `https://sdtoftiqytveugixeliv.storage.supabase.co/storage/v1/s3`
- **Región:** `us-east-2`

## 🔑 Políticas RLS necesarias

Para que la aplicación funcione correctamente, asegúrate de que las siguientes políticas estén configuradas:

### 1. Lectura pública (para mostrar imágenes)
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'productos');
```

### 2. Upload para usuarios autenticados
```sql
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'productos' 
  AND auth.role() = 'authenticated'
);
```

### 3. Update para usuarios autenticados
```sql
CREATE POLICY "Authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'productos'
  AND auth.role() = 'authenticated'
);
```

### 4. Delete para usuarios autenticados
```sql
CREATE POLICY "Authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'productos'
  AND auth.role() = 'authenticated'
);
```

## 📁 Estructura de archivos

Las imágenes se guardarán con la siguiente estructura:
```
productos/
  └── productos/
      ├── [productId]-[timestamp].jpg
      ├── [productId]-[timestamp].png
      └── [productId]-[timestamp].webp
```

## ✅ Estado actual

- ✅ Cliente de Supabase configurado
- ✅ Helpers de upload/delete/getURL creados  
- ✅ Componentes ProductImage e ImageUpload creados
- ✅ API de upload actualizada para usar Supabase
- ✅ Variables de entorno configuradas
- ✅ Bucket "productos" especificado
- ⏳ Pendiente: Verificar políticas RLS en Supabase Dashboard

## 🎯 Próximos pasos

1. Ir al Dashboard de Supabase → Storage → productos
2. Verificar que las políticas RLS estén configuradas
3. Probar subida de una imagen de producto
4. Verificar que las imágenes se muestren correctamente

## 🛠️ Pasos para configurar el Storage

### 1. **Crear el bucket**

1. Ve a tu [Dashboard de Supabase](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Haz clic en **"Create a new bucket"**
5. Nombre del bucket: `productos-images`
6. Configuración:
   - Public bucket: ✅ **Activado**
   - File size limit: `5MB`
   - Allowed MIME types: `image/*`

### 2. **Configurar políticas RLS (Row Level Security)**

Ve a **Storage → Policies** y agrega estas políticas:

#### Política para lectura pública:
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'productos-images');
```

#### Política para subir imágenes (usuarios autenticados):
```sql
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'productos-images' 
  AND auth.role() = 'authenticated'
);
```

#### Política para actualizar imágenes:
```sql
CREATE POLICY "Authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'productos-images'
  AND auth.role() = 'authenticated'
);
```

#### Política para eliminar imágenes:
```sql
CREATE POLICY "Authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'productos-images'
  AND auth.role() = 'authenticated'
);
```

### 3. **Variables de entorno**

Asegúrate de que tu archivo `.env` contenga:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. **Estructura de carpetas en el bucket**

El sistema creará automáticamente esta estructura:

```
productos-images/
└── productos/
    ├── producto-123-1697234567890.jpg
    ├── producto-456-1697234567891.png
    └── producto-789-1697234567892.webp
```

## 🚀 Cómo usar

### En componentes de formularios:
```tsx
import ImageUpload from '@/components/productos/ImageUpload'

<ImageUpload
  productId={producto.id}
  currentImage={producto.imagen}
  productName={producto.nombre}
  onImageUpdated={(imagePath) => {
    // Actualizar estado del producto
    setProducto(prev => ({ ...prev, imagen: imagePath }))
  }}
/>
```

### Para mostrar imágenes:
```tsx
import ProductImage from '@/components/productos/ProductImage'

<ProductImage
  imagePath={producto.imagen}
  productName={producto.nombre}
  width={200}
  height={150}
  className="rounded-lg"
/>
```

## 📋 APIs disponibles

### POST `/api/productos/upload-image`
- **Body**: FormData con `image` (File) y `productId` (string)
- **Response**: `{ success: boolean, imagePath: string, message: string }`

### DELETE `/api/productos/upload-image`
- **Body**: `{ productId: string }`
- **Response**: `{ success: boolean, message: string }`

## ✅ Beneficios implementados

- 🌐 **CDN automático** - Entrega rápida global
- 📦 **Sin límites de storage** - No más `/public`
- 🔒 **Seguridad** - Control de acceso con RLS
- 🗜️ **Optimización** - Compresión automática
- 🔄 **Backup automático** - Respaldos de Supabase
- 🚀 **URLs persistentes** - No cambian con deployments

## 🔧 Troubleshooting

### Error: "bucket does not exist"
- Verifica que el bucket `productos-images` esté creado
- Revisa que sea público

### Error: "not allowed to upload"
- Verifica las políticas RLS
- Asegúrate de que el usuario esté autenticado

### Imágenes no se cargan:
- Verifica las variables de entorno
- Revisa la política de lectura pública

## 📝 Migración de imágenes existentes

Si ya tienes imágenes en `/public/productos/`, puedes migrarlas manualmente:

1. Descarga las imágenes de `/public/productos/`
2. Súbelas al bucket usando el panel de Supabase
3. Actualiza los registros en la base de datos:

```sql
UPDATE productos 
SET imagen = 'productos/nueva-ruta-imagen.jpg'
WHERE imagen = '/productos/vieja-ruta-imagen.jpg';
```