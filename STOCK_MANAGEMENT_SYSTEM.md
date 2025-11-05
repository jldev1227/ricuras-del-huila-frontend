# Sistema de Gestión de Stock Integrado con Órdenes

## 📋 Resumen
Se ha implementado un sistema completo de gestión de stock que se integra automáticamente con todas las operaciones CRUD de órdenes, garantizando que el inventario se mantenga actualizado en tiempo real.

## 🚀 Funcionalidades Implementadas

### 1. **Control Automático de Stock en Órdenes**
- ✅ **CREAR Orden**: Descuenta automáticamente el stock al crear una nueva orden
- ✅ **ACTUALIZAR Orden**: Ajusta el stock según los cambios en cantidades de items
- ✅ **ELIMINAR Orden**: Restaura el stock completo de los productos al cancelar una orden

### 2. **Gestión Inteligente de Stock**
- **Control por Producto**: Solo los productos con `controlar_stock = true` son gestionados
- **Actualización de Disponibilidad**: Los productos se marcan automáticamente como no disponibles cuando el stock llega a 0
- **Validación Inteligente**: Permite continuar con órdenes incluso con stock insuficiente (genera advertencia)
- **Auditoría Completa**: Cada movimiento de stock queda registrado en `movimientos_stock`

### 3. **Funciones Principales Implementadas**

#### `actualizarStockProductos()` 
```typescript
// Ubicación: app/api/ordenes/route.ts y app/api/ordenes/[id]/route.ts
// Propósito: Actualiza stock y crea movimientos de auditoría
// Parámetros:
- items: Items de la orden
- transactionClient: Cliente de transacción Prisma
- tipoMovimiento: "entrada" | "salida"
- referencia: Referencia del movimiento (ej: ORDEN_123)
- creadoPor: ID del usuario que realiza la acción
```

#### `restaurarStockOrden()` 
```typescript
// Ubicación: app/api/ordenes/route.ts
// Propósito: Restaura stock cuando se elimina una orden
// Usado en: DELETE /api/ordenes/{id}
```

#### `ajustarStockPorCambios()` 
```typescript
// Ubicación: app/api/ordenes/[id]/route.ts  
// Propósito: Calcula diferencias entre items anteriores y nuevos
// Usado en: PUT /api/ordenes/{id}
```

## 🔄 Flujo de Operaciones

### Crear Orden (POST /api/ordenes)
1. Valida datos de la orden
2. Crea la orden en la base de datos
3. **Descuenta stock** de cada producto (tipo: "salida")
4. Actualiza disponibilidad automática
5. Registra movimientos en auditoría

### Actualizar Orden (PUT /api/ordenes/{id})
1. Obtiene orden existente con sus items
2. **Calcula diferencias** entre items anteriores y nuevos
3. **Ajusta stock** según las diferencias:
   - Aumento de cantidad → Descuenta más stock ("salida")
   - Disminución de cantidad → Devuelve stock ("entrada")
   - Productos eliminados → Devuelve todo el stock ("entrada")
   - Productos nuevos → Descuenta stock ("salida")
4. Actualiza la orden
5. Registra todos los movimientos

### Eliminar Orden (DELETE /api/ordenes/{id})
1. Obtiene la orden con todos sus items
2. **Restaura stock completo** de todos los productos (tipo: "entrada")
3. Actualiza disponibilidad automática
4. Elimina la orden
5. Registra movimientos de restauración

## 📊 Tabla de Auditoría (movimientos_stock)

Cada operación genera registros detallados:
```sql
movimientos_stock {
  id: UUID
  producto_id: Referencia al producto
  tipo_movimiento: "entrada" | "salida"
  cantidad: Cantidad del movimiento
  stock_anterior: Stock antes del movimiento
  stock_nuevo: Stock después del movimiento  
  motivo: Descripción del motivo
  referencia: Referencia a la orden (ej: ORDEN_123)
  creado_por: Usuario que realizó la acción
  creado_en: Timestamp del movimiento
}
```

## 🔍 Logging y Monitoreo

El sistema incluye logging detallado en consola:
- `📦 SALIDA/ENTRADA`: Operaciones de stock
- `✅ Stock actualizado`: Confirmaciones de actualización
- `⚠️ Stock insuficiente`: Advertencias de stock bajo
- `🔄 Ajustando stock`: Operaciones de ajuste en actualizaciones
- `📊 Ajuste`: Detalles de diferencias calculadas

## ⚙️ Configuración

### Habilitar Control de Stock por Producto
```sql
UPDATE productos 
SET controlar_stock = true 
WHERE id = 'producto_id';
```

### Configurar Stock Inicial
```sql
UPDATE productos 
SET stock_actual = 100,
    disponible = true
WHERE id = 'producto_id';
```

## 🛡️ Características de Seguridad

1. **Transacciones**: Todas las operaciones usan transacciones para garantizar consistencia
2. **Validación**: Verifica existencia de productos antes de actualizar stock
3. **Tolerancia a Errores**: Permite órdenes con stock insuficiente (genera advertencia)
4. **Auditoría Completa**: Rastrea todos los movimientos con usuario y timestamp
5. **Restauración Automática**: Garantiza que el stock se restaure al eliminar órdenes

## 📝 Ejemplos de Uso

### Crear una orden que descuenta stock:
```javascript
POST /api/ordenes
{
  "items": [
    {
      "producto_id": "prod-123",
      "cantidad": 2,
      "precio_unitario": 15000
    }
  ],
  // ... otros campos
}
// Resultado: Stock del producto se reduce en 2 unidades
```

### Actualizar orden cambiando cantidades:
```javascript
PUT /api/ordenes/orden-456
{
  "items": [
    {
      "producto_id": "prod-123", 
      "cantidad": 5, // Era 2, ahora 5
      "precio_unitario": 15000
    }
  ]
}
// Resultado: Stock se reduce en 3 unidades adicionales
```

### Eliminar orden:
```javascript
DELETE /api/ordenes/orden-456
// Resultado: Stock de todos los productos se restaura completamente
```

## 🎯 Beneficios del Sistema

1. **Automatización Completa**: No requiere intervención manual para gestión de stock
2. **Consistencia**: Garantiza que el stock siempre refleje las órdenes reales
3. **Trazabilidad**: Auditoría completa de todos los movimientos
4. **Flexibilidad**: Control por producto - solo se gestionan productos configurados
5. **Robustez**: Manejo de errores y validaciones completas
6. **Tiempo Real**: Actualizaciones instantáneas en todas las operaciones

---

**Desarrollado para Ricuras del Huila - Sistema POS**
*Sistema completo de gestión de inventario integrado con órdenes*