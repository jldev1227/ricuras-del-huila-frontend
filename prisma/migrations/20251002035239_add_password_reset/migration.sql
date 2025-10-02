-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "otp" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_resets_otp_idx" ON "password_resets"("otp");

-- CreateIndex
CREATE INDEX "password_resets_usuario_id_idx" ON "password_resets"("usuario_id");

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
