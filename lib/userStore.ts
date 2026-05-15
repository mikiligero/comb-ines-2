"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserState = {
  name: string;
  email: string;
  setUser: (u: { name: string; email: string }) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: "Ana",
      email: "ana@combines.app",
      setUser: (u) => set(u),
    }),
    { name: "combines:user" }
  )
);
