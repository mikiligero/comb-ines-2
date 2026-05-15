"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ropes } from "@/lib/schema";
import type { Rope } from "@/lib/types";

function toRope(r: typeof ropes.$inferSelect): Rope {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    weight: r.weightG,
    type: r.ropeType ?? "",
    bought: (r.createdAt?.toISOString() ?? "").slice(0, 10),
  };
}

async function userId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}

export async function getRopes(): Promise<Rope[]> {
  const uid = await userId();
  const rows = await db.select().from(ropes).where(eq(ropes.userId, uid)).orderBy(asc(ropes.createdAt));
  return rows.map(toRope);
}

export async function createRope(data: { name: string; color: string; weight: number; type: string }): Promise<Rope> {
  const uid = await userId();
  const [row] = await db.insert(ropes).values({
    userId: uid,
    name: data.name,
    color: data.color,
    weightG: data.weight,
    ropeType: data.type || null,
  }).returning();
  revalidatePath("/library/ropes");
  return toRope(row);
}

export async function updateRope(data: Rope): Promise<Rope> {
  const uid = await userId();
  const [row] = await db.update(ropes)
    .set({ name: data.name, color: data.color, weightG: data.weight, ropeType: data.type || null })
    .where(and(eq(ropes.id, data.id), eq(ropes.userId, uid)))
    .returning();
  revalidatePath("/library/ropes");
  return toRope(row);
}
