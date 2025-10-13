import { existsSync, mkdirSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se recibió ningún archivo" },
        { status: 400 },
      );
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP",
        },
        { status: 400 },
      );
    }

    // Validar tamaño de archivo (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "El archivo es demasiado grande. Máximo 5MB" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), "public", "productos");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, "_").toLowerCase();
    const fileExtension = originalName.split(".").pop();
    const fileName = `${timestamp}_${originalName.split(".").slice(0, -1).join(".")}.${fileExtension}`;

    // Guardar archivo
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Retornar la ruta relativa para guardar en la base de datos
    const relativePath = `/productos/${fileName}`;

    return NextResponse.json({
      success: true,
      imagePath: relativePath,
      message: "Imagen subida exitosamente",
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get("path");

    if (!imagePath) {
      return NextResponse.json(
        { success: false, error: "No se especificó la ruta de la imagen" },
        { status: 400 },
      );
    }

    // Construir la ruta completa al archivo
    const fullPath = join(process.cwd(), "public", imagePath);

    // Verificar si el archivo existe antes de intentar eliminarlo
    if (existsSync(fullPath)) {
      await unlink(fullPath);
      return NextResponse.json({
        success: true,
        message: "Imagen eliminada exitosamente",
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "La imagen ya no existe",
      });
    }
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
