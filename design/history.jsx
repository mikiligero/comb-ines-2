// History list + detail

function History({ onRoute }){
  const [filter, setFilter] = React.useState("all"); // all | completed | partial
  const [selected, setSelected] = React.useState(null);

  const list = HISTORY.filter(h => filter==="all" ? true : filter==="completed" ? h.completed : !h.completed);

  return (
    <>
      <Topbar title="Histórico" right={
        <>
          <div className="seg" style={{display:"flex",background:"var(--bg-2)",borderRadius:8,padding:2,border:"1px solid var(--line-c)"}}>
            {[["all","Todas"],["completed","Completadas"],["partial","Parciales"]].map(([k,l])=>(
              <button key={k}
                onClick={()=>setFilter(k)}
                style={{
                  appearance:"none",border:0,background: filter===k?"var(--bg-3)":"transparent",
                  color:filter===k?"var(--fg)":"var(--fg-2)",
                  font:"inherit",fontSize:12,fontWeight:600,
                  padding:"6px 12px",borderRadius:6,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",
                }}>{l}</button>
            ))}
          </div>
        </>
      }/>
      <div className="scroll-area">
        <div className="grid grid-3" style={{marginBottom:20}}>
          <Stat label="Sesiones"        value={HISTORY.length}/>
          <Stat label="Tiempo total"    value={`${Math.floor(HISTORY.reduce((s,h)=>s+h.duration,0)/60)}h`}/>
          <Stat label="Saltos"          value={(HISTORY.reduce((s,h)=>s+h.jumps,0)/1000).toFixed(1)+"k"}/>
        </div>

        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Rutina</th>
                <th>Duración</th>
                <th>Saltos</th>
                <th>Cuerdas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(h=>(
                <tr key={h.id} className="clickable" onClick={()=>setSelected(h)}>
                  <td className="mono">{h.date}</td>
                  <td>{h.routineName} {!h.completed && <span className="chip warn" style={{marginLeft:6}}>parcial</span>}</td>
                  <td className="mono">{h.duration} min</td>
                  <td className="mono">{h.jumps.toLocaleString("es-ES")}</td>
                  <td>
                    <div style={{display:"flex",gap:4}}>
                      {[...new Set(h.ropes)].map(rid=>{
                        const r = getRope(rid);
                        return <span key={rid} title={r.name} style={{width:12,height:12,borderRadius:"50%",background:r.color,display:"inline-block",border:"1px solid var(--line-c)"}}/>;
                      })}
                    </div>
                  </td>
                  <td><Icon name="chevron-right" size={14} className="muted"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <WorkoutDetail h={selected} onClose={()=>setSelected(null)}/>}
    </>
  );
}

function WorkoutDetail({ h, onClose }){
  const rt = ROUTINES.find(r=>r.id===h.routineId);
  return (
    <Modal title={"Sesión · "+h.date} onClose={onClose}
      actions={<>
        <button className="btn ghost" onClick={onClose}>Cerrar</button>
        <button className="btn primary">Repetir rutina</button>
      </>}>
      <div>
        <div className="eyebrow">RUTINA</div>
        <div style={{fontSize:22,fontWeight:700,marginTop:4}}>{h.routineName}</div>
      </div>
      <div className="grid grid-3" style={{gap:10}}>
        <div className="card" style={{padding:"12px 14px"}}>
          <div className="eyebrow">DURACIÓN</div>
          <div className="display" style={{fontSize:24,marginTop:4}}>{h.duration}<span className="mono muted" style={{fontSize:12,marginLeft:4}}>min</span></div>
        </div>
        <div className="card" style={{padding:"12px 14px"}}>
          <div className="eyebrow">SALTOS</div>
          <div className="display" style={{fontSize:24,marginTop:4}}>{h.jumps.toLocaleString("es-ES")}</div>
        </div>
        <div className="card" style={{padding:"12px 14px"}}>
          <div className="eyebrow">HR MEDIA</div>
          <div className="display" style={{fontSize:24,marginTop:4}}>{h.avgHr}<span className="mono muted" style={{fontSize:12,marginLeft:4}}>bpm</span></div>
        </div>
      </div>

      {rt && (
        <div>
          <div className="eyebrow" style={{marginBottom:8}}>BLOQUES</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {rt.blocks.map((b,i)=>{
              const r = getRope(b.ropeId);
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"var(--bg-2)",borderRadius:8,border:"1px solid var(--line-c)"}}>
                  <span className="mono" style={{fontWeight:700,width:18}}>{b.letter}</span>
                  <span style={{width:14,height:14,borderRadius:"50%",background:r.color}}/>
                  <span style={{fontSize:13,flex:1}}>{r.name}</span>
                  <span className="mono muted" style={{fontSize:12}}>{b.items.filter(i=>i.kind==="ex").length} ej</span>
                  <span className="mono muted" style={{fontSize:12}}>{fmtTime(blockDuration(b))}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

window.History = History;
