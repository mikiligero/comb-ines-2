"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { tmpdir } from "os";
import path from "path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exercises } from "@/lib/schema";
import type { Exercise } from "@/lib/types";

const execFileAsync = promisify(execFile);

function toExercise(r: typeof exercises.$inferSelect): Exercise {
  return { id: r.id, name: r.name };
}

async function userId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}

export async function getExercises(): Promise<Exercise[]> {
  const uid = await userId();
  const rows = await db.select().from(exercises).where(eq(exercises.userId, uid)).orderBy(asc(exercises.name));
  return rows.map(toExercise);
}

export async function createExercise(name: string): Promise<Exercise> {
  const uid = await userId();
  const [row] = await db.insert(exercises).values({ userId: uid, name }).returning();
  revalidatePath("/library/exercises");
  return toExercise(row);
}

export async function updateExercise(data: Exercise): Promise<Exercise> {
  const uid = await userId();
  const [row] = await db.update(exercises)
    .set({ name: data.name })
    .where(and(eq(exercises.id, data.id), eq(exercises.userId, uid)))
    .returning();
  revalidatePath("/library/exercises");
  return toExercise(row);
}

export async function deleteExercise(id: string) {
  const uid = await userId();
  await db.delete(exercises).where(and(eq(exercises.id, id), eq(exercises.userId, uid)));
  revalidatePath("/library/exercises");
}

export async function uploadExercisePhoto(formData: FormData, exName: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await userId();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Archivo no válido" };
  if (!file.type.startsWith("image/")) return { ok: false, error: "El archivo debe ser una imagen" };

  const slug = exName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!slug) return { ok: false, error: "Nombre de ejercicio inválido" };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());

  const dir = path.join(process.cwd(), "public", "exercises");
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const outPath = path.join(dir, `${slug}.jpg`);

  if (ext === "jpg" || ext === "jpeg") {
    await writeFile(outPath, bytes);
  } else {
    const tmpPath = path.join(tmpdir(), `ex-photo-${Date.now()}.${ext || "png"}`);
    await writeFile(tmpPath, bytes);
    try {
      await execFileAsync("ffmpeg", ["-y", "-i", tmpPath, "-vframes", "1", outPath]);
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
  }

  revalidatePath("/library/exercises");
  return { ok: true };
}

export async function uploadExerciseVideo(formData: FormData, exName: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await userId(); // auth check

  const file = formData.get("video");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Archivo no válido" };

  const slug = exName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!slug) return { ok: false, error: "Nombre de ejercicio inválido" };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());

  const dir = path.join(process.cwd(), "public", "exercises");
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const outPath = path.join(dir, `${slug}.mp4`);

  if (ext === "mp4") {
    await writeFile(outPath, bytes);
  } else {
    const tmpPath = path.join(tmpdir(), `ex-upload-${Date.now()}.${ext || "mov"}`);
    await writeFile(tmpPath, bytes);
    try {
      await execFileAsync("ffmpeg", [
        "-y", "-i", tmpPath,
        "-vcodec", "h264", "-acodec", "aac", "-movflags", "+faststart",
        outPath,
      ]);
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
  }

  revalidatePath("/library/exercises");
  return { ok: true };
}
