-- CreateEnum
CREATE TYPE "roles" AS ENUM ('ADMINISTRADOR', 'MESERO');

-- CreateEnum
CREATE TYPE "estados_orden" AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'LISTA', 'ENTREGADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT,
    "password" TEXT NOT NULL,
    "rol" "roles" NOT NULL DEFAULT 'MESERO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultima_conexion" TIMESTAMP(3),
    "dispositivo_id" TEXT,
    "version_cache" INTEGER NOT NULL DEFAULT 1,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "dispositivo_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_uso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" UUID NOT NULL,
    "mesero_id" UUID NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "estados_orden" NOT NULL DEFAULT 'PENDIENTE',
    "sincronizado" BOOLEAN NOT NULL DEFAULT false,
    "creado_offline" BOOLEAN NOT NULL DEFAULT false,
    "sincronizado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_identificacion_key" ON "usuarios"("identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_token_key" ON "sesiones"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_refresh_token_key" ON "sesiones"("refresh_token");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones"("usuario_id");

-- CreateIndex
CREATE INDEX "sesiones_token_idx" ON "sesiones"("token");

-- CreateIndex
CREATE INDEX "ordenes_mesero_id_idx" ON "ordenes"("mesero_id");

-- CreateIndex
CREATE INDEX "ordenes_sincronizado_idx" ON "ordenes"("sincronizado");

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_mesero_id_fkey" FOREIGN KEY ("mesero_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
