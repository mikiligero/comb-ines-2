"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { routines, routineBlocks, routineItems } from "@/lib/schema";
import type { Routine, RoutineBlock, RoutineItem } from "@/lib/types";

type ItemWithExercise = typeof routineItems.$inferSelect & {
  exercise: typeof import("@/lib/schema").exercises.$inferSelect | null;
};

type BlockWithItems = typeof routineBlocks.$inferSelect & {
  routineItems: ItemWithExercise[];
};

type RoutineWithBlocks = typeof routines.$inferSelect & {
  routineBlocks: BlockWithItems[];
};

function toRoutine(r: RoutineWithBlocks): Routine {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    createdAt: (r.createdAt?.toISOString() ?? "").slice(0, 10),
    transitionSec: r.transitionSec,
    blocks: (r.routineBlocks ?? [])
      .sort((a, b) => a.position - b.position)
      .map((b): RoutineBlock => ({
        letter: b.letter,
        ropeId: b.ropeId,
        items: (b.routineItems ?? [])
          .sort((a, b) => a.position - b.position)
          .map((item): RoutineItem => ({
            kind: item.kind as "ex" | "rest",
            exId: item.exerciseId ?? undefined,
            exName: item.exercise?.name ?? undefined,
            mode: (item.mode as "time" | "reps") ?? undefined,
            value: item.value,
          })),
      })),
  };
}

async function userId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}

export async function getRoutines(): Promise<Routine[]> {
  const uid = await userId();
  const rows = await db.query.routines.findMany({
    where: eq(routines.userId, uid),
    orderBy: [asc(routines.createdAt)],
    with: {
      routineBlocks: {
        with: { routineItems: { with: { exercise: true } } },
      },
    },
  });
  return (rows as RoutineWithBlocks[]).map(toRoutine);
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const uid = await userId();
  const row = await db.query.routines.findFirst({
    where: and(eq(routines.id, id), eq(routines.userId, uid)),
    with: {
      routineBlocks: {
        with: { routineItems: { with: { exercise: true } } },
      },
    },
  });
  if (!row) return null;
  return toRoutine(row as RoutineWithBlocks);
}

export async function saveRoutine(routine: Routine): Promise<string> {
  const uid = await userId();
  let routineId = routine.id;

  if (!routineId || routineId.startsWith("new-")) {
    const [row] = await db.insert(routines).values({
      userId: uid,
      name: routine.name,
      description: routine.description,
      transitionSec: routine.transitionSec,
    }).returning({ id: routines.id });
    routineId = row.id;
  } else {
    await db.update(routines)
      .set({ name: routine.name, description: routine.description, transitionSec: routine.transitionSec, updatedAt: new Date() })
      .where(and(eq(routines.id, routineId), eq(routines.userId, uid)));

    await db.delete(routineBlocks).where(eq(routineBlocks.routineId, routineId));
  }

  for (let bi = 0; bi < routine.blocks.length; bi++) {
    const block = routine.blocks[bi];
    const [blockRow] = await db.insert(routineBlocks).values({
      routineId,
      ropeId: block.ropeId,
      letter: block.letter,
      position: bi,
    }).returning({ id: routineBlocks.id });

    if (block.items.length > 0) {
      await db.insert(routineItems).values(
        block.items.map((item, pi) => ({
          blockId: blockRow.id,
          position: pi,
          kind: item.kind,
          exerciseId: item.exId ?? null,
          mode: item.mode ?? null,
          value: item.value,
        }))
      );
    }
  }

  revalidatePath("/routines");
  return routineId;
}

export async function deleteRoutine(id: string) {
  const uid = await userId();
  await db.delete(routines).where(and(eq(routines.id, id), eq(routines.userId, uid)));
  revalidatePath("/routines");
}
