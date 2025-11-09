# Sistema de Pagos Múltiples - Ricuras del Huila

## 📋 Resumen
Se ha implementado un sistema completo de pagos parciales que permite recibir el pago de una orden a través de múltiples métodos de pago (hasta 3), facilitando la flexibilidad al momento de cobrar.

## 🚀 Funcionalidades Implementadas

### 1. **Pagos Parciales**
- ✅ **Múltiples Métodos**: Permite combinar hasta 3 métodos de pago diferentes
- ✅ **Métodos Disponibles**: Efectivo, Nequi, Daviplata
- ✅ **Pago Único o Dividido**: Soporta tanto pagos con un único método como pagos divididos
- ✅ **Validación Automática**: Verifica que el total pagado cubra el monto de la orden

### 2. **Características del Sistema**
- **Referencias de Transacción**: Permite registrar número de transacción para pagos electrónicos
- **Cálculo Automático de Vueltas**: Calcula las vueltas cuando el monto pagado excede el total
- **Validación en Tiempo Real**: Muestra advertencias si el monto es insuficiente
- **Registro Detallado**: Cada pago queda registrado individualmente en la base de datos
- **Auditoría Completa**: Rastrea quién registró cada pago y cuándo

### 3. **Estructura de Base de Datos**

#### Tabla `pagos_orden`
```sql
CREATE TABLE pagos_orden (
  id UUID PRIMARY KEY,
  orden_id UUID NOT NULL,
  metodo_pago metodos_pago NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  referencia TEXT,
  notas TEXT,
  creado_por UUID,
  creado_en TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);
```

### 4. **Componente de Gestión de Pagos**

**Ubicación**: `components/orden/GestionPagos.tsx`

**Propiedades**:
```typescript
interface GestionPagosProps {
  totalOrden: number;           // Total de la orden
  onPagosChange: (pagos: PagoItem[]) => void; // Callback cuando cambian los pagos
  pagosIniciales?: PagoItem[];  // Pagos previos (para edición)
}
```

**Características del Componente**:
- Agregar/eliminar métodos de pago dinámicamente
- Validación en tiempo real del monto total
- Cálculo automático del restante a pagar
- Cálculo automático de vueltas
- Campo de referencia opcional para pagos electrónicos
- Interfaz responsive y fácil de usar

## 🔄 Flujo de Operación

### Crear Orden con Pagos Múltiples

1. **Cliente realiza pedido** en el POS
2. **Avanza al paso de pago**
3. **Agrega métodos de pago**:
   - Clic en "+ Agregar Pago"
   - Selecciona método (Efectivo, Nequi, Daviplata)
   - Ingresa monto
   - Si es pago electrónico, puede agregar referencia
4. **Sistema valida**:
   - ✅ Total pagado >= Total orden
   - ✅ Máximo 3 métodos de pago
   - ✅ Cada pago tiene método y monto válido
5. **Guarda la orden**:
   - Crea registro en tabla `ordenes`
   - Crea registros individuales en `pagos_orden`
   - Actualiza stock de productos
   - Genera nota con detalle de pagos

### Ejemplo de Pagos

#### Escenario 1: Pago con un solo método
```json
{
  "total": 50000,
  "pagos": [
    {
      "metodo_pago": "EFECTIVO",
      "monto": 50000
    }
  ]
}
```

#### Escenario 2: Pago dividido (2 métodos)
```json
{
  "total": 50000,
  "pagos": [
    {
      "metodo_pago": "EFECTIVO",
      "monto": 30000
    },
    {
      "metodo_pago": "NEQUI",
      "monto": 20000,
      "referencia": "TRX123456"
    }
  ]
}
```

#### Escenario 3: Pago dividido (3 métodos)
```json
{
  "total": 100000,
  "pagos": [
    {
      "metodo_pago": "EFECTIVO",
      "monto": 40000
    },
    {
      "metodo_pago": "NEQUI",
      "monto": 35000,
      "referencia": "NEQ789"
    },
    {
      "metodo_pago": "DAVIPLATA",
      "monto": 25000,
      "referencia": "DV456"
    }
  ]
}
```

## 📊 Endpoints API

### POST /api/ordenes
**Crear orden con pagos múltiples**

```typescript
{
  sucursalId: string;
  tipoOrden: "LOCAL" | "LLEVAR" | "DOMICILIO";
  items: OrderItem[];
  total: number;
  metodoPago: string; // Campo legacy (usa el primer pago)
  pagos: [  // 🆕 Array de pagos
    {
      metodo_pago: "EFECTIVO" | "NEQUI" | "DAVIPLATA";
      monto: number;
      referencia?: string;
      notas?: string;
    }
  ];
  // ... otros campos
}
```

**Validaciones**:
- ✅ Máximo 3 métodos de pago
- ✅ Total pagado >= Total orden
- ✅ Cada pago debe tener método y monto válido

### GET /api/ordenes
**Listar órdenes con información de pagos**

Retorna órdenes incluyendo:
```typescript
{
  success: true,
  ordenes: [
    {
      id: string;
      total: number;
      // ... otros campos
      pagos_orden: [
        {
          id: string;
          metodo_pago: string;
          monto: number;
          referencia: string;
          creado_en: Date;
        }
      ]
    }
  ]
}
```

### GET /api/ordenes/[id]
**Obtener detalle de orden con pagos**

Incluye información completa de los pagos:
```typescript
{
  success: true,
  orden: {
    id: string;
    total: number;
    // ... otros campos
    pagos_orden: [
      {
        id: string;
        metodo_pago: string;
        monto: number;
        referencia: string;
        notas: string;
        creado_en: Date;
        usuario: {
          id: string;
          nombre_completo: string;
        }
      }
    ]
  }
}
```

## 🎨 Interfaz de Usuario

### Pantalla de Pago

**Sección de Métodos de Pago**:
- Header con título y botón "Agregar Pago"
- Lista de pagos configurados con:
  - Selector de método de pago
  - Campo de monto
  - Campo de referencia (solo para pagos electrónicos)
  - Botón eliminar (si hay más de un pago)
- Resumen en tiempo real:
  - Total de la orden
  - Total pagado
  - Falta por pagar (si aplica)
  - Vueltas (si aplica)

**Estados Visuales**:
- 🟢 **Verde**: Pago completo o con vueltas
- 🟠 **Naranja**: Falta dinero por pagar
- 🔵 **Azul**: Máximo de pagos alcanzado

## 📝 Registro de Pagos en Notas

Los pagos se registran en el campo `notas` de la orden con el siguiente formato:

```
EFECTIVO: $30.000 | NEQUI: $20.000 (Ref: TRX123) | Total pagado: $50.000
```

Si hay vueltas:
```
EFECTIVO: $60.000 | Total pagado: $60.000 | Vueltas: $10.000
```

## 🛡️ Validaciones y Seguridad

### Validaciones Frontend (POS)
1. ✅ Al menos un método de pago configurado
2. ✅ Máximo 3 métodos de pago
3. ✅ Cada pago tiene método y monto válido
4. ✅ Total pagado >= Total orden
5. ✅ Advertencia visual si falta dinero

### Validaciones Backend (API)
1. ✅ Verificar que no haya más de 3 pagos
2. ✅ Validar que el total pagado cubra el total
3. ✅ Validar que cada pago tenga datos completos
4. ✅ Transacción atómica (orden + pagos)
5. ✅ Registrar usuario que creó cada pago

## 🔍 Consultas Útiles

### Ver pagos de una orden específica
```sql
SELECT 
  p.*,
  u.nombre_completo as registrado_por
FROM pagos_orden p
LEFT JOIN usuarios u ON p.creado_por = u.id
WHERE p.orden_id = 'orden-id';
```

### Reportes de pagos por método
```sql
SELECT 
  metodo_pago,
  COUNT(*) as cantidad_pagos,
  SUM(monto) as total_monto
FROM pagos_orden
WHERE DATE(creado_en) = CURRENT_DATE
GROUP BY metodo_pago;
```

### Órdenes con pagos múltiples
```sql
SELECT 
  o.id,
  o.total,
  COUNT(p.id) as cantidad_metodos,
  array_agg(p.metodo_pago) as metodos_usados,
  SUM(p.monto) as total_pagado
FROM ordenes o
JOIN pagos_orden p ON o.id = p.orden_id
WHERE DATE(o.creado_en) = CURRENT_DATE
GROUP BY o.id, o.total
HAVING COUNT(p.id) > 1;
```

## 📱 Casos de Uso

### Caso 1: Cliente paga con efectivo y Nequi
1. Total de la orden: $75.000
2. Cliente tiene $50.000 en efectivo
3. Completa con $25.000 por Nequi
4. Sistema registra ambos pagos
5. Genera comprobante detallado

### Caso 2: Cliente paga con vueltas
1. Total de la orden: $42.000
2. Cliente paga $50.000 en efectivo
3. Sistema calcula vueltas: $8.000
4. Muestra vueltas en pantalla
5. Registra en notas de la orden

### Caso 3: Pago dividido entre 3 personas
1. Total: $120.000
2. Persona 1: $40.000 efectivo
3. Persona 2: $40.000 Nequi
4. Persona 3: $40.000 Daviplata
5. Sistema valida y registra los 3 pagos

## 🎯 Beneficios del Sistema

1. **Flexibilidad Total**: Acepta cualquier combinación de métodos de pago
2. **Mayor Liquidez**: Facilita recibir pagos de clientes con poco efectivo
3. **Registro Detallado**: Auditoría completa de cada transacción
4. **Reducción de Errores**: Validaciones automáticas previenen errores de cobro
5. **Mejor Experiencia**: Cliente puede pagar como prefiera
6. **Reportes Precisos**: Datos detallados para análisis financiero

## 🔄 Migración desde Sistema Anterior

El sistema mantiene retrocompatibilidad:
- Campo `metodo_pago` en `ordenes` se mantiene (usa primer método)
- Órdenes antiguas sin registros en `pagos_orden` siguen funcionando
- Al editar orden antigua, se puede migrar a pagos múltiples

---

**Desarrollado para Ricuras del Huila - Sistema POS**
*Sistema completo de pagos múltiples para flexibilidad total en cobros*
