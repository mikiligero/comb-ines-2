"use server";

import { revalidatePath } from "next/cache";
import { and, eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workouts } from "@/lib/schema";
import type { WorkoutSession } from "@/lib/types";

function toWorkout(r: typeof workouts.$inferSelect): WorkoutSession {
  return {
    id: r.id,
    routineId: r.routineId ?? "",
    routineName: r.routineNameSnapshot ?? "Sesión libre",
    date: (r.startedAt?.toISOString() ?? "").slice(0, 10),
    duration: r.durationSec ?? 0,
    jumps: r.jumps ?? 0,
    avgHr: r.avgHr ?? 0,
    calories: r.calories ?? 0,
    ropes: r.ropes ?? [],
    completed: r.completed ?? false,
  };
}

async function userId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}

export async function getWorkouts(): Promise<WorkoutSession[]> {
  const uid = await userId();
  const rows = await db.select().from(workouts).where(eq(workouts.userId, uid)).orderBy(desc(workouts.startedAt));
  return rows.map(toWorkout);
}

export async function saveWorkout(session: Omit<WorkoutSession, "id">): Promise<WorkoutSession> {
  const uid = await userId();
  const now = new Date();
  const startedAt = new Date(now.getTime() - session.duration * 1000);

  const [row] = await db.insert(workouts).values({
    userId: uid,
    routineId: session.routineId || null,
    routineNameSnapshot: session.routineName,
    startedAt,
    endedAt: now,
    durationSec: session.duration,
    jumps: session.jumps,
    avgHr: session.avgHr || null,
    calories: session.calories || null,
    ropes: session.ropes,
    completed: session.completed,
  }).returning();

  revalidatePath("/history");
  revalidatePath("/stats");
  return toWorkout(row);
}

export async function deleteWorkout(id: string): Promise<void> {
  const uid = await userId();
  await db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.userId, uid)));
  revalidatePath("/history");
  revalidatePath("/stats");
  revalidatePath("/dashboard");
}
