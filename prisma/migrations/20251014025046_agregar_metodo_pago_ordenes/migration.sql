-- CreateEnum
CREATE TYPE "metodos_pago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "metodo_pago" "metodos_pago" DEFAULT 'EFECTIVO';
