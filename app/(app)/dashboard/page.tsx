"use client";

import Link from "next/link";
import { ROUTINES, HISTORY, getRope } from "@/lib/data";
import { routineDuration } from "@/lib/fmt";
import { useUserStore } from "@/lib/userStore";
import RoutineBlocksStrip from "@/components/RoutineBlocksStrip";

const TODAY = new Date(2026, 4, 11);
const STREAK = 6;

function buildHeatmapCells() {
  const histSet = new Set(HISTORY.map(h => h.date));
  const cells: { iso: string; l: number }[] = [];
  for (let i = 12 * 7 - 1; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const has = histSet.has(iso);
    cells.push({ iso, l: has ? 1 + (i % 4) : 0 });
  }
  return cells;
}

const CELLS = buildHeatmapCells();
const TOTAL_MIN = HISTORY.reduce((s, h) => s + h.duration, 0);
const WEEK_MIN = HISTORY.filter(h => TODAY.getTime() - new Date(h.date).getTime() <= 7 * 24 * 3600 * 1000)
  .reduce((s, h) => s + h.duration, 0);
const RECENT = HISTORY.slice(0, 4);
const NEXT_ROUTINE = ROUTINES[0];
const DATE_STR = TODAY.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

function PlayIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4l13 8-13 8V4z" /></svg>;
}
function ChevronRightIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
}

export default function DashboardPage() {
  const { name } = useUserStore();
  const firstName = name.split(" ")[0];

  const routineMin = Math.round(routineDuration(NEXT_ROUTINE) / 60);
  const uniqueRopes = new Set(NEXT_ROUTINE.blocks.map(b => b.ropeId)).size;

  return (
    <div className="scroll-area">
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow">{DATE_STR}</div>
          <h1 style={{ marginTop: 6 }}>
            Hola,{" "}
            <span className="serif" style={{ color: "var(--accent)" }}>{firstName}</span>
          </h1>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div className="eyebrow">Esta semana</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
            <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>{WEEK_MIN}</span>
            <span className="mono muted" style={{ fontSize: 13 }}>min</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>objetivo 180</div>
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div className="eyebrow">Streak</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
            <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>{STREAK}</span>
            <span className="mono muted" style={{ fontSize: 13 }}>días</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>récord 14</div>
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div className="eyebrow">Tiempo total</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
            <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>{Math.floor(TOTAL_MIN / 60)}h</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>histórico</div>
        </div>
      </div>

      {/* Next workout + action */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 28 }}>
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 8 }}>PRÓXIMO WORKOUT</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{NEXT_ROUTINE.name}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <span className="chip">{routineMin} min</span>
                <span className="chip">{NEXT_ROUTINE.blocks.length} bloques</span>
                <span className="chip">{uniqueRopes} cuerdas</span>
              </div>
            </div>
            <div style={{ flex: "1 1 200px", minWidth: 200 }}>
              <RoutineBlocksStrip routine={NEXT_ROUTINE} />
              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                {NEXT_ROUTINE.blocks.map((b, i) => {
                  const rope = getRope(b.ropeId);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      <span className="mono faded">{b.letter}</span>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: rope?.color, display: "inline-block" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}>
          <div>
            <div className="eyebrow">UNA ACCIÓN</div>
            <h3 style={{ marginTop: 8, fontSize: 22 }}>Empieza a saltar</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>O elige otra rutina.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href={`/workout/${NEXT_ROUTINE.id}`} className="btn primary lg" style={{ justifyContent: "center" }}>
              <PlayIcon /> {NEXT_ROUTINE.name}
            </Link>
            <Link href="/routines" className="btn" style={{ justifyContent: "center" }}>Ver rutinas</Link>
          </div>
        </div>
      </div>

      {/* Recent + heatmap */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ marginBottom: 0 }}>Sesiones recientes</h3>
            <Link href="/history" className="btn ghost" style={{ padding: "6px 10px", fontSize: 13 }}>
              Ver todo <ChevronRightIcon />
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Rutina</th><th>Duración</th><th></th></tr>
            </thead>
            <tbody>
              {RECENT.map(h => (
                <tr key={h.id} className="clickable">
                  <td className="mono">{h.date}</td>
                  <td>{h.routineName}</td>
                  <td className="mono">{h.duration}m</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      {[...new Set(h.ropes)].map(rid => {
                        const r = getRope(rid);
                        return <span key={rid} title={r?.name} style={{ width: 10, height: 10, borderRadius: "50%", background: r?.color, display: "inline-block" }} />;
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ marginBottom: 0 }}>Actividad</h3>
            <span className="muted mono" style={{ fontSize: 11 }}>12 semanas</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div className="heatmap">
              {CELLS.map((c, i) => <div key={i} className="cell" data-l={c.l} />)}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/stats" className="btn ghost" style={{ padding: "4px 0", fontSize: 12 }}>
              Ver detalles <ChevronRightIcon size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
