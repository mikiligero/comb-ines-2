"use client";

import { useState } from "react";
import { fmtTime } from "@/lib/fmt";
import Topbar from "@/components/Topbar";
import type { WorkoutSession } from "@/lib/types";

type Range = "3m" | "6m" | "year";

function buildCells(workouts: WorkoutSession[], days: number) {
  const today = new Date();
  const histSet = new Map<string, number>();
  workouts.forEach(h => histSet.set(h.date, (histSet.get(h.date) ?? 0) + 1));
  const cells: { iso: string; l: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ iso, l: Math.min(4, histSet.get(iso) ?? 0) });
  }
  return cells;
}

function buildWeekly(workouts: WorkoutSession[]) {
  const today = new Date();
  return Array.from({ length: 12 }, (_, w) => {
    const end = new Date(today);
    end.setDate(end.getDate() - (11 - w) * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const sec = workouts
      .filter(h => { const d = new Date(h.date); return d >= start && d <= end; })
      .reduce((s, h) => s + h.duration, 0);
    return { sec };
  });
}

function calcStreak(workouts: WorkoutSession[]) {
  const dates = new Set(workouts.map(w => w.date));
  let streak = 0;
  const d = new Date();
  while (streak < 366) {
    const iso = d.toISOString().slice(0, 10);
    if (!dates.has(iso)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function calcMaxStreak(workouts: WorkoutSession[]) {
  const dates = [...new Set(workouts.map(w => w.date))].sort();
  if (dates.length === 0) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

function calcPRs(workouts: WorkoutSession[]) {
  if (workouts.length === 0) return [];
  const longest = workouts.reduce((m, h) => h.duration > m.duration ? h : m, workouts[0]);
  const mostJumps = workouts.reduce((m, h) => h.jumps > m.jumps ? h : m, workouts[0]);

  const weekMap = new Map<string, number>();
  workouts.forEach(h => {
    const d = new Date(h.date);
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = mon.toISOString().slice(0, 10);
    weekMap.set(key, (weekMap.get(key) ?? 0) + h.duration);
  });
  let bestWeekSec = 0, bestWeekKey = "";
  weekMap.forEach((sec, key) => { if (sec > bestWeekSec) { bestWeekSec = sec; bestWeekKey = key; } });

  const maxStreak = calcMaxStreak(workouts);

  return [
    { name: "Sesión más larga",    value: fmtTime(longest.duration),                    unit: "",      on: longest.date },
    { name: "Más saltos en sesión", value: mostJumps.jumps.toLocaleString("es-ES"),      unit: "saltos", on: mostJumps.date },
    { name: "Mejor semana",         value: String(Math.round(bestWeekSec / 60)),          unit: "min",   on: bestWeekKey },
    { name: "Racha máxima",         value: String(maxStreak),                             unit: "días",  on: "" },
  ];
}

function calcTopRoutines(workouts: WorkoutSession[]) {
  const freq = new Map<string, number>();
  workouts.forEach(h => freq.set(h.routineName, (freq.get(h.routineName) ?? 0) + 1));
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ appearance: "none", border: 0, background: active ? "var(--bg-3)" : "transparent", color: active ? "var(--fg)" : "var(--fg-2)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}>
      {children}
    </button>
  );
}

export default function StatsClient({ workouts }: { workouts: WorkoutSession[] }) {
  const [range, setRange] = useState<Range>("year");
  const days = range === "year" ? 365 : range === "6m" ? 182 : 90;
  const cells = buildCells(workouts, days);
  const weekly = buildWeekly(workouts);
  const maxW = Math.max(...weekly.map(w => w.sec), 1);
  const totalSec = workouts.reduce((s, h) => s + h.duration, 0);
  const streak = calcStreak(workouts);
  const prs = calcPRs(workouts);
  const topRoutines = calcTopRoutines(workouts);
  const maxFreq = topRoutines[0]?.[1] ?? 1;

  return (
    <>
      <Topbar title="Estadísticas" right={
        <div style={{ display: "flex", background: "var(--bg-2)", borderRadius: 8, padding: 2, border: "1px solid var(--line-c)" }}>
          {([ ["3m", "3M"], ["6m", "6M"], ["year", "1A"] ] as [Range, string][]).map(([k, l]) => (
            <SegButton key={k} active={range === k} onClick={() => setRange(k)}>{l}</SegButton>
          ))}
        </div>
      } />

      <div className="scroll-area">
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {[
            { label: "Tiempo total", value: `${Math.floor(totalSec / 3600)}h` },
            { label: "Workouts",     value: String(workouts.length) },
            { label: "Streak",       value: String(streak), unit: "días" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "18px 20px" }}>
              <div className="eyebrow">{s.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>{s.value}</span>
                {"unit" in s && s.unit && <span className="mono muted" style={{ fontSize: 13 }}>{s.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ marginBottom: 0 }}>Actividad</h3>
            <div className="muted mono" style={{ fontSize: 11 }}>{workouts.length} sesiones</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div className="heatmap" style={{ gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column" }}>
              {cells.map((c, i) => <div key={i} className="cell" data-l={c.l} title={c.iso} />)}
            </div>
          </div>
        </div>

        <div className="split-2-1" style={{ marginBottom: 20 }}>
          <div className="card">
            <h3>Minutos por semana</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 200, marginTop: 14 }}>
              {weekly.map((w, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }} title={`${Math.round(w.sec / 60)} min`}>
                  <div style={{ width: "100%", background: i === weekly.length - 1 ? "var(--accent)" : "var(--fg-3)", height: `${(w.sec / maxW) * 100}%`, minHeight: 2, borderRadius: "4px 4px 0 0" }} />
                  <span className="mono faded" style={{ fontSize: 10 }}>S{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Rutinas más frecuentes</h3>
            {topRoutines.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Sin datos aún.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {topRoutines.map(([name, count]) => (
                  <div key={name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{name}</span>
                      <span className="mono muted">{count}×</span>
                    </div>
                    <div className="bar thin"><i style={{ width: `${(count / maxFreq) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Récords personales</h3>
          {prs.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Completa tu primera sesión para ver tus récords.</p>
          ) : (
            <div className="grid-2" style={{ marginTop: 10, gap: 10 }}>
              {prs.map((p) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--line-c)" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--accent)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontWeight: 700, flexShrink: 0 }}>PR</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="muted" style={{ fontSize: 12 }}>{p.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                      <span className="display" style={{ fontSize: 24 }}>{p.value}</span>
                      {p.unit && <span className="mono muted" style={{ fontSize: 11 }}>{p.unit}</span>}
                    </div>
                  </div>
                  {p.on && <div className="mono faded" style={{ fontSize: 11, flexShrink: 0 }}>{p.on}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
