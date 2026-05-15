"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  List,
  Play,
  Clock,
  BarChart2,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  Icon: React.ComponentType<LucideProps>;
  label: string;
  href: string;
};

const TABS: Tab[] = [
  { Icon: Home,      label: "Home",    href: "/dashboard" },
  { Icon: List,      label: "Rutinas", href: "/routines" },
  { Icon: Play,      label: "Saltar",  href: "/workout" },
  { Icon: Clock,     label: "Hist.",   href: "/history" },
  { Icon: BarChart2, label: "Stats",   href: "/stats" },
];

export default function Tabbar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav
      className="min-[900px]:hidden"
      style={{
        position: "fixed",
        left: 8,
        right: 8,
        bottom: 8,
        display: "flex",
        background: "var(--bg-1)",
        border: "1px solid var(--line-c)",
        borderRadius: "var(--radius-lg)",
        padding: 6,
        gap: 2,
        zIndex: 30,
        boxShadow: "0 6px 24px rgba(0,0,0,.18)",
      }}
    >
      {TABS.map(({ Icon, label, href }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-[2px] no-underline",
              "text-[10px] font-semibold",
              "py-[8px] rounded-[10px] transition-colors duration-100",
              active
                ? "text-fg"
                : "text-fg-2"
            )}
            style={{ background: active ? "var(--bg-2)" : "transparent" }}
          >
            <Icon
              size={18}
              style={{ color: active ? "var(--accent)" : "inherit" }}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
