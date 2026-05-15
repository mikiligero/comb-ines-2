"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTINES, getRope } from "@/lib/data";
import { fmtTime } from "@/lib/fmt";
import type { Routine } from "@/lib/types";
import { useUserStore } from "@/lib/userStore";
import { useWorkoutEngine } from "@/components/workout/useWorkoutEngine";
import ExerciseIcon from "@/components/workout/ExerciseIcon";
import RopeChange from "@/components/workout/RopeChange";
import Modal from "@/components/Modal";

/* ── Inline icons ─────────────────────────────────────────── */

function BackIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>;
}
function HeartIcon() {
  return <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
}
function PauseIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>;
}
function PlayIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4l13 8-13 8V4z" /></svg>;
}
function SkipIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M5 5l10 7-10 7V5z" /><rect x="19" y="5" width="2" height="14" /></svg>;
}
function CheckIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 10-12" /></svg>;
}

/* ── Page entry ───────────────────────────────────────────── */

export default function WorkoutPage({ params }: { params: Promise<{ routineId: string }> }) {
  const { routineId } = use(params);
  const router = useRouter();
  const routine = ROUTINES.find(r => r.id === routineId);

  useEffect(() => {
    if (!routine) router.replace("/routines");
  }, [routine, router]);

  if (!routine) return null;
  return <WorkoutScreen routine={routine} />;
}

/* ── Main screen — orchestrates phases ───────────────────── */

type Phase = "workout" | "completion" | "freestyle";

function WorkoutScreen({ routine }: { routine: Routine }) {
  const router = useRouter();
  const { name } = useUserStore();
  const [phase, setPhase] = useState<Phase>("workout");
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  // Freestyle state
  const [extraSec, setExtraSec] = useState(0);
  const [freestyleRunning, setFreestyleRunning] = useState(true);

  const engine = useWorkoutEngine(routine);
  const { steps, idx, elapsed, running, step, total, elapsedTotal, remaining, totalProgress, done, hr, calBurnt, nextEx, upcoming, upcomingInLabel, toggle, next, prev } = engine;

  // Transition to completion when engine finishes
  useEffect(() => {
    if (done && phase === "workout") setPhase("completion");
  }, [done, phase]);

  // Freestyle tick
  useEffect(() => {
    if (phase !== "freestyle" || !freestyleRunning) return;
    const t = setInterval(() => setExtraSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, freestyleRunning]);

  // Keyboard shortcuts — only active during workout phase
  useEffect(() => {
    if (phase !== "workout") return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowRight" || e.key === "n") next();
      else if (e.key === "ArrowLeft"  || e.key === "p") prev();
      else if (e.key === "Escape") setShowConfirmExit(true);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [phase, toggle, next, prev]);

  const handleFinish = () => router.push("/dashboard");

  // ── Completion screen ──
  if (phase === "completion") {
    const exercises = steps.filter(s => s.kind === "ex").length;
    const jumps = Math.round(total * 1.8);
    return (
      <CompletionScreen
        routine={routine}
        userName={name}
        totalSec={total}
        extraSec={extraSec}
        exercises={exercises}
        blocks={routine.blocks.length}
        jumps={jumps}
        hr={Math.round(hr)}
        kcal={Math.round(calBurnt)}
        onContinue={() => { setPhase("freestyle"); setFreestyleRunning(true); }}
        onFinish={handleFinish}
      />
    );
  }

  // ── Freestyle screen ──
  if (phase === "freestyle") {
    return (
      <FreestyleMode
        routine={routine}
        baseTotal={total}
        extraSec={extraSec}
        running={freestyleRunning}
        hr={Math.round(hr)}
        onToggle={() => setFreestyleRunning(r => !r)}
        onFinish={handleFinish}
      />
    );
  }

  // ── Active workout ──
  if (!step) return null;

  const block = routine.blocks[step.blockIdx];
  const exercisesInBlock = block.items.filter(i => i.kind === "ex");
  const exNumInBlock = step.kind === "ex" && step.itemIdx !== undefined
    ? block.items.slice(0, step.itemIdx + 1).filter(i => i.kind === "ex").length
    : 0;
  const rope = getRope(step.ropeId ?? block.ropeId);
  const stepProgress = step.duration > 0 ? (elapsed / step.duration) * 100 : 0;
  const fromRope = step.kind === "transition" ? getRope(step.fromRope!) : undefined;
  const toRope   = step.kind === "transition" ? getRope(step.toRope!)   : undefined;

  return (
    <div className="workout-shell">
      {/* Top bar */}
      <div className="workout-top">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="btn icon ghost" onClick={() => setShowConfirmExit(true)} title="Salir">
            <BackIcon />
          </button>
          <div>
            <div className="eyebrow">EN CURSO</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{routine.name}</div>
          </div>
        </div>
        <div style={{ flex: 1, maxWidth: 520, margin: "0 24px" }}>
          <div className="mono muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
            <span>{fmtTime(elapsedTotal)}</span>
            <span>{Math.round(totalProgress)}%</span>
            <span>{fmtTime(total)}</span>
          </div>
          <div className="bar"><i style={{ width: `${totalProgress}%` }} /></div>
        </div>
        <span className="chip"><HeartIcon /> {Math.round(hr)} bpm</span>
      </div>

      {/* Stage */}
      <div className="workout-stage">
        {step.kind === "transition" && fromRope && toRope ? (
          <RopeChange step={step} elapsed={elapsed} remaining={remaining} fromRope={fromRope} toRope={toRope} />
        ) : (
          <div className="workout-center">
            {/* Breadcrumb */}
            <div style={{ position: "absolute", top: 28, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
              <span className="eyebrow">BLOQUE {step.blockLetter}</span>
              <span className="mono muted">·</span>
              <span className="eyebrow">EJ {exNumInBlock} / {exercisesInBlock.length}</span>
              {step.kind === "rest" && (
                <>
                  <span className="mono muted">·</span>
                  <span className="chip" style={{ color: "var(--warn)", borderColor: "color-mix(in oklab, var(--warn) 30%, transparent)", background: "color-mix(in oklab, var(--warn) 12%, var(--bg-1))" }}>DESCANSO</span>
                </>
              )}
            </div>

            {/* Current rope — subtle, top right */}
            {rope && (
              <div style={{ position: "absolute", top: 24, right: 28, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: rope.color, border: "1px solid var(--line-c)", display: "inline-block" }} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{rope.name}</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>{rope.weight}g</div>
                </div>
              </div>
            )}

            {/* Exercise or rest */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {step.kind === "rest" ? (
                <div className="serif" style={{ fontSize: 48, color: "var(--fg-2)" }}>Descanso</div>
              ) : (
                <>
                  <ExerciseIcon name={step.exName} />
                  <div style={{ textAlign: "left" }}>
                    <div className="eyebrow">SALTO</div>
                    <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{step.exName}</div>
                    {step.mode === "reps" && step.reps && (
                      <div className="mono muted" style={{ marginTop: 6 }}>objetivo {step.reps} reps</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Big timer */}
            <div className="big-timer">{fmtTime(remaining)}</div>

            {/* Step progress */}
            <div style={{ width: "min(620px, 80%)" }}>
              <div className="bar"><i style={{ width: `${stepProgress}%` }} /></div>
            </div>

            {/* Next + rope change warning */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {nextEx && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span className="eyebrow">NEXT</span>
                  <span style={{ fontWeight: 600 }}>{nextEx.exName}</span>
                  <span className="muted mono" style={{ fontSize: 11 }}>
                    {nextEx.mode === "time" ? fmtTime(nextEx.duration) : `${nextEx.reps} reps`}
                  </span>
                </div>
              )}
              {upcoming && upcomingInLabel && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--warn)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: getRope(upcoming.toRope!)?.color, border: "1px solid var(--line-c)", display: "inline-block" }} />
                  <span>cambio en ~{upcomingInLabel}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="workout-bottom">
        <button className="btn lg" onClick={prev}><SkipIcon /> Anterior</button>
        <button className="btn primary" onClick={toggle} style={{ minWidth: 200, padding: "22px 32px", fontSize: 18, borderRadius: "var(--radius)" }}>
          {running ? <><PauseIcon /> Pausa</> : <><PlayIcon /> Reanudar</>}
        </button>
        <button className="btn lg" onClick={next}>Siguiente <SkipIcon /></button>
      </div>

      {/* Exit modal */}
      {showConfirmExit && (
        <Modal title="¿Salir del workout?" onClose={() => setShowConfirmExit(false)}
          actions={<>
            <button className="btn ghost" onClick={() => setShowConfirmExit(false)}>Continuar</button>
            <button className="btn danger" onClick={() => router.push("/dashboard")}>Salir sin guardar</button>
          </>}>
          <p className="muted" style={{ fontSize: 14 }}>
            Llevas {fmtTime(elapsedTotal)} de {fmtTime(total)}. Si sales ahora se guardará como sesión parcial.
          </p>
        </Modal>
      )}
    </div>
  );
}

/* ── CompletionScreen ─────────────────────────────────────── */

type CompletionProps = {
  routine: Routine;
  userName: string;
  totalSec: number;
  extraSec: number;
  exercises: number;
  blocks: number;
  jumps: number;
  hr: number;
  kcal: number;
  onContinue: () => void;
  onFinish: () => void;
};

function CompletionScreen({ routine, userName, totalSec, extraSec, exercises, blocks, jumps, hr, kcal, onContinue, onFinish }: CompletionProps) {
  const ropesUsed = [...new Set(routine.blocks.map(b => b.ropeId))].map(rid => getRope(rid)).filter(Boolean);
  const firstName = routine.name.split(" ")[0];

  return (
    <div className="workout-shell" style={{ gridTemplateRows: "1fr" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", overflow: "auto", position: "relative" }}>

        {/* Accent halo */}
        <div aria-hidden style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 14%, transparent), transparent 65%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>

          {/* Badge + eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16 }}>✓</span>
            <span className="eyebrow">RUTINA FINALIZADA</span>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(48px, 8vw, 88px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
              ¡Buen trabajo, <span className="serif" style={{ color: "var(--accent)" }}>{firstName}</span>!
            </h1>
            <p className="muted" style={{ marginTop: 14, fontSize: 16 }}>
              Has completado <b style={{ color: "var(--fg)" }}>{routine.name}</b>
              {extraSec > 0 && <> + <b style={{ color: "var(--accent)" }}>{fmtTime(extraSec)}</b> extra</>}.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid-4" style={{ width: "100%", gap: 12 }}>
            {[
              { label: "Tiempo total",  value: fmtTime(totalSec), sub: extraSec > 0 ? `+${fmtTime(extraSec)} extra` : "planificado" },
              { label: "Saltos",        value: jumps.toLocaleString("es-ES"), sub: "estimados" },
              { label: "Ejercicios",    value: String(exercises), sub: `${blocks} bloques` },
              { label: "HR media",      value: String(hr), unit: "bpm", sub: `${kcal} kcal` },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "18px 20px" }}>
                <div className="eyebrow">{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                  <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>{s.value}</span>
                  {s.unit && <span className="mono muted" style={{ fontSize: 13 }}>{s.unit}</span>}
                </div>
                {s.sub && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Cuerdas usadas */}
          <div className="card" style={{ width: "100%", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="eyebrow">CUERDAS USADAS</div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                  {ropesUsed.map(r => r && (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: r.color, border: "1px solid var(--line-c)" }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{r.name}</div>
                        <div className="mono muted" style={{ fontSize: 11 }}>{r.weight}g</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {routine.blocks.map((b, i) => {
                  const r = getRope(b.ropeId);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--line-c)" }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{b.letter}</span>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: r?.color, display: "inline-block" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
            <button className="btn lg" onClick={onContinue} style={{ minWidth: 200 }}>
              <PlayIcon size={14} /> Continuar saltando
            </button>
            <button className="btn primary" onClick={onFinish} style={{ minWidth: 240, padding: "22px 32px", fontSize: 18, borderRadius: "var(--radius)" }}>
              Finalizar y guardar <CheckIcon size={16} />
            </button>
          </div>

          <div className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: -8 }}>
            La sesión se guardará en tu histórico automáticamente al finalizar.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── FreestyleMode ────────────────────────────────────────── */

type FreestyleProps = {
  routine: Routine;
  baseTotal: number;
  extraSec: number;
  running: boolean;
  hr: number;
  onToggle: () => void;
  onFinish: () => void;
};

function FreestyleMode({ routine, baseTotal, extraSec, running, hr, onToggle, onFinish }: FreestyleProps) {
  return (
    <div className="workout-shell">
      <div className="workout-top">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="chip solid">FREESTYLE</span>
          <div>
            <div className="eyebrow">RUTINA COMPLETADA · TIEMPO EXTRA</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{routine.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="chip"><HeartIcon /> {hr} bpm</span>
          <span className="chip mono">total {fmtTime(baseTotal + extraSec)}</span>
        </div>
      </div>

      <div className="workout-stage">
        <div className="workout-center">
          <div className="eyebrow" style={{ color: "var(--accent)" }}>TIEMPO EXTRA</div>
          <ExerciseIcon />
          <div className="big-timer">{fmtTime(extraSec)}</div>
          <div className="muted" style={{ fontSize: 14, maxWidth: 420, textAlign: "center" }}>
            Sigue saltando todo lo que quieras. Pulsa finalizar cuando hayas terminado y se sumará al total.
          </div>
        </div>
      </div>

      <div className="workout-bottom">
        <button className="btn primary" onClick={onToggle} style={{ minWidth: 200, padding: "22px 32px", fontSize: 18, borderRadius: "var(--radius)" }}>
          {running ? <><PauseIcon /> Pausa</> : <><PlayIcon /> Reanudar</>}
        </button>
        <button className="btn lg" onClick={onFinish} style={{ minWidth: 200 }}>
          <CheckIcon /> Finalizar
        </button>
      </div>
    </div>
  );
}
