-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "actualizado_por" UUID,
ADD COLUMN     "creado_por" UUID;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_actualizado_por_fkey" FOREIGN KEY ("actualizado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
