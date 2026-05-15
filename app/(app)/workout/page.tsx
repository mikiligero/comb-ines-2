import Link from "next/link";
import { getRoutines } from "@/lib/actions/routines";
import { getRopes } from "@/lib/actions/ropes";
import { routineDuration } from "@/lib/fmt";
import RoutineBlocksStrip from "@/components/RoutineBlocksStrip";
import Topbar from "@/components/Topbar";
import type { Rope } from "@/lib/types";

function PlayIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4l13 8-13 8V4z" /></svg>;
}

export default async function EntrenarPage() {
  const [routines, ropes] = await Promise.all([getRoutines(), getRopes()]);
  const ropeMap = new Map<string, Rope>(ropes.map(r => [r.id, r]));

  return (
    <>
      <Topbar title="Entrenar" />
      <div className="scroll-area">
        {routines.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <p className="muted" style={{ marginBottom: 16 }}>Aún no tienes rutinas. Crea una para poder entrenar.</p>
            <Link href="/routines" className="btn primary">Crear rutina</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {routines.map(r => {
              const mins = Math.round(routineDuration(r) / 60);
              const uniqueRopes = [...new Set(r.blocks.map(b => b.ropeId))];
              return (
                <div key={r.id} className="card" style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 20px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{r.name}</div>
                    {r.description && (
                      <div className="muted" style={{ fontSize: 13, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <span className="chip">{mins} min</span>
                      <span className="chip">{r.blocks.length} bloques</span>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {uniqueRopes.map(rid => {
                          const rope = ropeMap.get(rid);
                          return <span key={rid} title={rope?.name} style={{ width: 10, height: 10, borderRadius: "50%", background: rope?.color ?? "#888", display: "inline-block", border: "1px solid var(--line-c)" }} />;
                        })}
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <RoutineBlocksStrip routine={r} ropeMap={ropeMap} />
                    </div>
                  </div>
                  <Link href={`/workout/${r.id}`} className="btn primary lg" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <PlayIcon /> Empezar
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
