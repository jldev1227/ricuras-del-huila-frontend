import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sucursales = await prisma.sucursales.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({
      success: true,
      sucursales,
    });
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return NextResponse.json(
      { message: "Error al obtener sucursales" },
      { status: 500 },
    );
  }
}
