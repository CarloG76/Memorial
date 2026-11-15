"use client";
import {useState} from "react";
export type MemorialMilestone={date:string;title:string;detail:string};
export function normalizeMilestones(value:unknown):MemorialMilestone[]{
 if(!Array.isArray(value))return [];
 return value.map((item:unknown)=>{
  const m=(item&&typeof item==="object"?item:{}) as Record<string,unknown>;
  return {date:String(m.date??m.year??""),title:String(m.title??""),detail:String(m.detail??"")};
 });
}
export function validMilestoneDate(s:string):boolean{
 if(/^\d{4}$/.test(s))return +s>=1;
 if(/^(0[1-9]|1[0-2])-\d{4}$/.test(s))return +s.slice(-4)>=1;
 if(!/^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$/.test(s))return false;
 const [day,month,year]=s.split("-").map(Number);
 if(year<1)return false;
 const d=new Date(0);d.setUTCHours(12,0,0,0);d.setUTCFullYear(year,month-1,day);
 return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day;
}
export function MilestonesEditor({items,onChange,disabled=false}:{items:MemorialMilestone[];onChange:(items:MemorialMilestone[])=>void;disabled?:boolean}){
 const [error,setError]=useState("");
 function change(index:number,field:keyof MemorialMilestone,value:string){
  onChange(items.map((item,i)=>i===index?{...item,[field]:value}:item));setError("");
 }
 function add(){
  if(items.length>=30){setError("Massimo 30 tappe.");return;}
  onChange([...items,{date:"",title:"",detail:""}]);setError("");
 }
 function move(index:number,offset:number){
  const target=index+offset;if(target<0||target>=items.length)return;
  const copy=[...items];[copy[index],copy[target]]=[copy[target],copy[index]];onChange(copy);
 }
 return <div className="milestone-editor">
  <p>Le tappe compongono la timeline pubblica. Data: <strong>AAAA</strong>, <strong>MM-AAAA</strong> o <strong>GG-MM-AAAA</strong>. Titolo facoltativo, didascalia obbligatoria. Ordine modificabile.</p>
  {items.map((item,i)=><fieldset key={i} style={{border:"1px solid #dce4eb",borderRadius:9,padding:13,margin:"12px 0"}}>
   <legend style={{fontWeight:700}}>Tappa {i+1}</legend>
   <div style={{display:"grid",gridTemplateColumns:"minmax(120px,1fr) minmax(160px,2fr)",gap:12}}>
    <label>Data<input type="text" required placeholder="1948 / 06-1974 / 21-05-1992" value={item.date} onChange={e=>change(i,"date",e.target.value)} maxLength={10} disabled={disabled} aria-invalid={!!item.date&&!validMilestoneDate(item.date)}/></label>
    <label>Titolo (facoltativo)<input value={item.title} maxLength={180} onChange={e=>change(i,"title",e.target.value)} disabled={disabled}/></label>
   </div>
   <label>Didascalia<textarea required rows={3} maxLength={2000} value={item.detail} onChange={e=>change(i,"detail",e.target.value)} disabled={disabled}/></label>
   {!!item.date&&!validMilestoneDate(item.date)&&<p role="alert" style={{color:"#ab3232"}}>Formato data non valido.</p>}
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    <button type="button" onClick={()=>move(i,-1)} disabled={disabled||i===0}>↑ Sposta su</button>
    <button type="button" onClick={()=>move(i,1)} disabled={disabled||i===items.length-1}>↓ Sposta giù</button>
    <button type="button" onClick={()=>onChange(items.filter((_,j)=>i!==j))} disabled={disabled}>Elimina tappa</button>
   </div>
  </fieldset>)}
  {error&&<p role="alert">{error}</p>}
  <button type="button" onClick={add} disabled={disabled||items.length>=30}>+ Aggiungi tappa</button>
 </div>;
}
