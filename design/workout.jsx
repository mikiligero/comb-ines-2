// Live workout screen — the hero of the app.

function Workout({ routine, onExit, onComplete }){
  // Build flat timeline of "steps": blocks → items, with transitions between blocks where rope differs.
  const steps = React.useMemo(()=>{
    const out = [];
    routine.blocks.forEach((b, bi)=>{
      const prev = routine.blocks[bi-1];
      if (prev && prev.ropeId !== b.ropeId) {
        out.push({ kind:"transition", duration: routine.transitionSec, fromRope: prev.ropeId, toRope: b.ropeId, blockIdx: bi });
      }
      b.items.forEach((it, ii)=>{
        const ex = it.kind==="ex" ? getExercise(it.exId) : null;
        out.push({
          kind: it.kind,
          mode: it.mode || "time",
          duration: it.mode==="reps" ? Math.round(it.value/2) : it.value, // reps→approx seconds @2/s
          reps: it.kind==="ex" && it.mode==="reps" ? it.value : null,
          exName: ex?.name,
          ropeId: b.ropeId,
          blockIdx: bi,
          blockLetter: b.letter,
          itemIdx: ii,
        });
      });
    });
    return out;
  }, [routine]);

  const [idx, setIdx] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);   // seconds inside current step
  const [running, setRunning] = React.useState(true);
  const [hr, setHr] = React.useState(132);
  const [calBurnt, setCalBurnt] = React.useState(0);
  const [showConfirmExit, setShowConfirmExit] = React.useState(false);

  const step = steps[idx];
  const total = steps.reduce((s,st)=>s+st.duration,0);
  const elapsedTotal = steps.slice(0,idx).reduce((s,st)=>s+st.duration,0) + elapsed;

  // tick
  React.useEffect(()=>{
    if (!running || !step) return;
    const t = setInterval(()=>{
      setElapsed(e=>{
        if (e+1 >= step.duration) {
          if (idx+1 >= steps.length) {
            setRunning(false);
            return step.duration;
          }
          setIdx(i=>i+1);
          return 0;
        }
        return e+1;
      });
      setHr(h => {
        const drift = step.kind==="ex" ? (Math.random()*4-1) : (Math.random()*3-2);
        return Math.max(110, Math.min(175, h + drift));
      });
      setCalBurnt(c=> c + (step.kind==="ex" ? 0.12 : 0.04));
    }, 1000);
    return ()=>clearInterval(t);
  }, [running, idx, step, steps]);

  // keyboard
  React.useEffect(()=>{
    const fn = (e)=>{
      if (e.key===" ") { e.preventDefault(); setRunning(r=>!r); }
      else if (e.key==="ArrowRight" || e.key==="n") { setIdx(i=>Math.min(steps.length-1,i+1)); setElapsed(0); }
      else if (e.key==="ArrowLeft"  || e.key==="p") { setIdx(i=>Math.max(0,i-1)); setElapsed(0); }
      else if (e.key==="Escape") setShowConfirmExit(true);
    };
    window.addEventListener("keydown", fn);
    return ()=>window.removeEventListener("keydown", fn);
  }, [steps.length]);

  if (!step) {
    return (
      <div className="workout-shell">
        <div style={{display:"grid",placeItems:"center",height:"100dvh",padding:40,textAlign:"center"}}>
          <div>
            <div className="eyebrow">WORKOUT COMPLETADO</div>
            <h1 style={{fontSize:64,margin:"12px 0"}}>¡Buen trabajo!</h1>
            <button className="btn primary lg" onClick={onComplete}>Ver resumen</button>
          </div>
        </div>
      </div>
    );
  }

  const remaining = step.duration - elapsed;
  const totalProgress = (elapsedTotal / total) * 100;

  // Find next non-transition exercise step
  const nextEx = steps.slice(idx+1).find(s=>s.kind==="ex");

  const block = routine.blocks[step.blockIdx];
  const exercisesInBlock = block.items.filter(i=>i.kind==="ex");
  const exNumInBlock = step.kind==="ex"
    ? block.items.slice(0, step.itemIdx+1).filter(i=>i.kind==="ex").length
    : 0;
  const rope = getRope(step.ropeId || block.ropeId);

  // Upcoming rope change warning
  const upcoming = steps.slice(idx+1, idx+6).find(s=>s.kind==="transition");
  const upcomingIn = upcoming ? (steps.slice(idx, steps.indexOf(upcoming)).reduce((s,st,i)=> s + (i===0 ? (st.duration-elapsed) : st.duration), 0)) : null;

  return (
    <div className="workout-shell">
      <div className="workout-top">
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button className="btn icon ghost" onClick={()=>setShowConfirmExit(true)} title="Salir"><Icon name="back" size={16}/></button>
          <div>
            <div className="eyebrow">EN CURSO</div>
            <div style={{fontWeight:700,fontSize:18}}>{routine.name}</div>
          </div>
        </div>
        <div style={{flex:1,maxWidth:520,margin:"0 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}} className="mono muted">
            <span>{fmtTime(elapsedTotal)}</span>
            <span>{Math.round(totalProgress)}%</span>
            <span>{fmtTime(total)}</span>
          </div>
          <div className="bar"><i style={{width: totalProgress+"%"}}/></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span className="chip"><Icon name="heart" size={11}/> {Math.round(hr)} bpm</span>
        </div>
      </div>

      <div className="workout-stage" style={{position:"relative",gridTemplateColumns:"1fr"}}>
        {step.kind === "transition" ? (
          <RopeChange step={step} elapsed={elapsed} remaining={remaining} fromRope={getRope(step.fromRope)} toRope={getRope(step.toRope)}/>
        ) : (
          <>
            <div className="workout-center">
              <div style={{position:"absolute",top:28,left:0,right:0,display:"flex",justifyContent:"center",gap:12,alignItems:"center"}}>
                <span className="eyebrow">BLOQUE {step.blockLetter}</span>
                <span className="mono muted">·</span>
                <span className="eyebrow">EJ {exNumInBlock} / {exercisesInBlock.length}</span>
                {step.kind==="rest" && <><span className="mono muted">·</span><span className="chip warn">DESCANSO</span></>}
              </div>

              {/* Cuerda actual: discreta, esquina superior derecha */}
              <div style={{position:"absolute",top:24,right:28,display:"flex",alignItems:"center",gap:10}}>
                <span style={{width:14,height:14,borderRadius:"50%",background:rope.color,border:"1px solid var(--line-c)"}}/>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:600,lineHeight:1.1}}>{rope.name}</div>
                  <div className="mono muted" style={{fontSize:11}}>{rope.weight}g</div>
                </div>
              </div>

              <div style={{display:"flex",alignItems:"center",gap:18}}>
                {step.kind==="rest" ? (
                  <div className="serif" style={{fontSize:48,color:"var(--fg-2)"}}>Descanso</div>
                ) : (
                  <>
                    <ExerciseIcon name={step.exName}/>
                    <div style={{textAlign:"left"}}>
                      <div className="eyebrow">SALTO</div>
                      <div style={{fontSize:36,fontWeight:700,letterSpacing:"-0.02em",lineHeight:1.1}}>{step.exName}</div>
                      {step.mode==="reps" && <div className="mono muted" style={{marginTop:6}}>objetivo {step.reps} reps</div>}
                    </div>
                  </>
                )}
              </div>

              <div className="big-timer">{fmtTime(remaining)}</div>

              {/* Block progress */}
              <div style={{width:"min(620px, 80%)"}}>
                <div className="bar"><i style={{width: ((elapsed/step.duration)*100)+"%"}}/></div>
              </div>

              {/* Next + aviso de cambio */}
              <div style={{display:"flex",alignItems:"center",gap:14,marginTop:4,flexWrap:"wrap",justifyContent:"center"}}>
                {nextEx && (
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
                    <span className="eyebrow">NEXT</span>
                    <span style={{fontWeight:600}}>{nextEx.exName}</span>
                    <span className="muted mono" style={{fontSize:11}}>{nextEx.mode==="time" ? fmtTime(nextEx.duration) : nextEx.reps+" reps"}</span>
                  </div>
                )}
                {upcoming && (
                  <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--warn)"}}>
                    <span style={{width:10,height:10,borderRadius:"50%",background:getRope(upcoming.toRope).color,border:"1px solid var(--line-c)"}}/>
                    <span>cambio en ~{fmtTime(upcomingIn)}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="workout-bottom">
        <button className="btn lg" onClick={()=>{ setIdx(i=>Math.max(0,i-1)); setElapsed(0); }}>
          <Icon name="skip" size={14} className="" /><span style={{transform:"scaleX(-1)",display:"inline-block"}}>↺</span> Anterior
        </button>
        <button className="btn primary xl" onClick={()=>setRunning(r=>!r)} style={{minWidth:200}}>
          {running ? <><Icon name="pause" size={18}/> Pausa</> : <><Icon name="play" size={18}/> Reanudar</>}
        </button>
        <button className="btn lg" onClick={()=>{ setIdx(i=>Math.min(steps.length-1,i+1)); setElapsed(0); }}>
          Siguiente <Icon name="skip" size={14}/>
        </button>
      </div>

      {showConfirmExit && (
        <Modal title="¿Salir del workout?" onClose={()=>setShowConfirmExit(false)}
          actions={<>
            <button className="btn ghost" onClick={()=>setShowConfirmExit(false)}>Continuar</button>
            <button className="btn danger" onClick={onExit}>Salir sin guardar</button>
          </>}>
          <p className="muted" style={{fontSize:14}}>
            Llevas {fmtTime(elapsedTotal)} de {fmtTime(total)}. Si sales ahora se guardará como sesión parcial.
          </p>
        </Modal>
      )}
    </div>
  );
}

function RopeChange({ step, elapsed, remaining, fromRope, toRope }){
  return (
    <div style={{gridColumn:"1 / -1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px",gap:24,position:"relative"}}>
      <div className="eyebrow" style={{color:"var(--warn)"}}>CAMBIO DE CUERDA</div>
      <h1 style={{fontSize:48,margin:"0",textAlign:"center"}}>Prepara tu próxima cuerda</h1>

      <div style={{display:"flex",alignItems:"center",gap:40,marginTop:10}}>
        <div style={{textAlign:"center",opacity:0.5}}>
          <span style={{width:80,height:80,borderRadius:16,background:fromRope.color,display:"inline-block",border:"1px solid var(--line-c)"}}/>
          <div style={{marginTop:10,fontWeight:600}}>{fromRope.name}</div>
          <div className="mono muted" style={{fontSize:12}}>{fromRope.weight}g</div>
        </div>
        <Icon name="chevron-right" size={32}/>
        <div style={{textAlign:"center"}}>
          <span style={{width:120,height:120,borderRadius:24,background:toRope.color,display:"inline-block",border:"1px solid var(--line-c)",boxShadow:"0 0 40px color-mix(in oklab, "+toRope.color+" 50%, transparent)"}}/>
          <div style={{marginTop:10,fontSize:22,fontWeight:700}}>{toRope.name}</div>
          <div className="mono muted">{toRope.weight}g · {toRope.type}</div>
        </div>
      </div>

      <div className="big-timer" style={{fontSize:"clamp(90px,14vw,180px)",marginTop:10}}>{fmtTime(remaining)}</div>
      <div style={{width:"min(520px,80%)"}}>
        <div className="bar"><i style={{width: ((elapsed/step.duration)*100)+"%",background:"var(--warn)"}}/></div>
      </div>
    </div>
  );
}

function ExerciseIcon({ name }){
  // Mini jumping figure — same motion as the login animation, scaled down.
  return (
    <div style={{
      width:96,height:96,borderRadius:20,
      background:"var(--bg-1)",border:"1px solid var(--line-c)",
      display:"grid",placeItems:"center",flex:"none",
      position:"relative",overflow:"hidden",
    }}>
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
        {/* Floor shadow */}
        <ellipse cx="50" cy="86" rx="16" ry="2" fill="#000" opacity="0.35">
          <animate attributeName="rx"      values="16;11;7;11;16"          keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.35;0.22;0.1;0.22;0.35" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
        </ellipse>

        {/* Jumper + rope group — translates up at peak */}
        <g>
          <animateTransform attributeName="transform" type="translate"
                            values="0 0; 0 -3; 0 -10; 0 -3; 0 0"
                            keyTimes="0;0.25;0.5;0.75;1"
                            dur="0.62s" repeatCount="indefinite"/>

          {/* Rope — BACK pass (behind person, visible when above head) */}
          <path fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
            <animate attributeName="d"
              keyTimes="0;0.25;0.5;0.75;1"
              values="M 32 52 C 32 14, 68 14, 68 52;
                      M 32 52 C 50 52, 70 52, 68 52;
                      M 32 52 C 32 88, 68 88, 68 52;
                      M 32 52 C 30 52, 50 52, 68 52;
                      M 32 52 C 32 14, 68 14, 68 52"
              dur="0.62s" repeatCount="indefinite"/>
            <animate attributeName="opacity"
              keyTimes="0;0.25;0.5;0.75;1"
              values="1;0.35;0;0.35;1"
              dur="0.62s" repeatCount="indefinite"/>
          </path>

          {/* Person */}
          <g fill="var(--fg)">
            <circle cx="50" cy="34" r="6"/>
            <rect x="45" y="40" width="10" height="20" rx="4"/>
            {/* Arms */}
            <rect x="38" y="44" width="9" height="3.5" rx="1.8" transform="rotate(12 42 46)"/>
            <rect x="53" y="44" width="9" height="3.5" rx="1.8" transform="rotate(-12 58 46)"/>
            {/* Handles */}
            <rect x="29" y="49" width="5" height="7" rx="1.5"/>
            <rect x="66" y="49" width="5" height="7" rx="1.5"/>
            {/* Legs — tuck up at peak */}
            <rect x="46.5" y="60" width="3" height="22" rx="1.5">
              <animate attributeName="height" values="22;19;15;19;22" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
            </rect>
            <rect x="50.5" y="60" width="3" height="22" rx="1.5">
              <animate attributeName="height" values="22;19;15;19;22" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
            </rect>
          </g>

          {/* Rope — FRONT pass (in front of person, visible when under feet) */}
          <path fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
            <animate attributeName="d"
              keyTimes="0;0.25;0.5;0.75;1"
              values="M 32 52 C 32 14, 68 14, 68 52;
                      M 32 52 C 50 52, 70 52, 68 52;
                      M 32 52 C 32 88, 68 88, 68 52;
                      M 32 52 C 30 52, 50 52, 68 52;
                      M 32 52 C 32 14, 68 14, 68 52"
              dur="0.62s" repeatCount="indefinite"/>
            <animate attributeName="opacity"
              keyTimes="0;0.25;0.5;0.75;1"
              values="0;0.35;1;0.35;0"
              dur="0.62s" repeatCount="indefinite"/>
          </path>
        </g>
      </svg>
    </div>
  );
}

window.Workout = Workout;
