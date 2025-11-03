-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "controlar_stock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stock_actual" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock_maximo" INTEGER,
ADD COLUMN     "stock_minimo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unidad_medida" TEXT NOT NULL DEFAULT 'unidad';

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "producto_id" UUID NOT NULL,
    "tipo_movimiento" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stock_anterior" INTEGER NOT NULL,
    "stock_nuevo" INTEGER NOT NULL,
    "motivo" TEXT,
    "referencia" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
