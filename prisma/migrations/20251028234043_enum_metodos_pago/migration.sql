/*
  Warnings:

  - The values [TARJETA,TRANSFERENCIA] on the enum `metodos_pago` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "metodos_pago_new" AS ENUM ('EFECTIVO', 'NEQUI', 'DAVIPLATA');
ALTER TABLE "public"."ordenes" ALTER COLUMN "metodo_pago" DROP DEFAULT;
ALTER TABLE "ordenes" ALTER COLUMN "metodo_pago" TYPE "metodos_pago_new" USING ("metodo_pago"::text::"metodos_pago_new");
ALTER TYPE "metodos_pago" RENAME TO "metodos_pago_old";
ALTER TYPE "metodos_pago_new" RENAME TO "metodos_pago";
DROP TYPE "public"."metodos_pago_old";
ALTER TABLE "ordenes" ALTER COLUMN "metodo_pago" SET DEFAULT 'EFECTIVO';
COMMIT;
