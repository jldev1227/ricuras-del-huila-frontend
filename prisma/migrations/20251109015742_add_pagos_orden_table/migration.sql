-- CreateTable
CREATE TABLE "pagos_orden" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orden_id" UUID NOT NULL,
    "metodo_pago" "metodos_pago" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_orden_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pagos_orden" ADD CONSTRAINT "pagos_orden_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagos_orden" ADD CONSTRAINT "pagos_orden_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
