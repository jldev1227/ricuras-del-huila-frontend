-- DropForeignKey
ALTER TABLE "public"."ordenes" DROP CONSTRAINT "ordenes_mesero_id_fkey";

-- AlterTable
ALTER TABLE "ordenes" ALTER COLUMN "mesero_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_mesero_id_fkey" FOREIGN KEY ("mesero_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
