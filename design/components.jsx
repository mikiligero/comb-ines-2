// Shared components for Comb-ines

function Icon({ name, size=16, className="" }) {
  const s = size;
  const stroke = "currentColor";
  const props = { width:s, height:s, viewBox:"0 0 24 24", fill:"none", stroke, strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round", className:"icon "+className };
  switch (name) {
    case "home":      return <svg {...props}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>;
    case "list":      return <svg {...props}><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
    case "play":      return <svg {...props}><path d="M7 4l13 8-13 8V4z" fill="currentColor" stroke="none"/></svg>;
    case "pause":     return <svg {...props}><rect x="6" y="5" width="4" height="14" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" fill="currentColor" stroke="none"/></svg>;
    case "skip":      return <svg {...props}><path d="M5 5l10 7-10 7V5z" fill="currentColor" stroke="none"/><path d="M19 5v14" strokeWidth="2"/></svg>;
    case "back":      return <svg {...props}><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>;
    case "plus":      return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "history":   return <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
    case "stats":     return <svg {...props}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>;
    case "rope":      return <svg {...props}><path d="M3 12c3 0 3-6 9-6s6 6 9 6"/><path d="M3 18c3 0 3-6 9-6s6 6 9 6"/></svg>;
    case "user":      return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 5-6 8-6s7 2 8 6"/></svg>;
    case "settings":  return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case "search":    return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>;
    case "x":         return <svg {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case "check":     return <svg {...props}><path d="M5 12l5 5 10-12"/></svg>;
    case "flame":     return <svg {...props}><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 0z"/></svg>;
    case "heart":     return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case "chevron-right": return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case "chevron-down":  return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case "more":      return <svg {...props}><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>;
    case "drag":      return <svg {...props}><circle cx="9" cy="6" r="1.3" fill="currentColor"/><circle cx="15" cy="6" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="18" r="1.3" fill="currentColor"/><circle cx="15" cy="18" r="1.3" fill="currentColor"/></svg>;
    case "trash":     return <svg {...props}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>;
    case "logout":    return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>;
    default: return null;
  }
}

function RopeSwatch({ rope, withName=true }){
  if (!rope) return null;
  return (
    <span className="rope-swatch">
      <span className="dot" style={{background: rope.color}} />
      {withName && <span>{rope.name}</span>}
      <span className="muted">· {rope.weight}g</span>
    </span>
  );
}

function Stat({ label, value, unit, sub }){
  return (
    <div className="card" style={{padding:"18px 20px"}}>
      <div className="eyebrow">{label}</div>
      <div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:8}}>
        <span className="display" style={{fontSize:36,lineHeight:1}}>{value}</span>
        {unit && <span className="mono muted" style={{fontSize:13}}>{unit}</span>}
      </div>
      {sub && <div className="muted" style={{fontSize:12,marginTop:6}}>{sub}</div>}
    </div>
  );
}

function Topbar({ title, crumb, right }){
  return (
    <div className="topbar">
      <div className="crumb">
        {crumb && <><span>{crumb}</span><Icon name="chevron-right" size={14}/></>}
        <b>{title}</b>
      </div>
      <div className="right">{right}</div>
    </div>
  );
}

function Sidebar({ route, onRoute, user, onLogout }){
  const Item = ({ icon, label, to, badge }) => (
    <button className={"nav-item " + (route===to ? "active" : "")} onClick={()=>onRoute(to)}>
      <Icon name={icon}/>
      <span>{label}</span>
      <span className="spacer"/>
      {badge && <span className="tag">{badge}</span>}
    </button>
  );
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo-mark">⌇</div>
        <div className="logo-text">Comb<em>-</em>ines</div>
      </div>
      <Item icon="home"    label="Dashboard"   to="dashboard"/>
      <Item icon="list"    label="Rutinas"     to="routines"   badge={ROUTINES.length}/>
      <Item icon="play"    label="Empezar"     to="start"/>
      <div className="nav-section">Tracking</div>
      <Item icon="history" label="Histórico"   to="history"    badge={HISTORY.length}/>
      <Item icon="stats"   label="Estadísticas" to="stats"/>
      <div className="nav-section">Librería</div>
      <Item icon="rope"    label="Cuerdas"     to="ropes"      badge={ROPES.length}/>
      <Item icon="list"    label="Saltos"      to="exercises"  badge={EXERCISES.length}/>
      <div className="spacer"/>
      <div className="me">
        <div className="avatar">{user.name[0]}</div>
        <div className="meta">
          <b>{user.name}</b>
          <span>{user.email}</span>
        </div>
        <button className="btn icon ghost" title="Logout" onClick={onLogout}>
          <Icon name="logout" size={14}/>
        </button>
      </div>
    </aside>
  );
}

function Tabbar({ route, onRoute }){
  const T = ({ icon, label, to }) => (
    <button className={route===to ? "active" : ""} onClick={()=>onRoute(to)}>
      <Icon name={icon} size={18}/>
      <span>{label}</span>
    </button>
  );
  return (
    <nav className="tabbar">
      <T icon="home"    label="Home"  to="dashboard"/>
      <T icon="list"    label="Rutinas" to="routines"/>
      <T icon="play"    label="Saltar" to="start"/>
      <T icon="history" label="Hist." to="history"/>
      <T icon="stats"   label="Stats" to="stats"/>
    </nav>
  );
}

function Modal({ title, onClose, children, actions }){
  React.useEffect(()=>{
    const fn = (e)=>{ if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return ()=>window.removeEventListener("keydown", fn);
  },[onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{marginBottom:0}}>{title}</h3>
          <button className="btn icon ghost" onClick={onClose}><Icon name="x"/></button>
        </div>
        {children}
        {actions && <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>{actions}</div>}
      </div>
    </div>
  );
}

// Compact rope progress visualization for a routine
function RoutineBlocksStrip({ routine }){
  const total = routineDuration(routine);
  return (
    <div style={{display:"flex",gap:4,height:8,borderRadius:99,overflow:"hidden",background:"var(--bg-3)"}}>
      {routine.blocks.map((b,i)=>{
        const dur = blockDuration(b);
        const w = (dur/total)*100;
        const rope = getRope(b.ropeId);
        return <div key={i} title={`Bloque ${b.letter} · ${rope?.name}`} style={{width:w+"%", background: rope?.color || "var(--accent)"}}/>;
      })}
    </div>
  );
}

Object.assign(window, { Icon, RopeSwatch, Stat, Topbar, Sidebar, Tabbar, Modal, RoutineBlocksStrip });
