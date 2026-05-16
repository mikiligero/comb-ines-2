"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWorkout } from "@/lib/actions/workouts";
import { fmtTime } from "@/lib/fmt";
import type { Rope, Routine } from "@/lib/types";
import { useUserStore } from "@/lib/userStore";
import { useWorkoutEngine } from "@/components/workout/useWorkoutEngine";
import ExerciseIcon from "@/components/workout/ExerciseIcon";
import ExerciseVideo from "@/components/workout/ExerciseVideo";
import RopeChange from "@/components/workout/RopeChange";
import Modal from "@/components/Modal";

function BackIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>; }
function HeartIcon() { return <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }
function PauseIcon({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>; }
function PlayIcon({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4l13 8-13 8V4z"/></svg>; }
function SkipIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M5 5l10 7-10 7V5z"/><rect x="19" y="5" width="2" height="14"/></svg>; }
function CheckIcon({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 10-12"/></svg>; }

type Phase = "workout" | "completion" | "freestyle";

export default function WorkoutScreen({ routine, ropes }: { routine: Routine; ropes: Rope[] }) {
  const router = useRouter();
  const { name } = useUserStore();
  const [phase, setPhase] = useState<Phase>("workout");
  const [showExit, setShowExit] = useState(false);
  const [extraSec, setExtraSec] = useState(0);
  const startTimeRef = useRef(Date.now());
  const [realDuration, setRealDuration] = useState(0);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const [freestyleRunning, setFreestyleRunning] = useState(true);
  const [saving, startSave] = useTransition();

  const ropeMap = new Map<string, Rope>(ropes.map(r => [r.id, r]));
  const engine = useWorkoutEngine(routine);
  const { steps, elapsed, running, step, total, elapsedTotal, remaining, totalProgress, done, hr, calBurnt, nextEx, upcoming, upcomingInLabel, toggle, pause, play, next, prev } = engine;

  const [previewing, setPreviewing] = useState(false);
  const prevIdxRef = useRef(-1);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissPreview = useCallback(() => {
    if (previewTimerRef.current) { clearTimeout(previewTimerRef.current); previewTimerRef.current = null; }
    setPreviewing(false);
    play();
  }, [play]);

  // Show a 2-second preview screen before every exercise step.
  // The cleanup resets prevIdxRef so React StrictMode's double-invoke
  // re-triggers the preview correctly on the second mount.
  useEffect(() => {
    if (step?.kind !== "ex" || prevIdxRef.current === engine.idx) {
      if (step?.kind !== "ex") prevIdxRef.current = engine.idx;
      return;
    }
    prevIdxRef.current = engine.idx;
    pause();
    setPreviewing(true);

    let active = true;
    const startTimer = (ms: number) => {
      previewTimerRef.current = setTimeout(() => {
        if (active) { setPreviewing(false); play(); }
      }, ms);
    };

    const slug = step?.exName
      ? step.exName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      : null;
    if (slug) {
      fetch(`/exercises/${slug}.mp4`, { method: "HEAD" })
        .then(r => startTimer(r.ok ? 4000 : 2000))
        .catch(() => startTimer(2000));
    } else {
      startTimer(2000);
    }

    return () => {
      active = false;
      if (previewTimerRef.current) { clearTimeout(previewTimerRef.current); previewTimerRef.current = null; }
      setPreviewing(false);
      play();
      prevIdxRef.current = -1; // allow re-trigger on StrictMode remount
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.idx]);

  useEffect(() => {
    if (done && phase === "workout") {
      const now = new Date();
      setRealDuration(Math.round((now.getTime() - startTimeRef.current) / 1000));
      setFinishedAt(now);
      setPhase("completion");
    }
  }, [done, phase]);

  useEffect(() => {
    if (phase !== "freestyle" || !freestyleRunning) return;
    const t = setInterval(() => setExtraSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, freestyleRunning]);

  useEffect(() => {
    if (phase !== "workout") return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); previewing ? dismissPreview() : toggle(); }
      else if (e.key === "ArrowRight" || e.key === "n") next();
      else if (e.key === "ArrowLeft"  || e.key === "p") prev();
      else if (e.key === "Escape") setShowExit(true);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [phase, previewing, toggle, dismissPreview, next, prev]);

  const ropeIds = [...new Set(routine.blocks.map(b => b.ropeId))];

  const audioCtx = useRef<AudioContext | null>(null);
  const beep = (freq: number, dur: number) => {
    if (typeof window === "undefined") return;
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    const ctx = audioCtx.current;
    const play = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    };
    if (ctx.state === "suspended") ctx.resume().then(play);
    else play();
  };

  useEffect(() => {
    if (!running) return;
    if (remaining >= 2 && remaining <= 5) beep(880, 0.15);
    if (remaining === 1) beep(520, 0.9);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const doSave = (completed: boolean) => {
    startSave(async () => {
      const elapsed = realDuration > 0
        ? realDuration + extraSec
        : Math.round((Date.now() - startTimeRef.current) / 1000) + extraSec;
      await saveWorkout({
        routineId: routine.id,
        routineName: routine.name,
        date: new Date().toISOString().slice(0, 10),
        time: "",
        duration: elapsed,
        jumps: Math.round(elapsed * 1.8),
        avgHr: Math.round(hr),
        calories: Math.round(calBurnt),
        ropes: ropeIds,
        completed,
      });
      router.push("/dashboard");
    });
  };

  // ── Completion ──
  if (phase === "completion") {
    const ropesUsed = [...new Set(routine.blocks.map(b => b.ropeId))].map(rid => ropeMap.get(rid)).filter(Boolean) as Rope[];
    const firstName = (name || "campeón").split(" ")[0];
    const jumps = Math.round(realDuration * 1.8);
    const finishedAtStr = finishedAt
      ? finishedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "";
    return (
      <div className="workout-shell" style={{ gridTemplateRows: "1fr" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", overflow: "auto", position: "relative" }}>
          <div aria-hidden style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 14%, transparent), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16 }}>✓</span>
              <span className="eyebrow">RUTINA FINALIZADA</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "clamp(48px, 8vw, 88px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                ¡Buen trabajo, <span className="serif" style={{ color: "var(--accent)" }}>{firstName}</span>!
              </h1>
              <p className="muted" style={{ marginTop: 14, fontSize: 16 }}>
                Has completado <b style={{ color: "var(--fg)" }}>{routine.name}</b>
                {extraSec > 0 && <> + <b style={{ color: "var(--accent)" }}>{fmtTime(extraSec)}</b> extra</>}
                {finishedAtStr && <> a las <b style={{ color: "var(--fg)" }}>{finishedAtStr}</b></>}.
              </p>
            </div>
            <div className="grid-4" style={{ width: "100%", gap: 12 }}>
              {[
                { label: "Duración", value: fmtTime(realDuration + extraSec), sub: "tiempo real" },
                { label: "Saltos",       value: jumps.toLocaleString("es-ES"), sub: "estimados" },
                { label: "Ejercicios",   value: String(steps.filter(s => s.kind === "ex").length), sub: `${routine.blocks.length} bloques` },
                { label: "HR media",     value: String(Math.round(hr)), unit: "bpm", sub: `${Math.round(calBurnt)} kcal` },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: "18px 20px" }}>
                  <div className="eyebrow">{s.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                    <span className="display" style={{ fontSize: 36, lineHeight: 1 }}>{s.value}</span>
                    {"unit" in s && s.unit && <span className="mono muted" style={{ fontSize: 13 }}>{s.unit}</span>}
                  </div>
                  {s.sub && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{s.sub}</div>}
                </div>
              ))}
            </div>
            <div className="card" style={{ width: "100%", padding: "16px 20px" }}>
              <div className="eyebrow">CUERDAS USADAS</div>
              <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                {ropesUsed.map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: r.color, border: "1px solid var(--line-c)" }} />
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div><div className="mono muted" style={{ fontSize: 11 }}>{r.weight}g</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn lg" onClick={() => { setPhase("freestyle"); setFreestyleRunning(true); }} disabled={saving}>
                <PlayIcon size={14} /> Continuar saltando
              </button>
              <button className="btn primary xl" onClick={() => doSave(true)} disabled={saving}>
                {saving ? "Guardando..." : <><CheckIcon size={16} /> Finalizar y guardar</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Freestyle ──
  if (phase === "freestyle") {
    return (
      <div className="workout-shell">
        <div className="workout-top">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="chip solid">FREESTYLE</span>
            <div><div className="eyebrow">RUTINA COMPLETADA · TIEMPO EXTRA</div><div style={{ fontWeight: 700, fontSize: 16 }}>{routine.name}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="chip"><HeartIcon /> {Math.round(hr)} bpm</span>
            <span className="chip mono">total {fmtTime(total + extraSec)}</span>
          </div>
        </div>
        <div className="workout-stage">
          <div className="workout-center">
            <div className="eyebrow" style={{ color: "var(--accent)" }}>TIEMPO EXTRA</div>
            <ExerciseIcon />
            <div className="big-timer">{fmtTime(extraSec)}</div>
            <div className="muted" style={{ fontSize: 14, maxWidth: 420, textAlign: "center" }}>Sigue saltando todo lo que quieras. Pulsa finalizar cuando hayas terminado.</div>
          </div>
        </div>
        <div className="workout-bottom">
          <button className="btn primary xl" onClick={() => setFreestyleRunning(r => !r)}>
            {freestyleRunning ? <><PauseIcon /> Pausa</> : <><PlayIcon /> Reanudar</>}
          </button>
          <button className="btn lg" onClick={() => doSave(true)} disabled={saving}>
            {saving ? "Guardando..." : <><CheckIcon /> Finalizar</>}
          </button>
        </div>
      </div>
    );
  }

  // ── Workout activo ──
  if (done) return null;
  if (!step) return null;

  const block = routine.blocks[step.blockIdx];
  const exercisesInBlock = block.items.filter(i => i.kind === "ex");
  const exNumInBlock = step.kind === "ex" && step.itemIdx !== undefined
    ? block.items.slice(0, step.itemIdx + 1).filter(i => i.kind === "ex").length : 0;
  const rope = ropeMap.get(step.ropeId ?? block.ropeId);
  const stepProgress = step.duration > 0 ? (elapsed / step.duration) * 100 : 0;
  const fromRope = step.kind === "transition" ? ropeMap.get(step.fromRope!) : undefined;
  const toRope   = step.kind === "transition" ? ropeMap.get(step.toRope!)   : undefined;

  return (
    <div className="workout-shell">
      <div className="workout-top">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="btn icon ghost" onClick={() => setShowExit(true)}><BackIcon /></button>
          <div><div className="eyebrow">EN CURSO</div><div style={{ fontWeight: 700, fontSize: 18 }}>{routine.name}</div></div>
        </div>
        <div style={{ flex: 1, maxWidth: 520, margin: "0 24px" }}>
          <div className="mono muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
            <span>{fmtTime(elapsedTotal)}</span><span>{Math.round(totalProgress)}%</span><span>{fmtTime(total)}</span>
          </div>
          <div className="bar"><i style={{ width: `${100 - totalProgress}%`, position: "absolute", right: 0 }} /></div>
        </div>
        <span className="chip"><HeartIcon /> {Math.round(hr)} bpm</span>
      </div>

      <div className="workout-stage" style={!previewing && step.kind === "rest" ? { background: "color-mix(in oklab, var(--accent) 80%, var(--bg))", transition: "background 0.4s ease" } : { transition: "background 0.4s ease" }}>
        {previewing ? (
          <div className="workout-center" style={{ cursor: "pointer" }} onClick={dismissPreview}>
            <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 24 }}>A CONTINUACIÓN</div>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <ExerciseVideo exId={step.exId} exName={step.exName} size={420} />
              <div>
                <div className="eyebrow">SALTO</div>
                <div style={{ fontSize: "clamp(72px, 10vw, 120px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{step.exName}</div>
                <div className="mono muted" style={{ marginTop: 10, fontSize: "clamp(24px, 3vw, 36px)" }}>
                  {step.mode === "reps" && step.reps ? `${step.reps} reps` : fmtTime(step.duration)}
                </div>
              </div>
            </div>
          </div>
        ) : step.kind === "transition" && fromRope && toRope ? (
          <RopeChange step={step} elapsed={elapsed} remaining={remaining} fromRope={fromRope} toRope={toRope} />
        ) : (
          <div className="workout-center">
            <div style={{ position: "absolute", top: 28, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
              <span className="eyebrow">BLOQUE {step.blockLetter}</span>
              <span className="mono muted">·</span>
              <span className="eyebrow">EJ {exNumInBlock} / {exercisesInBlock.length}</span>
              {step.kind === "rest" && <><span className="mono muted">·</span><span className="chip" style={{ color: "var(--warn)", borderColor: "color-mix(in oklab, var(--warn) 30%, transparent)", background: "color-mix(in oklab, var(--warn) 12%, var(--bg-1))" }}>DESCANSO</span></>}
            </div>
            {rope && (
              <div className="workout-rope-badge" style={{ position: "absolute", top: 24, right: 28, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: rope.color, border: "1px solid var(--line-c)", display: "inline-block" }} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{rope.name}</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>{rope.weight}g</div>
                </div>
              </div>
            )}
            <div className="exercise-row-wrap" style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {step.kind === "rest" ? (
                <div className="serif" style={{ fontSize: 96, color: "#ffffff" }}>Descanso</div>
              ) : (
                <>
                  <ExerciseIcon name={step.exName} />
                  <div className="exercise-name" style={{ minWidth: 0 }}>
                    <div className="eyebrow">SALTO</div>
                    <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{step.exName}</div>
                    {step.mode === "reps" && step.reps && <div className="mono muted" style={{ marginTop: 6 }}>objetivo {step.reps} reps</div>}
                  </div>
                </>
              )}
            </div>
            <div className="big-timer">{fmtTime(remaining)}</div>
            <div style={{ width: "min(620px, 80%)" }}><div className="bar"><i style={{ width: `${100 - stepProgress}%`, position: "absolute", right: 0, ...(step.kind === "rest" ? { background: "var(--fg)" } : {}) }} /></div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {nextEx && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span className="eyebrow">NEXT</span>
                  <span style={{ fontWeight: 600 }}>{nextEx.exName}</span>
                  <span className="muted mono" style={{ fontSize: 11 }}>{nextEx.mode === "time" ? fmtTime(nextEx.duration) : `${nextEx.reps} reps`}</span>
                </div>
              )}
              {upcoming && upcomingInLabel && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--warn)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: ropeMap.get(upcoming.toRope!)?.color, border: "1px solid var(--line-c)", display: "inline-block" }} />
                  <span>cambio en ~{upcomingInLabel}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="workout-bottom">
        <button className="btn lg" onClick={prev}><SkipIcon /> Anterior</button>
        <button className="btn primary xl" onClick={toggle}>{running ? <><PauseIcon /> Pausa</> : <><PlayIcon /> Reanudar</>}</button>
        <button className="btn lg" onClick={next}>Siguiente <SkipIcon /></button>
      </div>

      {showExit && (
        <Modal title="¿Salir del workout?" onClose={() => setShowExit(false)}
          actions={<>
            <button className="btn ghost" onClick={() => setShowExit(false)}>Continuar</button>
            <button className="btn danger" onClick={() => doSave(false)} disabled={saving}>{saving ? "Guardando..." : "Salir y guardar parcial"}</button>
          </>}>
          <p className="muted" style={{ fontSize: 14 }}>Llevas {fmtTime(elapsedTotal)} de {fmtTime(total)}. Se guardará como sesión parcial.</p>
        </Modal>
      )}
    </div>
  );
}
