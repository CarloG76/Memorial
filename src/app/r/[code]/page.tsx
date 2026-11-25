import type {Metadata} from "next";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Memoriale · In attesa di pubblicazione",
 description:"Un ricordo da custodire.",
 robots:{index:false,follow:false,nocache:true}
};
type ResolveResult={state:"PUBLISHED"|"WAITING";share_token?:string};
export default async function PermanentMemorialQr({params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[0-9a-f]{32}$/.test(code))notFound();
 const db=await createServerSupabaseClient();
 const {data,error}=await db.rpc("resolve_memorial_qr",{code});
 if(error||!data||typeof data!=="object")notFound();
 const result=data as ResolveResult;
 if(result.state==="PUBLISHED"){
  if(!result.share_token||!/^[0-9a-f]{48}$/.test(result.share_token))notFound();
  redirect("/memoriale/p/"+result.share_token);
 }
 if(result.state!=="WAITING")notFound();
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#faf8f4",padding:24,color:"#18354a"}}>
  <section style={{maxWidth:520,width:"100%",textAlign:"center",padding:"48px 28px",background:"#fff",borderRadius:16,border:"1px solid #e3ded7"}}>
   <span style={{fontSize:34,display:"block",marginBottom:18}} aria-hidden="true">✦</span>
   <h1 style={{fontSize:"clamp(26px,5vw,38px)",lineHeight:1.15,marginBottom:16}}>Un ricordo da custodire</h1>
   <p style={{lineHeight:1.7}}>Il memoriale digitale non è ancora disponibile. Potrai tornare su questo stesso collegamento quando sarà pubblicato.</p>
   <p style={{fontSize:13,color:"#67757d"}}>Questo codice rimarrà valido. Nessuna registrazione necessaria per visitare il memoriale una volta pubblicato.</p>
   <Link href="/" style={{display:"inline-block",marginTop:16,color:"#173f5b"}}>Scopri MEMORIAL</Link>
  </section>
 </main>;
}
