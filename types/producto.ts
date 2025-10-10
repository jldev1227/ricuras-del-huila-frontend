// types/producto.ts
import type { Prisma } from "@prisma/client";

// Tipo de Producto con la relación de categoría incluida
export type ProductoConCategoria = Prisma.ProductoGetPayload<{
  include: {
    categoria: true;
  };
}>;

// Tipo de Categoría
export type Categoria = Prisma.CategoriaGetPayload<{
  select: {
    id: true;
    nombre: true;
    icono: true;
    orden: true;
    activo: true;
  };
}>;
