"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exercises } from "@/lib/schema";
import type { Exercise } from "@/lib/types";

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
