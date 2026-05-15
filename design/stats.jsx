// Statistics

function Stats({ onRoute }){
  const [range, setRange] = React.useState("year");
  const today = new Date(2026,4,11);
  const days = range==="year" ? 365 : range==="6m" ? 182 : 90;

  const histSet = new Map();
  HISTORY.forEach(h=> histSet.set(h.date, (histSet.get(h.date)||0)+1));

  const cells = [];
  for (let i=days-1; i>=0; i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    const iso = d.toISOString().slice(0,10);
    const has = histSet.has(iso);
    const l = has ? Math.min(4, 1 + (i%4)) : 0;
    cells.push({iso, l});
  }

  // weekly aggregated minutes for line chart
  const weekly = [];
  for (let w=0; w<12; w++){
    const end = new Date(today); end.setDate(end.getDate() - w*7);
    const start = new Date(end); start.setDate(start.getDate()-6);
    const min = HISTORY.filter(h=>{
      const d = new Date(h.date); return d>=start && d<=end;
    }).reduce((s,h)=>s+h.duration,0);
    weekly.unshift({week:w, min});
  }
  const maxW = Math.max(...weekly.map(w=>w.min), 1);

  return (
    <>
      <Topbar title="Estadísticas" right={
        <div style={{display:"flex",background:"var(--bg-2)",borderRadius:8,padding:2,border:"1px solid var(--line-c)"}}>
          {[["3m","3M"],["6m","6M"],["year","1A"]].map(([k,l])=>(
            <button key={k} onClick={()=>setRange(k)}
              style={{
                appearance:"none",border:0,background:range===k?"var(--bg-3)":"transparent",
                color:range===k?"var(--fg)":"var(--fg-2)",
                font:"inherit",fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",
                padding:"6px 14px",borderRadius:6,cursor:"pointer",
              }}>{l}</button>
          ))}
        </div>
      }/>
      <div className="scroll-area">

        <div className="grid grid-3" style={{marginBottom:24}}>
          <Stat label="Tiempo total" value={Math.floor(HISTORY.reduce((s,h)=>s+h.duration,0)/60)+"h"}/>
          <Stat label="Workouts" value={HISTORY.length}/>
          <Stat label="Streak" value={6} unit="días"/>
        </div>

        <div className="card" style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h3 style={{marginBottom:0}}>Actividad · {range==="year"?"último año":range==="6m"?"6 meses":"3 meses"}</h3>
            <div className="muted mono" style={{fontSize:11}}>{HISTORY.length} sesiones</div>
          </div>
          <div style={{overflowX:"auto"}}>
            <div className="heatmap" style={{display:"grid",gridTemplateRows:"repeat(7,1fr)",gridAutoFlow:"column",gap:3}}>
              {cells.map((c,i)=>(<div key={i} className="cell" data-l={c.l} title={`${c.iso}`}/>))}
            </div>
          </div>
        </div>

      <div className="split-2-1" style={{marginBottom:20}}>
          <div className="card">
            <h3>Minutos por semana</h3>
            <div style={{display:"flex",alignItems:"flex-end",gap:6,height:200,marginTop:14}}>
              {weekly.map((w,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}} title={w.min+" min"}>
                  <div style={{width:"100%",background: i===weekly.length-1?"var(--accent)":"var(--fg-3)",height:`${(w.min/maxW)*100}%`,minHeight:2,borderRadius:"4px 4px 0 0"}}/>
                  <span className="mono faded" style={{fontSize:10}}>S{i+1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Distribución por salto</h3>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
              {JUMP_DISTRIBUTION.map((d,i)=>(
                <div key={i}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                    <span>{d.name}</span>
                    <span className="mono muted">{d.pct}%</span>
                  </div>
                  <div className="bar thin"><i style={{width:d.pct+"%"}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Récords personales</h3>
          <div className="grid grid-2" style={{marginTop:10,gap:10}}>
            {PRS.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"var(--bg-2)",borderRadius:10,border:"1px solid var(--line-c)"}}>
                <div style={{width:42,height:42,borderRadius:10,background:"var(--accent)",color:"var(--accent-ink)",display:"grid",placeItems:"center",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>PR</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="muted" style={{fontSize:12}}>{p.name}</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:2}}>
                    <span className="display" style={{fontSize:24}}>{p.value}</span>
                    <span className="mono muted" style={{fontSize:11}}>{p.unit}</span>
                  </div>
                </div>
                <div className="mono faded" style={{fontSize:11}}>{p.on}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

window.Stats = Stats;
