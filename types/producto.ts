// types/producto.ts
import type { Prisma } from "@prisma/client";

// Tipo de Producto con la relación de categoría incluida
export type ProductoConCategoria = Prisma.productosGetPayload<{
  include: {
    categorias: true;
  };
}>;

// Tipo de Categoría
export type Categoria = Prisma.categoriasGetPayload<{
  select: {
    id: true;
    nombre: true;
    icono: true;
    orden: true;
    activo: true;
  };
}>;
