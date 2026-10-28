"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import "./superadmin-platform-audit.css";
export type AuditEvent={
 id:number;at:string;table:string;action:string;record:string;
 agency_id:string|null;memorial_id:string|null;is_demo:boolean|null;
 actor:string|null;source:string;before:Record<string,unknown>|null;after:Record<string,unknown>|null;
};
export function SuperadminAuditViewer({events,page,total,pageSize}:{events:AuditEvent[];page:number;total:number;pageSize:number}){
 const [filter,setFilter]=useState("");
 const [onlyDemo,setOnlyDemo]=useState(false);
 const shown=useMemo(()=>events.filter(e=>{
  if(onlyDemo&&!e.is_demo)return false;
  const text=[e.table,e.action,e.record,e.actor??"sistema",e.memorial_id??"",e.agency_id??""].join(" ").toLowerCase();
  return text.includes(filter.toLowerCase().trim());
 }),[events,filter,onlyDemo]);
 return <section className="sa-audit">
  <header><div><span className="workspace-label">SUPERADMIN · DATI REALI SUPABASE</span><h2>Registro modifiche della piattaforma</h2>
   <p>Operazioni INSERT, UPDATE e DELETE dei registri principali, incluse agenzie, famiglie, memoriali e record DEMO. I dettagli prima/dopo sono disponibili al solo proprietario della piattaforma.</p></div><strong>{total} eventi totali</strong></header>
  <div className="sa-audit-controls"><label>Filtra eventi<input type="search" placeholder="Tabella, ID, attore…" value={filter} onChange={e=>setFilter(e.target.value)}/></label>
   <label className="sa-audit-demo"><input type="checkbox" checked={onlyDemo} onChange={e=>setOnlyDemo(e.target.checked)}/> Solo dati DEMO</label></div>
  {shown.length===0?<p>Nessun evento corrisponde ai filtri. Il registro raccoglie le modifiche dal momento della sua attivazione.</p>:
  <div className="sa-audit-list">{shown.map(item=><article key={item.id}>
    <div className="sa-audit-head"><strong>{item.table}</strong><span className={"sa-audit-operation op-"+item.action.toLowerCase()}>{item.action}</span>
    {item.is_demo&&<span className="sa-audit-demo-badge">DEMO</span>}<time>{new Date(item.at).toLocaleString("it-IT")}</time></div>
    <p>Record: <code>{item.record}</code> · Attore: <code>{item.actor??"Sistema / migrazione"}</code></p>
    <details><summary>Esamina la modifica</summary><div className="sa-audit-diffs"><div><strong>Prima</strong><pre>{JSON.stringify(item.before,null,2)}</pre></div><div><strong>Dopo</strong><pre>{JSON.stringify(item.after,null,2)}</pre></div></div></details>
   </article>)}</div>}
  <div className="sa-audit-footer"><span>Pagina {page+1} di {Math.max(1,Math.ceil(total/pageSize))} · Mostrati {events.length} eventi. Il registro conserva anche le pagine precedenti.</span><div className="sa-audit-pagination">{page>0&&<Link href={`/console/piattaforma?sezione=impostazioni&audit_page=${page-1}`}>← Precedenti</Link>}{(page+1)*pageSize<total&&<Link href={`/console/piattaforma?sezione=impostazioni&audit_page=${page+1}`}>Successivi →</Link>}</div></div>
 </section>;
}
