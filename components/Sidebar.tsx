"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, List, Play, Clock, BarChart2,
  Link2, Zap, LogOut, type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/userStore";
import ProfileModal from "@/components/ProfileModal";
import { logout } from "@/lib/actions/auth";

type NavItem  = { Icon: React.ComponentType<LucideProps>; label: string; href: string };
type NavGroup = { section?: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    items: [
      { Icon: Home,     label: "Dashboard",    href: "/dashboard" },
      { Icon: List,     label: "Rutinas",      href: "/routines" },
      { Icon: Play,     label: "Entrenar",      href: "/workout" },
    ],
  },
  {
    section: "Tracking",
    items: [
      { Icon: Clock,    label: "Histórico",    href: "/history" },
      { Icon: BarChart2,label: "Estadísticas", href: "/stats" },
    ],
  },
  {
    section: "Librería",
    items: [
      { Icon: Link2,    label: "Cuerdas",      href: "/library/ropes" },
      { Icon: Zap,      label: "Saltos",       href: "/library/exercises" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);
  const { name, email } = useUserStore();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <aside
        className="hidden min-[900px]:flex flex-col gap-1"
        style={{ padding: "20px 14px", background: "var(--bg-1)", borderRight: "1px solid var(--line-c)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-[10px]" style={{ padding: "6px 10px 22px" }}>
          <div
            className="font-mono font-bold text-[14px]"
            style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", color: "var(--accent-ink)", display: "grid", placeItems: "center" }}
          >
            ⌇
          </div>
          <div className="font-bold text-[18px]" style={{ letterSpacing: "-0.02em" }}>
            Comb<span style={{ color: "var(--fg-2)", fontWeight: 500 }}>-</span>ines
          </div>
        </div>

        {/* Nav groups */}
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <div
                className="font-mono uppercase"
                style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--fg-3)", padding: "14px 10px 6px" }}
              >
                {group.section}
              </div>
            )}
            {group.items.map(({ Icon, label, href }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-[10px] px-[10px] py-[9px] w-full no-underline",
                    "text-[14px] font-medium transition-colors duration-150 rounded-[8px]",
                    active ? "text-fg" : "text-fg-1 hover:bg-bg-2 hover:text-fg"
                  )}
                  style={{ background: active ? "var(--bg-2)" : undefined }}
                >
                  {active && (
                    <span
                      className="absolute"
                      style={{ left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 14, background: "var(--accent)", borderRadius: 2 }}
                    />
                  )}
                  <Icon size={16} className="flex-none" style={{ color: active ? "var(--fg)" : "var(--fg-2)" }} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}

        <div className="flex-1" />

        {/* User card — clickable, opens ProfileModal */}
        <button
          onClick={() => setShowProfile(true)}
          title="Ver perfil"
          style={{
            appearance: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
            padding: 10, borderRadius: 8, width: "100%",
            border: "1px solid var(--line-c)", background: "var(--bg-2)",
            fontFamily: "inherit", color: "inherit", textAlign: "left",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-2)")}
        >
          {/* Avatar */}
          <div
            className="font-semibold text-[13px] flex-none"
            style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-3)", color: "var(--fg-1)", display: "grid", placeItems: "center" }}
          >
            {(name[0] ?? "?").toUpperCase()}
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[13px] truncate" style={{ lineHeight: 1.2 }}>{name}</div>
            <div className="text-[11px]" style={{ color: "var(--fg-2)" }}>{email}</div>
          </div>

          {/* Logout — stops propagation so it doesn't open ProfileModal */}
          <span
            role="button"
            title="Cerrar sesión"
            onClick={e => {
              e.stopPropagation();
              logout();
            }}
            style={{
              flex: "none", padding: 9, borderRadius: 8,
              color: "var(--fg-2)", display: "grid", placeItems: "center",
              transition: "background 0.1s ease",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--line-c)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <LogOut size={14} />
          </span>
        </button>
      </aside>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
