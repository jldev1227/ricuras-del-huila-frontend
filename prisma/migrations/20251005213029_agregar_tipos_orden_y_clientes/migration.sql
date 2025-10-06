/*
  Warnings:

  - Added the required column `subtotal` to the `ordenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_orden` to the `ordenes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "tipos_identificacion" AS ENUM ('CC', 'CE', 'NIT', 'TI', 'PASAPORTE', 'DIE');

-- CreateEnum
CREATE TYPE "tipos_persona" AS ENUM ('NATURAL', 'JURIDICA');

-- CreateEnum
CREATE TYPE "regimenes_fiscales" AS ENUM ('SIMPLIFICADO', 'COMUN', 'GRAN_CONTRIBUYENTE', 'NO_RESPONSABLE');

-- CreateEnum
CREATE TYPE "tipos_orden" AS ENUM ('LOCAL', 'LLEVAR', 'DOMICILIO');

-- DropForeignKey
ALTER TABLE "public"."ordenes" DROP CONSTRAINT "ordenes_mesa_id_fkey";

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "cliente_id" UUID,
ADD COLUMN     "costo_adicional" DECIMAL(10,2),
ADD COLUMN     "costo_envio" DECIMAL(10,2),
ADD COLUMN     "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "direccion_entrega" TEXT,
ADD COLUMN     "hora_recogida" TIMESTAMP(3),
ADD COLUMN     "indicaciones_entrega" TEXT,
ADD COLUMN     "nombre_cliente" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "telefono_cliente" TEXT,
ADD COLUMN     "tipo_orden" "tipos_orden" NOT NULL,
ALTER COLUMN "mesa_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "tipo_identificacion" "tipos_identificacion",
    "numero_identificacion" TEXT,
    "digito_verificacion" TEXT,
    "tipo_persona" "tipos_persona",
    "regimen_fiscal" "regimenes_fiscales",
    "responsabilidad_fiscal" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "departamento" TEXT,
    "codigo_postal" TEXT,
    "notas_especiales" TEXT,
    "frecuente" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_numero_identificacion_key" ON "clientes"("numero_identificacion");

-- CreateIndex
CREATE INDEX "clientes_numero_identificacion_idx" ON "clientes"("numero_identificacion");

-- CreateIndex
CREATE INDEX "clientes_telefono_idx" ON "clientes"("telefono");

-- CreateIndex
CREATE INDEX "clientes_correo_idx" ON "clientes"("correo");

-- CreateIndex
CREATE INDEX "ordenes_cliente_id_idx" ON "ordenes"("cliente_id");

-- CreateIndex
CREATE INDEX "ordenes_tipo_orden_idx" ON "ordenes"("tipo_orden");

-- CreateIndex
CREATE INDEX "ordenes_estado_idx" ON "ordenes"("estado");

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
