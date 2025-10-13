-- DropForeignKey
ALTER TABLE "public"."mesas" DROP CONSTRAINT "mesas_sucursal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orden_items" DROP CONSTRAINT "orden_items_orden_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orden_items" DROP CONSTRAINT "orden_items_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ordenes" DROP CONSTRAINT "ordenes_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ordenes" DROP CONSTRAINT "ordenes_mesa_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ordenes" DROP CONSTRAINT "ordenes_mesero_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ordenes" DROP CONSTRAINT "ordenes_sucursal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."password_resets" DROP CONSTRAINT "password_resets_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."productos" DROP CONSTRAINT "productos_categoria_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sesiones" DROP CONSTRAINT "sesiones_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."usuarios" DROP CONSTRAINT "usuarios_sucursal_id_fkey";

-- DropIndex
DROP INDEX "public"."categorias_nombre_key";

-- DropIndex
DROP INDEX "public"."clientes_correo_idx";

-- DropIndex
DROP INDEX "public"."clientes_numero_identificacion_idx";

-- DropIndex
DROP INDEX "public"."clientes_numero_identificacion_key";

-- DropIndex
DROP INDEX "public"."clientes_telefono_idx";

-- DropIndex
DROP INDEX "public"."mesas_disponible_idx";

-- DropIndex
DROP INDEX "public"."mesas_numero_sucursal_id_key";

-- DropIndex
DROP INDEX "public"."mesas_sucursal_id_idx";

-- DropIndex
DROP INDEX "public"."orden_items_orden_id_idx";

-- DropIndex
DROP INDEX "public"."orden_items_producto_id_idx";

-- DropIndex
DROP INDEX "public"."ordenes_cliente_id_idx";

-- DropIndex
DROP INDEX "public"."ordenes_estado_idx";

-- DropIndex
DROP INDEX "public"."ordenes_mesa_id_idx";

-- DropIndex
DROP INDEX "public"."ordenes_mesero_id_idx";

-- DropIndex
DROP INDEX "public"."ordenes_sincronizado_idx";

-- DropIndex
DROP INDEX "public"."ordenes_sucursal_id_idx";

-- DropIndex
DROP INDEX "public"."ordenes_tipo_orden_idx";

-- DropIndex
DROP INDEX "public"."password_resets_otp_idx";

-- DropIndex
DROP INDEX "public"."password_resets_usuario_id_idx";

-- DropIndex
DROP INDEX "public"."productos_categoria_id_idx";

-- DropIndex
DROP INDEX "public"."productos_disponible_idx";

-- DropIndex
DROP INDEX "public"."sesiones_refresh_token_key";

-- DropIndex
DROP INDEX "public"."sesiones_token_idx";

-- DropIndex
DROP INDEX "public"."sesiones_token_key";

-- DropIndex
DROP INDEX "public"."sesiones_usuario_id_idx";

-- DropIndex
DROP INDEX "public"."usuarios_correo_key";

-- AlterTable
ALTER TABLE "productos" ALTER COLUMN "actualizado_en" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "configuracion_empresa" (
    "id" UUID NOT NULL,
    "nit" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "departamento" TEXT,
    "codigo_postal" TEXT,
    "regimen_fiscal" "regimenes_fiscales",
    "tipo_persona" "tipos_persona" NOT NULL DEFAULT 'JURIDICA',
    "numero_resolucion" TEXT,
    "fecha_resolucion" TIMESTAMP(3),
    "numeracion_desde" TEXT,
    "numeracion_hasta" TEXT,
    "prefijo_factura" TEXT,
    "consecutivo_actual" INTEGER NOT NULL DEFAULT 1,
    "logo_url" TEXT,
    "sitio_web" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "creado_por" UUID,

    CONSTRAINT "configuracion_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_empresa_nit_key" ON "configuracion_empresa"("nit");

-- AddForeignKey
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orden_items" ADD CONSTRAINT "orden_items_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orden_items" ADD CONSTRAINT "orden_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_mesero_id_fkey" FOREIGN KEY ("mesero_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "configuracion_empresa" ADD CONSTRAINT "configuracion_empresa_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
