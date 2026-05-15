"use server";

import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { seedUserData } from "@/lib/seed";

export async function login(email: string, password: string) {
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" };
    }
    throw err;
  }
}

export async function signup(email: string, password: string, name: string) {
  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email)).limit(1);
  if (existing.length > 0) return { error: "Ya existe una cuenta con ese email" };

  const passwordHash = await bcrypt.hash(password, 12);
  const [profile] = await db.insert(profiles).values({
    email,
    passwordHash,
    name: name.trim() || email.split("@")[0],
  }).returning({ id: profiles.id });

  await seedUserData(profile.id);

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { error: "Cuenta creada, pero no se pudo iniciar sesión" };
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function updateProfileName(name: string) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  await db.update(profiles).set({ name: name.trim() }).where(eq(profiles.id, session.user.id));
}
