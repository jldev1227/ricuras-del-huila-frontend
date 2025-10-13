/*
  Warnings:

  - You are about to drop the column `activo` on the `sucursales` table. All the data in the column will be lost.
  - You are about to drop the column `sucursal_id` on the `usuarios` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."usuarios" DROP CONSTRAINT "usuarios_sucursal_id_fkey";

-- AlterTable
ALTER TABLE "sucursales" DROP COLUMN "activo";

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "sucursal_id";
