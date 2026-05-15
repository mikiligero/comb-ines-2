import {
  pgTable, uuid, text, integer, boolean,
  timestamp, unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name:         text("name").notNull().default(""),
  avatarUrl:    text("avatar_url"),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const ropes = pgTable("ropes", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  color:     text("color").notNull(),
  weightG:   integer("weight_g").notNull().default(0),
  ropeType:  text("rope_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const exercises = pgTable("exercises", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const routines = pgTable("routines", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name:          text("name").notNull(),
  description:   text("description").default(""),
  transitionSec: integer("transition_sec").notNull().default(15),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const routineBlocks = pgTable("routine_blocks", {
  id:        uuid("id").primaryKey().defaultRandom(),
  routineId: uuid("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
  ropeId:    uuid("rope_id").notNull().references(() => ropes.id),
  letter:    text("letter").notNull(),
  position:  integer("position").notNull(),
}, (t) => [unique().on(t.routineId, t.position)]);

export const routineItems = pgTable("routine_items", {
  id:         uuid("id").primaryKey().defaultRandom(),
  blockId:    uuid("block_id").notNull().references(() => routineBlocks.id, { onDelete: "cascade" }),
  position:   integer("position").notNull(),
  kind:       text("kind", { enum: ["ex", "rest"] }).notNull(),
  exerciseId: uuid("exercise_id").references(() => exercises.id),
  mode:       text("mode", { enum: ["time", "reps"] }),
  value:      integer("value").notNull(),
}, (t) => [unique().on(t.blockId, t.position)]);

export const workouts = pgTable("workouts", {
  id:                   uuid("id").primaryKey().defaultRandom(),
  userId:               uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  routineId:            uuid("routine_id").references(() => routines.id),
  routineNameSnapshot:  text("routine_name_snapshot"),
  startedAt:            timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt:              timestamp("ended_at", { withTimezone: true }),
  durationSec:          integer("duration_sec"),
  jumps:                integer("jumps").default(0),
  avgHr:                integer("avg_hr"),
  calories:             integer("calories"),
  ropes:                text("ropes").array().default([]),
  completed:            boolean("completed").default(false),
  notes:                text("notes"),
});

// ── Relations (for relational queries) ─────────────────────

export const routinesRelations = relations(routines, ({ many }) => ({
  routineBlocks: many(routineBlocks),
}));

export const routineBlocksRelations = relations(routineBlocks, ({ one, many }) => ({
  routine: one(routines, { fields: [routineBlocks.routineId], references: [routines.id] }),
  routineItems: many(routineItems),
}));

export const routineItemsRelations = relations(routineItems, ({ one }) => ({
  block: one(routineBlocks, { fields: [routineItems.blockId], references: [routineBlocks.id] }),
  exercise: one(exercises, { fields: [routineItems.exerciseId], references: [exercises.id] }),
}));
