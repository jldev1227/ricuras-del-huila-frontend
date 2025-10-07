/*
  Warnings:

  - Added the required column `sucursal_id` to the `ordenes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "sucursal_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "ordenes_sucursal_id_idx" ON "ordenes"("sucursal_id");

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
