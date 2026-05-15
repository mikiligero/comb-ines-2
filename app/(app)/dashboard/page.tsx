import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRoutines } from "@/lib/actions/routines";
import { getWorkouts } from "@/lib/actions/workouts";
import { getRopes } from "@/lib/actions/ropes";
import { routineDuration, fmtTime } from "@/lib/fmt";
import type { Rope, Routine, WorkoutSession } from "@/lib/types";
import RoutineBlocksStrip from "@/components/RoutineBlocksStrip";

function PlayIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4l13 8-13 8V4z" /></svg>;
}
function ChevronRightIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
}

function calcStreak(workouts: WorkoutSession[]) {
  const dates = new Set(workouts.map(w => w.date));
  let streak = 0;
  const d = new Date();
  while (streak < 366) {
    if (!dates.has(d.toISOString().slice(0, 10))) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function buildCells(workouts: WorkoutSession[]) {
  const today = new Date();
  const histSet = new Map<string, number>();
  workouts.forEach(h => histSet.set(h.date, (histSet.get(h.date) ?? 0) + 1));
  const cells: { iso: string; l: number }[] = [];
  for (let i = 12 * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ iso, l: Math.min(4, histSet.get(iso) ?? 0) });
  }
  return cells;
}

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Atleta";

  const [routines, workouts, ropes] = await Promise.all([
    getRoutines(), getWorkouts(), getRopes(),
  ]);

  const ropeMap = new Map<string, Rope>(ropes.map(r => [r.id, r]));
  const nextRoutine: Routine | undefined = routines[0];

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
  const weekSec = workouts
    .filter(h => new Date(h.date) >= weekAgo)
    .reduce((s, h) => s + h.duration, 0);
  const totalSec = workouts.reduce((s, h) => s + h.duration, 0);
  const streak = calcStreak(workouts);
  const recent = workouts.slice(0, 4);
  const cells = buildCells(workouts);

  const dateStr = today.toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  }).toUpperCase();

  return (
    <div className="scroll-area">
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow">{dateStr}</div>
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
            <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>{Math.round(weekSec / 60)}</span>
            <span className="mono muted" style={{ fontSize: 13 }}>min</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{workouts.filter(h => new Date(h.date) >= weekAgo).length} sesiones</div>
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div className="eyebrow">Streak</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
            <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>{streak}</span>
            <span className="mono muted" style={{ fontSize: 13 }}>días</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{workouts.length} sesiones totales</div>
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div className="eyebrow">Tiempo total</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
            <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>
              {totalSec >= 3600 ? `${Math.floor(totalSec / 3600)}h` : `${Math.round(totalSec / 60)}m`}
            </span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>histórico</div>
        </div>
      </div>

      {/* Next workout + action */}
      <div className="split-2-1" style={{ marginBottom: 28 }}>
        {nextRoutine ? (
          <>
            <div className="card">
              <div className="eyebrow" style={{ marginBottom: 8 }}>PRÓXIMO WORKOUT</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{nextRoutine.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <span className="chip">{Math.round(routineDuration(nextRoutine) / 60)} min</span>
                    <span className="chip">{nextRoutine.blocks.length} bloques</span>
                    <span className="chip">{new Set(nextRoutine.blocks.map(b => b.ropeId)).size} cuerdas</span>
                  </div>
                </div>
                <div style={{ flex: "1 1 200px", minWidth: 200 }}>
                  <RoutineBlocksStrip routine={nextRoutine} ropeMap={ropeMap} />
                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    {nextRoutine.blocks.map((b, i) => {
                      const rope = ropeMap.get(b.ropeId);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                          <span className="mono faded">{b.letter}</span>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: rope?.color ?? "#888", display: "inline-block" }} />
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
                <Link href={`/workout/${nextRoutine.id}`} className="btn primary lg" style={{ justifyContent: "center" }}>
                  <PlayIcon /> {nextRoutine.name}
                </Link>
                <Link href="/routines" className="btn" style={{ justifyContent: "center" }}>Ver rutinas</Link>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>EMPIEZA AQUÍ</div>
            <p className="muted" style={{ marginBottom: 14, fontSize: 14 }}>Aún no tienes rutinas. Crea una para poder entrenar.</p>
            <Link href="/routines" className="btn primary">Crear rutina</Link>
          </div>
        )}
      </div>

      {/* Recent + heatmap */}
      <div className="split-2-1">
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ marginBottom: 0 }}>Sesiones recientes</h3>
            <Link href="/history" className="btn ghost" style={{ padding: "6px 10px", fontSize: 13 }}>
              Ver todo <ChevronRightIcon />
            </Link>
          </div>
          {recent.length > 0 ? (
            <table className="table">
              <thead>
                <tr><th>Fecha</th><th>Rutina</th><th>Duración</th><th></th></tr>
              </thead>
              <tbody>
                {recent.map(h => (
                  <tr key={h.id}>
                    <td className="mono">{h.date}</td>
                    <td>{h.routineName}</td>
                    <td className="mono">{fmtTime(h.duration)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        {[...new Set(h.ropes)].map(rid => {
                          const r = ropeMap.get(rid);
                          return <span key={rid} title={r?.name} style={{ width: 10, height: 10, borderRadius: "50%", background: r?.color ?? "#888", display: "inline-block" }} />;
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>Completa tu primer workout para verlo aquí.</p>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ marginBottom: 0 }}>Actividad</h3>
            <span className="muted mono" style={{ fontSize: 11 }}>12 semanas</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div className="heatmap">
              {cells.map((c, i) => <div key={i} className="cell" data-l={c.l} />)}
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
