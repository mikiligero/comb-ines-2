// Routines list + editor with blocks (A, B, C…)

function Routines({ onRoute, onStartRoutine }){
  const [routines, setRoutines] = React.useState(ROUTINES);
  const [selected, setSelected] = React.useState(routines[0].id);
  const [newOpen, setNewOpen] = React.useState(false);

  const rt = routines.find(r=>r.id===selected) || routines[0];

  const updateRoutine = (next)=> setRoutines(rs => rs.map(r=>r.id===next.id?next:r));

  const addBlock = ()=>{
    const letter = String.fromCharCode(65 + rt.blocks.length);
    updateRoutine({...rt, blocks:[...rt.blocks, {letter, ropeId:ROPES[0].id, items:[
      {kind:"ex", exId:EXERCISES[0].id, mode:"time", value:30},
      {kind:"rest", value:15},
    ]}]});
  };
  const updateBlock = (idx, next)=>{
    const blocks = rt.blocks.map((b,i)=>i===idx?next:b);
    updateRoutine({...rt, blocks});
  };
  const removeBlock = (idx)=>{
    const blocks = rt.blocks.filter((_,i)=>i!==idx).map((b,i)=>({...b, letter:String.fromCharCode(65+i)}));
    updateRoutine({...rt, blocks});
  };

  return (
    <>
      <Topbar title="Rutinas" right={
        <>
          <span className="chip">{routines.length} rutinas</span>
          <button className="btn primary" onClick={()=>setNewOpen(true)}>
            <Icon name="plus" size={14}/> Nueva rutina
          </button>
        </>
      }/>
      <div className="scroll-area" style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20,padding:0,height:"100%"}}>
        <div style={{borderRight:"1px solid var(--line-c)",overflow:"auto",padding:"18px 16px"}}>
          <div className="eyebrow" style={{marginBottom:10}}>TUS RUTINAS</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {routines.map(r=>(
              <button key={r.id}
                onClick={()=>setSelected(r.id)}
                className="card"
                style={{
                  textAlign:"left",cursor:"pointer",
                  padding:"12px 14px",
                  border:"1px solid "+(selected===r.id?"var(--fg)":"var(--line-c)"),
                  background:selected===r.id?"var(--bg-2)":"var(--bg-1)",
                  fontFamily:"inherit",color:"inherit",
                }}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                  <b style={{fontSize:14}}>{r.name}</b>
                  <span className="mono faded" style={{fontSize:11}}>{Math.round(routineDuration(r)/60)}m</span>
                </div>
                <div style={{marginTop:8}}><RoutineBlocksStrip routine={r}/></div>
                <div className="muted" style={{fontSize:11,marginTop:6,fontFamily:"'JetBrains Mono',monospace"}}>
                  {r.blocks.length} bloques · {new Set(r.blocks.map(b=>b.ropeId)).size} cuerdas
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{overflow:"auto",padding:"22px 28px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:18}}>
            <div style={{flex:"1 1 360px"}}>
              <input className="input" value={rt.name} onChange={e=>updateRoutine({...rt, name:e.target.value})}
                style={{fontSize:28,fontWeight:700,padding:"4px 6px",border:"0",background:"transparent",marginLeft:-6}}/>
              <textarea className="input" value={rt.description} onChange={e=>updateRoutine({...rt, description:e.target.value})}
                rows={2} style={{marginTop:6,fontSize:14,resize:"vertical"}}/>
            </div>
            <div className="card" style={{padding:"14px 18px",minWidth:200}}>
              <div className="eyebrow">RESUMEN</div>
              <div style={{display:"flex",gap:24,marginTop:8}}>
                <div><div className="display" style={{fontSize:24}}>{Math.round(routineDuration(rt)/60)}<span className="mono muted" style={{fontSize:12,marginLeft:4}}>min</span></div><div className="muted" style={{fontSize:11}}>duración</div></div>
                <div><div className="display" style={{fontSize:24}}>{rt.blocks.length}</div><div className="muted" style={{fontSize:11}}>bloques</div></div>
              </div>
            </div>
          </div>

          <div className="card" style={{padding:"14px 18px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
            <div>
              <div className="eyebrow">CAMBIO DE CUERDA</div>
              <div className="muted" style={{fontSize:13,marginTop:4}}>Tiempo entre bloques cuando hay que cambiar de cuerda.</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input className="input mono" type="number" min={0} max={120} value={rt.transitionSec}
                     onChange={e=>updateRoutine({...rt, transitionSec: +e.target.value})}
                     style={{width:80,textAlign:"center"}}/>
              <span className="muted mono">segundos</span>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {rt.blocks.map((b,bi)=>(
              <BlockEditor key={bi} block={b}
                onChange={(nb)=>updateBlock(bi,nb)}
                onRemove={()=>removeBlock(bi)}/>
            ))}
            <button className="btn" style={{alignSelf:"flex-start"}} onClick={addBlock}>
              <Icon name="plus" size={14}/> Añadir bloque {String.fromCharCode(65+rt.blocks.length)}
            </button>
          </div>

          <div style={{display:"flex",gap:10,marginTop:24}}>
            <button className="btn primary lg" onClick={()=>onStartRoutine(rt)}>
              <Icon name="play" size={14}/> Empezar rutina
            </button>
            <button className="btn">Duplicar</button>
            <span className="spacer"/>
            <button className="btn danger"><Icon name="trash" size={14}/> Eliminar</button>
          </div>
        </div>
      </div>

      {newOpen && (
        <Modal title="Nueva rutina" onClose={()=>setNewOpen(false)}
          actions={<>
            <button className="btn ghost" onClick={()=>setNewOpen(false)}>Cancelar</button>
            <button className="btn primary" onClick={()=>{
              const id = "rt"+Date.now();
              const nuevo = { id, name:"Sin nombre", description:"", createdAt:"2026-05-11", transitionSec:15, blocks:[{letter:"A",ropeId:ROPES[0].id,items:[{kind:"ex",exId:EXERCISES[0].id,mode:"time",value:30},{kind:"rest",value:15}]}] };
              setRoutines(rs=>[nuevo, ...rs]); setSelected(id); setNewOpen(false);
            }}>Crear</button>
          </>}>
          <p className="muted" style={{fontSize:14}}>Crea una rutina vacía con un bloque inicial. Podrás ajustar todo después.</p>
        </Modal>
      )}
    </>
  );
}

function BlockEditor({ block, onChange, onRemove }){
  const rope = getRope(block.ropeId);
  const addEx  = ()=> onChange({...block, items:[...block.items, {kind:"ex", exId:EXERCISES[0].id, mode:"time", value:30}]});
  const addRest= ()=> onChange({...block, items:[...block.items, {kind:"rest", value:15}]});
  const update = (idx, next)=> onChange({...block, items: block.items.map((it,i)=>i===idx?next:it)});
  const remove = (idx)=> onChange({...block, items: block.items.filter((_,i)=>i!==idx)});

  const dur = blockDuration(block);

  return (
    <div className="block">
      <div className="block-hd">
        <div className="block-letter">{block.letter}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:15}}>Bloque {block.letter}</div>
          <div className="muted mono" style={{fontSize:11}}>{block.items.filter(i=>i.kind==="ex").length} ejercicios · {fmtTime(dur)}</div>
        </div>
        <label className="rope-swatch" style={{position:"relative"}}>
          <span className="dot" style={{background:rope.color}}/>
          <select className="input" value={block.ropeId} onChange={e=>onChange({...block, ropeId:e.target.value})}
            style={{padding:"6px 28px 6px 8px",fontSize:13,height:32,minWidth:160}}>
            {ROPES.map(r=>(<option key={r.id} value={r.id}>{r.name} · {r.weight}g</option>))}
          </select>
        </label>
        <button className="btn icon ghost" onClick={onRemove}><Icon name="trash" size={14}/></button>
      </div>
      <div className="block-body">
        {block.items.map((it,idx)=>(
          <div key={idx} className="exercise-row">
            <span className="handle"><Icon name="drag" size={14}/></span>
            {it.kind==="ex" ? (
              <select className="input" value={it.exId} onChange={e=>update(idx,{...it, exId:e.target.value})}
                style={{padding:"7px 10px",fontSize:14,height:34}}>
                {EXERCISES.map(e=>(<option key={e.id} value={e.id}>{e.name}</option>))}
              </select>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:8,color:"var(--fg-2)",fontStyle:"italic",paddingLeft:6}}>
                <span className="tag">REST</span>
                <span style={{fontSize:14}}>Descanso</span>
              </div>
            )}
            {it.kind==="ex" ? (
              <div className="seg" role="tablist">
                <button className={it.mode==="time"?"on":""} onClick={()=>update(idx,{...it, mode:"time"})}>TIEMPO</button>
                <button className={it.mode==="reps"?"on":""} onClick={()=>update(idx,{...it, mode:"reps"})}>REPS</button>
              </div>
            ) : <span/>}
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input className="input mono" type="number" min={1} value={it.value}
                onChange={e=>update(idx,{...it, value:+e.target.value})}
                style={{width:70,textAlign:"center",padding:"6px 8px",height:34,fontSize:14}}/>
              <span className="muted mono" style={{fontSize:11,width:24}}>
                {it.kind==="rest" || it.mode==="time" ? "seg" : "reps"}
              </span>
            </div>
            <button className="btn icon ghost" onClick={()=>remove(idx)}><Icon name="x" size={14}/></button>
          </div>
        ))}
        <div style={{display:"flex",gap:8,padding:"10px 18px 14px"}}>
          <button className="btn ghost" onClick={addEx} style={{padding:"6px 12px",fontSize:13}}>
            <Icon name="plus" size={12}/> Salto
          </button>
          <button className="btn ghost" onClick={addRest} style={{padding:"6px 12px",fontSize:13}}>
            <Icon name="plus" size={12}/> Descanso
          </button>
        </div>
      </div>
    </div>
  );
}

window.Routines = Routines;
