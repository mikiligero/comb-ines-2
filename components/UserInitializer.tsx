"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/userStore";

export default function UserInitializer({ name, email }: { name: string; email: string }) {
  const setUser = useUserStore(s => s.setUser);
  useEffect(() => {
    setUser({ name, email });
  }, [name, email, setUser]);
  return null;
}
