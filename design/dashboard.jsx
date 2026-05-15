// Dashboard screen

function Dashboard({ user, onRoute, onStart }){
  const nextRoutine = ROUTINES[0];
  const recent = HISTORY.slice(0,5);
  // streak heatmap row (last 12 weeks)
  const today = new Date(2026,4,11);
  const histSet = new Set(HISTORY.map(h=>h.date));
  const cells = [];
  for (let i=12*7-1; i>=0; i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    const iso = d.toISOString().slice(0,10);
    const has = histSet.has(iso);
    const intensity = has ? (1 + (i%4)) : 0;
    cells.push({iso, l: intensity});
  }

  // quick stats
  const totalMin = HISTORY.reduce((s,h)=>s+h.duration,0);
  const streak = 6;
  const weekMin = HISTORY.filter(h=>{
    const d = new Date(h.date); return (today - d) <= 7*24*3600*1000;
  }).reduce((s,h)=>s+h.duration,0);

  return (
    <div className="scroll-area">
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:20,marginBottom:32,flexWrap:"wrap"}}>
        <div>
          <div className="eyebrow">{new Date(today).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}</div>
          <h1 style={{marginTop:6}}>Hola, <span className="serif" style={{color:"var(--accent)"}}>{user.name}</span></h1>
        </div>
      </div>

      <div className="grid grid-3" style={{marginBottom:28}}>
        <Stat label="Esta semana"       value={weekMin} unit="min" sub="objetivo 180"/>
        <Stat label="Streak"            value={streak} unit="días" sub="récord 14"/>
        <Stat label="Tiempo total"      value={`${Math.floor(totalMin/60)}h`} sub="histórico"/>
      </div>

      <div className="grid" style={{gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:28}}>
        <div className="card">
          <div className="eyebrow" style={{marginBottom:8}}>PRÓXIMO WORKOUT</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
            <div style={{flex:"1 1 240px"}}>
              <div style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em"}}>{nextRoutine.name}</div>
              <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                <span className="chip">{Math.round(routineDuration(nextRoutine)/60)} min</span>
                <span className="chip">{nextRoutine.blocks.length} bloques</span>
                <span className="chip">{new Set(nextRoutine.blocks.map(b=>b.ropeId)).size} cuerdas</span>
              </div>
            </div>
            <div style={{flex:"1 1 200px",minWidth:200}}>
              <RoutineBlocksStrip routine={nextRoutine}/>
              <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
                {nextRoutine.blocks.map((b,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                    <span className="mono faded">{b.letter}</span>
                    <span style={{width:10,height:10,borderRadius:"50%",background:getRope(b.ropeId).color}}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{display:"flex",flexDirection:"column",justifyContent:"space-between",gap:14}}>
          <div>
            <div className="eyebrow">UNA ACCIÓN</div>
            <h3 style={{marginTop:8,fontSize:22}}>Empieza a saltar</h3>
            <p className="muted" style={{fontSize:13,marginTop:6}}>O elige otra rutina.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button className="btn primary lg" onClick={onStart} style={{justifyContent:"center"}}>
              <Icon name="play" size={14}/> {nextRoutine.name}
            </button>
            <button className="btn" onClick={()=>onRoute("routines")} style={{justifyContent:"center"}}>
              Ver rutinas
            </button>
          </div>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"2fr 1fr",gap:16}}>
        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h3 style={{marginBottom:0}}>Sesiones recientes</h3>
            <button className="btn ghost" onClick={()=>onRoute("history")} style={{padding:"6px 10px",fontSize:13}}>
              Ver todo <Icon name="chevron-right" size={14}/>
            </button>
          </div>
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Rutina</th><th>Duración</th><th></th></tr>
            </thead>
            <tbody>
              {recent.slice(0,4).map(h=>(
                <tr key={h.id} className="clickable" onClick={()=>onRoute("history")}>
                  <td className="mono">{h.date}</td>
                  <td>{h.routineName}</td>
                  <td className="mono">{h.duration}m</td>
                  <td>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      {[...new Set(h.ropes)].map(rid=>{
                        const r = getRope(rid);
                        return <span key={rid} title={r.name} style={{width:10,height:10,borderRadius:"50%",background:r.color,display:"inline-block"}}/>;
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h3 style={{marginBottom:0}}>Actividad</h3>
            <span className="muted mono" style={{fontSize:11}}>12 semanas</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <div className="heatmap">
              {cells.map((c,i)=>(<div key={i} className="cell" data-l={c.l}/>))}
            </div>
          </div>
          <div style={{marginTop:14}}>
            <button className="btn ghost" style={{padding:"4px 0",fontSize:12}} onClick={()=>onRoute("stats")}>
              Ver detalles <Icon name="chevron-right" size={12}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
