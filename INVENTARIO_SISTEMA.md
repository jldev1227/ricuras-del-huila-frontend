# 📦 Sistema de Inventario - Ricuras del Huila

## 📋 ¿Cómo funciona actualmente?

El sistema **NO maneja inventario por cantidades**, sino por **disponibilidad**:

### ✅ Estado Actual del Sistema
- **Productos Disponibles**: Se pueden vender (aparecen en el POS)
- **Productos No Disponibles**: NO se pueden vender (no aparecen en el POS)

## 🔧 ¿Cómo gestionar el inventario?

### 📍 **Ubicación: POS → Productos**
1. Ve a **POS** en el menú principal
2. Haz clic en **"Gestión de Productos"**
3. Busca el producto que quieres gestionar

### 🎛️ **Controles de Disponibilidad**

#### ✅ Para Marcar como DISPONIBLE:
- ✅ Activa la casilla **"Producto disponible"**
- El producto aparecerá en el POS para las ventas

#### ❌ Para Marcar como NO DISPONIBLE:
- ❌ Desactiva la casilla **"Producto disponible"**  
- El producto se oculta del POS (no se puede vender)

## 🍽️ **Casos de Uso Comunes**

### 🥘 **Se acabó un plato del día**
```
1. POS → Productos
2. Buscar "Lechona" 
3. ❌ Desactivar "Producto disponible"
4. ✅ Guardar cambios
```

### 🧄 **Se acabó un ingrediente**
```
1. POS → Productos  
2. Buscar todos los platos que usen ese ingrediente
3. ❌ Desactivar "Producto disponible" en cada uno
4. ✅ Guardar cambios
```

### 🛒 **Llegó mercancía nueva**
```
1. POS → Productos
2. Buscar los productos que llegaron
3. ✅ Activar "Producto disponible"
4. ✅ Guardar cambios
```

## 💡 **Consejos para el Personal**

### 👨‍🍳 **Para Cocineros**
- Comunica al administrador qué productos se están agotando
- Informa cuando se terminen completamente los ingredientes

### 👨‍💼 **Para Administradores**
- Revisa diariamente los productos disponibles
- Actualiza el estado según el inventario físico
- Usa las **notas** del producto para recordatorios

### 🍕 **Para Meseros**
- Si un producto no aparece en el POS, está agotado
- Consulta con cocina sobre alternativas similares

## 🔍 **¿Cómo ver qué está disponible?**

### 📱 **En el POS (Pantalla de Ventas)**
- Solo aparecen productos DISPONIBLES
- Los no disponibles están ocultos automáticamente

### 🗂️ **En Gestión de Productos**
- ✅ **Verde**: Producto disponible  
- ❌ **Gris**: Producto no disponible
- 🔍 **Filtrar por**: "Solo disponibles" o "Solo no disponibles"

## ⚙️ **Configuraciones Adicionales**

### ⭐ **Productos Destacados**
- Marca productos como **"Destacado"** para promociones
- Aparecen primero en el POS

### 🏷️ **Por Categorías**
- Organiza por: Platos Típicos, Bebidas, Postres, etc.
- Fácil navegación en el POS

## 🔄 **Flujo Diario Recomendado**

### 🌅 **Al Abrir (Mañana)**
```
1. Revisar inventario físico
2. Activar productos disponibles
3. Desactivar productos agotados
4. Verificar en el POS que todo esté correcto
```

### 🌙 **Al Cerrar (Noche)**
```
1. Revisar qué se vendió mucho
2. Marcar como no disponible lo que se agotó
3. Preparar lista de compras para mañana
```

## ❓ **Preguntas Frecuentes**

### **P: ¿Por qué no aparece un producto en el POS?**
**R:** Está marcado como "No disponible". Ve a Productos y actívalo.

### **P: ¿Puedo saber cuántas unidades quedan?**
**R:** No, el sistema actual es solo disponible/no disponible. Debes controlar las cantidades físicamente.

### **P: ¿Puedo añadir notas a los productos?**
**R:** Sí, en el formulario de edición hay un campo de "Notas" para recordatorios.

### **P: ¿Se puede automatizar?**
**R:** En el futuro se puede implementar un sistema de cantidades, por ahora es manual.

---

## 🛠️ **Para Desarrolladores**

### 🗃️ **Esquema Actual (Base de Datos)**
```sql
productos {
  id: string
  nombre: string
  precio: number
  disponible: boolean  ← Control principal
  destacado: boolean   ← Para promociones
  // NO hay campo "stock" o "cantidad"
}
```

### 🔮 **Mejoras Futuras Sugeridas**
1. **Campo stock (cantidad numérica)**
2. **Alertas de stock mínimo**
3. **Historial de movimientos**
4. **Integración con proveedores**
5. **Códigos de barras**

---

**💡 ¿Necesitas ayuda?** Contacta al administrador del sistema o revisa este documento.