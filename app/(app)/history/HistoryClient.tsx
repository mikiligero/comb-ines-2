"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fmtTime } from "@/lib/fmt";
import { deleteWorkout } from "@/lib/actions/workouts";
import type { WorkoutSession, Rope } from "@/lib/types";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";

type Filter = "all" | "completed" | "partial";

function ChevronRightIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
}
function TrashIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>;
}
function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ appearance: "none", border: 0, background: active ? "var(--bg-3)" : "transparent", color: active ? "var(--fg)" : "var(--fg-2)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function WorkoutDetail({ h, ropeMap, onClose, onDelete }: { h: WorkoutSession; ropeMap: Map<string, Rope>; onClose: () => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteWorkout(h.id);
      onClose();
      onDelete();
      router.refresh();
    });
  };

  if (confirmDelete) {
    return (
      <Modal title="¿Borrar sesión?" onClose={() => setConfirmDelete(false)}
        actions={<>
          <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Cancelar</button>
          <button className="btn danger" onClick={handleDelete} disabled={pending}>
            {pending ? "Borrando..." : <><TrashIcon /> Borrar</>}
          </button>
        </>}>
        <p className="muted" style={{ fontSize: 14 }}>Se eliminará la sesión del <b style={{ color: "var(--fg)" }}>{h.date}</b> — {h.routineName}. Esta acción no se puede deshacer.</p>
      </Modal>
    );
  }

  return (
    <Modal title={`Sesión · ${h.date}`} onClose={onClose}
      actions={<>
        <button className="btn danger ghost" onClick={() => setConfirmDelete(true)} style={{ marginRight: "auto" }}>
          <TrashIcon /> Borrar
        </button>
        <button className="btn ghost" onClick={onClose}>Cerrar</button>
        {h.routineId && <Link href={`/workout/${h.routineId}`} className="btn primary">Repetir rutina</Link>}
      </>}>
      <div><div className="eyebrow">RUTINA</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{h.routineName}</div></div>
      <div className="grid-3" style={{ gap: 10 }}>
        {[
          { label: "DURACIÓN", value: fmtTime(h.duration) },
          { label: "SALTOS",   value: h.jumps.toLocaleString("es-ES") },
          { label: "HR MEDIA", value: h.avgHr ? `${h.avgHr} bpm` : "—" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "12px 14px" }}>
            <div className="eyebrow">{s.label}</div>
            <div className="display" style={{ fontSize: 24, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>
      {h.ropes.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>CUERDAS USADAS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...new Set(h.ropes)].map(rid => {
              const r = ropeMap.get(rid);
              return (
                <div key={rid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-2)", borderRadius: 8, border: "1px solid var(--line-c)" }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: r?.color ?? "#888", display: "inline-block" }} />
                  <span style={{ fontSize: 13 }}>{r?.name ?? "Cuerda"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function HistoryClient({ workouts, ropes }: { workouts: WorkoutSession[]; ropes: Rope[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<WorkoutSession | null>(null);

  const ropeMap = new Map<string, Rope>(ropes.map(r => [r.id, r]));
  const list = workouts.filter(h => filter === "all" ? true : filter === "completed" ? h.completed : !h.completed);
  const totalSec = workouts.reduce((s, h) => s + h.duration, 0);
  const totalJumps = workouts.reduce((s, h) => s + h.jumps, 0);

  return (
    <>
      <Topbar title="Histórico" right={
        <div style={{ display: "flex", background: "var(--bg-2)", borderRadius: 8, padding: 2, border: "1px solid var(--line-c)" }}>
          {([ ["all", "Todas"], ["completed", "Completadas"], ["partial", "Parciales"] ] as [Filter, string][]).map(([k, l]) => (
            <SegButton key={k} active={filter === k} onClick={() => setFilter(k)}>{l}</SegButton>
          ))}
        </div>
      } />

      <div className="scroll-area">
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[
            { label: "Sesiones",     value: String(workouts.length) },
            { label: "Tiempo total", value: totalSec > 0 ? `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m` : "0m" },
            { label: "Saltos",       value: totalJumps >= 1000 ? (totalJumps / 1000).toFixed(1) + "k" : String(totalJumps) },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "18px 20px" }}>
              <div className="eyebrow">{s.label}</div>
              <div className="display" style={{ fontSize: 36, lineHeight: 1, marginTop: 8 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Rutina</th><th>Duración</th><th>Saltos</th><th>Cuerdas</th><th></th></tr>
            </thead>
            <tbody>
              {list.map(h => (
                <tr key={h.id} className="clickable" onClick={() => setSelected(h)}>
                  <td className="mono">{h.date}</td>
                  <td>
                    {h.routineName}
                    {!h.completed && <span className="chip" style={{ marginLeft: 6, color: "var(--warn)", borderColor: "color-mix(in oklab, var(--warn) 30%, transparent)", background: "color-mix(in oklab, var(--warn) 12%, var(--bg-1))", fontSize: 10 }}>parcial</span>}
                  </td>
                  <td className="mono">{fmtTime(h.duration)}</td>
                  <td className="mono">{h.jumps.toLocaleString("es-ES")}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[...new Set(h.ropes)].map(rid => {
                        const r = ropeMap.get(rid);
                        return <span key={rid} title={r?.name} style={{ width: 12, height: 12, borderRadius: "50%", background: r?.color ?? "#888", display: "inline-block", border: "1px solid var(--line-c)" }} />;
                      })}
                    </div>
                  </td>
                  <td><ChevronRightIcon /></td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} style={{ color: "var(--fg-2)", textAlign: "center", padding: 32 }}>Aún no hay sesiones registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <WorkoutDetail
          h={selected}
          ropeMap={ropeMap}
          onClose={() => setSelected(null)}
          onDelete={() => setSelected(null)}
        />
      )}
    </>
  );
}
