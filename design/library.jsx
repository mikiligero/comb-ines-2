// Library — Ropes + Exercises management

function Ropes(){
  const [ropes, setRopes] = React.useState(ROPES);
  const [editing, setEditing] = React.useState(null); // rope object or "new"

  const newRope = ()=> setEditing({id:"r"+Date.now(), name:"Nueva cuerda", color:"#D4FF3A", weight:80, type:"Speed", bought:"2026-05-11", isNew:true});

  return (
    <>
      <Topbar title="Cuerdas" right={
        <button className="btn primary" onClick={newRope}><Icon name="plus" size={14}/> Nueva cuerda</button>
      }/>
      <div className="scroll-area">
        <div className="grid grid-3">
          {ropes.map(r=>(
            <button key={r.id} className="card" onClick={()=>setEditing({...r})}
              style={{textAlign:"left",cursor:"pointer",padding:0,overflow:"hidden",border:"1px solid var(--line-c)",background:"var(--bg-1)",fontFamily:"inherit",color:"inherit"}}>
              <div style={{height:80,background:r.color,position:"relative"}}>
                <span style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.35)",color:"#fff",padding:"3px 8px",borderRadius:6,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600}}>{r.color.toUpperCase()}</span>
              </div>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontSize:16,fontWeight:700}}>{r.name}</div>
                <div className="muted mono" style={{fontSize:12,marginTop:4,display:"flex",justifyContent:"space-between"}}>
                  <span>{r.weight}g</span>
                  <span>{r.type}</span>
                </div>
              </div>
            </button>
          ))}
          <button className="card flat" onClick={newRope} style={{display:"grid",placeItems:"center",cursor:"pointer",minHeight:160,color:"var(--fg-2)",fontFamily:"inherit",fontSize:14,background:"transparent"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <Icon name="plus" size={20}/>
              <span>Añadir cuerda</span>
            </div>
          </button>
        </div>
      </div>

      {editing && (
        <Modal title={editing.isNew ? "Nueva cuerda" : "Editar cuerda"} onClose={()=>setEditing(null)}
          actions={<>
            <button className="btn ghost" onClick={()=>setEditing(null)}>Cancelar</button>
            <button className="btn primary" onClick={()=>{
              setRopes(rs => {
                if (editing.isNew) return [{...editing, isNew:undefined}, ...rs];
                return rs.map(r=>r.id===editing.id?editing:r);
              });
              setEditing(null);
            }}>Guardar</button>
          </>}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:72,height:72,borderRadius:14,background:editing.color,border:"1px solid var(--line-c)"}}/>
            <div className="field" style={{flex:1}}>
              <label>Color</label>
              <input className="input" type="color" value={editing.color} onChange={e=>setEditing({...editing, color:e.target.value})} style={{height:42,padding:4}}/>
            </div>
          </div>
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})}/>
          </div>
          <div className="grid grid-2" style={{gap:10}}>
            <div className="field">
              <label>Peso (g)</label>
              <input className="input mono" type="number" value={editing.weight} onChange={e=>setEditing({...editing, weight:+e.target.value})}/>
            </div>
            <div className="field">
              <label>Tipo</label>
              <select className="input" value={editing.type} onChange={e=>setEditing({...editing, type:e.target.value})}>
                {["Speed","Beaded","Weighted","Drag","PVC","Leather"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Exercises(){
  const [list, setList] = React.useState(EXERCISES);
  const [editing, setEditing] = React.useState(null);

  return (
    <>
      <Topbar title="Saltos" right={
        <button className="btn primary" onClick={()=>setEditing({id:"e"+Date.now(),name:"",isNew:true})}>
          <Icon name="plus" size={14}/> Nuevo salto
        </button>
      }/>
      <div className="scroll-area">
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <table className="table">
            <thead>
              <tr><th>Salto</th><th>Veces usado</th><th>Último uso</th><th></th></tr>
            </thead>
            <tbody>
              {list.map(e=>(
                <tr key={e.id} className="clickable" onClick={()=>setEditing({...e})}>
                  <td><b>{e.name}</b></td>
                  <td className="mono">{8 + Math.floor(Math.random()*60)}</td>
                  <td className="mono muted">2026-05-{String(2+Math.floor(Math.random()*9)).padStart(2,"0")}</td>
                  <td><Icon name="chevron-right" size={14} className="muted"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing.isNew?"Nuevo salto":"Editar salto"} onClose={()=>setEditing(null)}
          actions={<>
            <button className="btn ghost" onClick={()=>setEditing(null)}>Cancelar</button>
            <button className="btn primary" onClick={()=>{
              setList(L=> editing.isNew ? [{id:editing.id,name:editing.name}, ...L] : L.map(x=>x.id===editing.id?{id:editing.id,name:editing.name}:x));
              setEditing(null);
            }}>Guardar</button>
          </>}>
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} autoFocus/>
          </div>
        </Modal>
      )}
    </>
  );
}

window.Ropes = Ropes;
window.Exercises = Exercises;
