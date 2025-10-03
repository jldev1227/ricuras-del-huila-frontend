/*
  Warnings:

  - Added the required column `mesa_id` to the `ordenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sucursal_id` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "mesa_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "sucursal_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "sucursales" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesas" (
    "id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 4,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "sucursal_id" UUID NOT NULL,
    "ubicacion" TEXT,
    "notas" TEXT,
    "ultima_limpieza" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mesas_sucursal_id_idx" ON "mesas"("sucursal_id");

-- CreateIndex
CREATE INDEX "mesas_disponible_idx" ON "mesas"("disponible");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_numero_sucursal_id_key" ON "mesas"("numero", "sucursal_id");

-- CreateIndex
CREATE INDEX "ordenes_mesa_id_idx" ON "ordenes"("mesa_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
