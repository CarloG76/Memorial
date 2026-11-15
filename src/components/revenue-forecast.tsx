"use client";
import {useMemo,useState} from "react";
import "./revenue-forecast.css";

type Plan="PAYG"|"MONTHLY"|"YEARLY";
type Segment={plan:Plan;agencies:number;std:number;premium:number;freeStd:number;freePremium:number;stored:number};
type Assumptions={
 paygStd:number;paygPremium:number;monthlyStd:number;monthlyPremium:number;yearlyStd:number;yearlyPremium:number;
 monthlyFee:number;yearlyFee:number;stripeRate:number;stripeFixed:number;billingRate:number;
 stdCost:number;premiumCost:number;emailCost:number;storageCost:number;supportCost:number;platformCost:number;
};
const assumptionsDefault:Assumptions={
 paygStd:19.9,paygPremium:22.9,monthlyStd:13.9,monthlyPremium:16.9,yearlyStd:11.9,yearlyPremium:14.9,
 monthlyFee:39.9,yearlyFee:379,stripeRate:1.5,stripeFixed:.25,billingRate:.7,
 stdCost:.7,premiumCost:1.8,emailCost:.1,storageCost:.04,supportCost:.3,platformCost:25
};
const presets:Record<string,Segment[]>={
 conservativo:[
  {plan:"PAYG",agencies:15,std:.5,premium:.15,freeStd:2,freePremium:0,stored:5},
  {plan:"MONTHLY",agencies:5,std:.7,premium:.2,freeStd:0,freePremium:0,stored:8},
  {plan:"YEARLY",agencies:2,std:.8,premium:.25,freeStd:0,freePremium:0,stored:10}
 ],
 base:[
  {plan:"PAYG",agencies:40,std:.8,premium:.25,freeStd:4,freePremium:2,stored:8},
  {plan:"MONTHLY",agencies:20,std:1.2,premium:.45,freeStd:0,freePremium:0,stored:14},
  {plan:"YEARLY",agencies:10,std:1.5,premium:.6,freeStd:0,freePremium:0,stored:18}
 ],
 espansione:[
  {plan:"PAYG",agencies:150,std:1,premium:.4,freeStd:12,freePremium:6,stored:14},
  {plan:"MONTHLY",agencies:70,std:1.6,premium:.7,freeStd:0,freePremium:0,stored:22},
  {plan:"YEARLY",agencies:40,std:2.2,premium:1,freeStd:0,freePremium:0,stored:30}
 ]};
const planLabels:Record<Plan,string>={PAYG:"Senza abbonamento",MONTHLY:"Pro mensile",YEARLY:"Pro annuale"};
const euro=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:2});
const numeric=new Intl.NumberFormat("it-IT",{maximumFractionDigits:1});
const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,n):0;
type Detail={plan:Plan;agencies:number;stdCreated:number;premCreated:number;stdPaid:number;premPaid:number;subscriptions:number;memorials:number;revenue:number;stripePayments:number;stripeBilling:number;creation:number;storage:number;support:number;margin:number;free:number};
function calculate(segs:Segment[],a:Assumptions){
 const details:Detail[]=segs.map(s=>{
  const stdCreated=s.agencies*s.std,premCreated=s.agencies*s.premium;
  const stdPaid=Math.max(0,stdCreated-s.freeStd),premPaid=Math.max(0,premCreated-s.freePremium);
  const subscriptions=s.plan==="MONTHLY"?s.agencies*a.monthlyFee:s.plan==="YEARLY"?s.agencies*a.yearlyFee/12:0;
  const prices=s.plan==="PAYG"?[a.paygStd,a.paygPremium]:s.plan==="MONTHLY"?[a.monthlyStd,a.monthlyPremium]:[a.yearlyStd,a.yearlyPremium];
  const memorials=stdPaid*prices[0]+premPaid*prices[1];
  const revenue=subscriptions+memorials;
  const subscriptionPayments=s.plan==="MONTHLY"?s.agencies:s.plan==="YEARLY"?s.agencies/12:0;
  const stripePayments=revenue*a.stripeRate/100+(stdPaid+premPaid+subscriptionPayments)*a.stripeFixed;
  const stripeBilling=subscriptions*a.billingRate/100;
  const creation=stdCreated*(a.stdCost+a.emailCost)+premCreated*(a.premiumCost+a.emailCost);
  const storage=s.agencies*s.stored*a.storageCost;
  const support=s.agencies*a.supportCost;
  return {plan:s.plan,agencies:s.agencies,stdCreated,premCreated,stdPaid,premPaid,subscriptions,memorials,revenue,stripePayments,stripeBilling,creation,storage,support,margin:revenue-stripePayments-stripeBilling-creation-storage-support,free:s.freeStd+s.freePremium};
 });
 const total=(key:keyof Detail)=>details.reduce((sum,d)=>sum+(typeof d[key]==="number"?d[key] as number:0),0);
 const revenue=total("revenue"),costs=total("stripePayments")+total("stripeBilling")+total("creation")+total("storage")+total("support")+a.platformCost;
 return {details,agencies:total("agencies"),revenue,costs,margin:revenue-costs,subs:total("subscriptions"),units:total("memorials"),
  paid:total("stdPaid")+total("premPaid"),free:total("free"),stripe:total("stripePayments")+total("stripeBilling"),creation:total("creation"),storage:total("storage"),support:total("support")};
}
const fields:[keyof Assumptions,string,string][]=[
 ["paygStd","PAYG Standard","€"],["paygPremium","PAYG Premium*","€"],
 ["monthlyStd","Pro mensile Standard","€"],["monthlyPremium","Pro mensile Premium*","€"],
 ["yearlyStd","Pro annuale Standard","€"],["yearlyPremium","Pro annuale Premium*","€"],
 ["monthlyFee","Canone mensile","€"],["yearlyFee","Canone annuale","€"],
 ["stripeRate","Stripe Payments","%"],["stripeFixed","Stripe fisso / addebito","€"],
 ["billingRate","Stripe Billing (canoni)","%"],
 ["stdCost","Costo creazione Standard (ipotesi)","€"],["premiumCost","Costo creazione Premium (ipotesi)","€"],
 ["emailCost","Email/operatività per creazione (ipotesi)","€"],
 ["storageCost","Storage / memoriale ospitato / mese (ipotesi)","€"],
 ["supportCost","Supporto / agenzia / mese (ipotesi)","€"],
 ["platformCost","Costo fisso piattaforma / mese (ipotesi)","€"]
];
function NumberInput({value,onChange,label,step=.1}: {value:number;onChange:(value:number)=>void;label:string;step?:number}){
 return <input type="number" aria-label={label} min={0} step={step} value={value} onChange={e=>onChange(clamp(Number(e.target.value)))}/>;
}
export function RevenueForecast(){
 const [preset,setPreset]=useState("base");
 const [segments,setSegments]=useState<Segment[]>(()=>presets.base.map(s=>({...s})));
 const [assumptions,setAssumptions]=useState<Assumptions>(assumptionsDefault);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const result=useMemo(()=>calculate(segments,assumptions),[segments,assumptions]);
 const compare=Object.entries(presets).map(([name,rows])=>({name,result:calculate(rows,assumptions)}));
 function changeSegment(i:number,key:Exclude<keyof Segment,"plan">,value:number){
  setSegments(old=>old.map((s,j)=>i===j?{...s,[key]:value}:s));
 }
 function usePreset(name:string){
  setPreset(name);setSegments(presets[name].map(s=>({...s})));
 }
 function changeAssumption(key:keyof Assumptions,value:number){
  setAssumptions(old=>({...old,[key]:value}));
 }
 const breakout=[
  {label:"Ricavi abbonamenti",value:result.subs,kind:"positive"},
  {label:"Ricavi memoriali pagati",value:result.units,kind:"positive"},
  {label:"Stripe Payments + Billing",value:-result.stripe,kind:"negative"},
  {label:"Costo creazione/email",value:-result.creation,kind:"negative"},
  {label:"Storage",value:-result.storage,kind:"negative"},
  {label:"Supporto",value:-result.support,kind:"negative"},
  {label:"Piattaforma fissa",value:-assumptions.platformCost,kind:"negative"}
 ];
 const biggest=Math.max(1,...compare.map(s=>s.result.revenue));
 return <div className="rf-main">
  <header className="rf-header"><div><span className="workspace-label">SUPERADMIN / ECONOMIA</span><h1>Revenue Forecast</h1>
   <p>Simulatore B2B per agenzie, Standard/Premium e commissioni Stripe. Tutti i numeri sono ipotesi modificabili, non fatturato reale.</p></div>
   <span className="rf-sim-badge">SIMULAZIONE · NO PAGAMENTI</span>
  </header>
  <section className="rf-card">
   <div className="rf-section-top"><div><h2>Scenario di lavoro</h2><p>Scegli un esempio o modifica direttamente tutti i valori.</p></div>
    <div className="rf-switch" role="group" aria-label="Scenario di partenza">{Object.keys(presets).map(name=><button key={name} type="button" onClick={()=>usePreset(name)} className={preset===name?"active":""}>{name==="base"?"Base":name==="espansione"?"Espansione":"Conservativo"}</button>)}</div>
   </div>
   <div className="rf-input-scroll"><table className="rf-input-table"><thead><tr><th>Tipo agenzia</th><th>N° agenzie</th><th>Standard / ag. / mese</th><th>Premium / ag. / mese</th><th>Standard gratuiti totali nel mese</th><th>Premium gratuiti totali nel mese</th><th>Memoriali già ospitati / ag.</th></tr></thead>
    <tbody>{segments.map((s,i)=><tr key={s.plan}><th scope="row">{planLabels[s.plan]}</th>
     {(["agencies","std","premium","freeStd","freePremium","stored"] as const).map(k=><td key={k}><NumberInput label={planLabels[s.plan]+" — "+k} value={s[k]} onChange={v=>{changeSegment(i,k,v);setPreset("");}} step={k==="agencies"||k==="freeStd"||k==="freePremium"?1:.1}/></td>)}
    </tr>)}</tbody></table></div>
   <p className="rf-note">I memoriali gratuiti sono conteggiati per segmento nell'intero mese, non per singola agenzia: spettano soltanto alle agenzie nuove (due in totale per tutta la loro vita).</p>
  </section>
  <div className="rf-kpis">
   <div><small>Ricavi medi mensili</small><strong>{euro.format(result.revenue)}</strong><span>{euro.format(result.revenue*12)} annualizzati</span></div>
   <div><small>Costi mensili stimati</small><strong>{euro.format(result.costs)}</strong><span>Stripe + costi di utilizzo</span></div>
   <div><small>Margine mensile stimato</small><strong>{euro.format(result.margin)}</strong><span>{euro.format(result.margin*12)} annualizzati</span></div>
   <div><small>Agenzie · memoriali pagati/mese</small><strong>{numeric.format(result.agencies)} · {numeric.format(result.paid)}</strong><span>{numeric.format(result.free)} gratuiti nel mese</span></div>
  </div>
  <div className="rf-cols">
   <section className="rf-card"><h2>Composizione economica / mese</h2>
    <div className="rf-breakdown">{breakout.map(row=><div key={row.label}><span>{row.label}</span><strong className={row.kind==="negative"?"rf-cost":""}>{euro.format(row.value)}</strong></div>)}</div>
    <div className="rf-total"><span>Margine di contribuzione stimato</span><strong>{euro.format(result.margin)}</strong></div>
   </section>
   <section className="rf-card"><div className="rf-section-top"><h2>Prezzi, Stripe e costi</h2><button type="button" className="rf-edit" onClick={()=>setSettingsOpen(v=>!v)} aria-expanded={settingsOpen}>{settingsOpen?"Chiudi parametri":"Modifica parametri"}</button></div>
    <p>Prezzi di default: PAYG 19,90/22,90; Pro mensile 13,90/16,90 (+39,90/mese); Pro annuale 11,90/14,90 (+379/anno).</p>
    <p className="rf-note">Premium +€3 è una proposta; prezzi e IVA ancora da formalizzare. I costi tecnologici non-Stripe sono solo assunzioni iniziali.</p>
    {settingsOpen&&<div className="rf-settings">{fields.map(([key,label,unit])=><label key={key}><span>{label}</span><span className="rf-setting-input"><NumberInput value={assumptions[key]} onChange={v=>changeAssumption(key,v)} label={label} step={unit==="%"?.1:.01}/>{unit}</span></label>)}
     <button type="button" className="rf-edit" onClick={()=>setAssumptions(assumptionsDefault)}>Ripristina parametri</button></div>}
    <p className="rf-note">Stripe predefinito: 1,5% + €0,25 per transazione con carta SEE standard; Stripe Billing 0,7% sui canoni. <a href="https://stripe.com/it/pricing" target="_blank" rel="noopener noreferrer">Tariffario ufficiale Stripe</a>.</p>
   </section>
  </div>
  <section className="rf-card"><h2>Contributo per tipologia di agenzia</h2>
   <div className="rf-input-scroll"><table className="rf-output-table"><thead><tr><th>Piano</th><th>Std pagati/mese</th><th>Premium pagati/mese</th><th>Canoni / mese</th><th>Memoriali / mese</th><th>Stripe / mese</th><th>Margine / mese*</th></tr></thead>
    <tbody>{result.details.map(d=><tr key={d.plan}><th>{planLabels[d.plan]}</th><td>{numeric.format(d.stdPaid)}</td><td>{numeric.format(d.premPaid)}</td><td>{euro.format(d.subscriptions)}</td><td>{euro.format(d.memorials)}</td><td>{euro.format(d.stripePayments+d.stripeBilling)}</td><td>{euro.format(d.margin)}</td></tr>)}</tbody></table></div>
   <p className="rf-note">* Il margine per segmento non include il costo fisso piattaforma, dedotto una volta nel totale. I volumi medi possono essere frazionari.</p>
  </section>
  <section className="rf-card"><h2>Confronto scenari preimpostati</h2><p>Le barre usano i tre scenari originali con i parametri economici correnti; non sostituiscono i valori personalizzati nella tabella sopra.</p>
   <div className="rf-chart">{compare.map(s=><div key={s.name}><span>{s.name}</span><div className="rf-chart-track"><div style={{width:Math.max(0,s.result.revenue/biggest*100)+"%"}}/></div><strong>{euro.format(s.result.revenue)}/mese</strong></div>)}</div>
   <p className="rf-note">Modello run-rate, non cash flow per coorti: il canone annuale è riconosciuto a €379/12, con anche la commissione fissa sul rinnovo annuale ripartita su 12 mesi.</p>
  </section>
  <p className="rf-disclaimer">Margine indicativo prima di IVA, imposte, CAC, personale, sviluppo, insoluti, rimborsi e chargeback. Lo stock di memoriali ospitati è un input separato dai nuovi memoriali/mese. I ricavi da conservazioni/rinnovi extra non sono inclusi.</p>
 </div>;
}
