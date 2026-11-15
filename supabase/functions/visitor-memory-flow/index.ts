import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const PUBLISH_KEY=Deno.env.get("SUPABASE_ANON_KEY")??"";
const api=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
const allowedOrigins=new Set(["https://memorial-ai-visions.vercel.app","https://memorial-navy.vercel.app","http://localhost:3000"]);
type MemoryRow={id:string;memorial_id:string;title:string;body:string;guest_author:string|null;moderation_status:string;photo_private_path:string|null;photo_public_path:string|null;created_at:string};
function respond(req:Request,data:unknown,status=200){
 const origin=req.headers.get("origin")??"";
 return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin","Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"GET, POST, OPTIONS"}});
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function safeError(req:Request){return respond(req,{error:"Impossibile completare l'operazione. Riprova."},500);}
async function photoValid(file:File):Promise<{ext:string;bytes:Uint8Array}|null>{
 if(file.size===0||file.size>5*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))return null;
 const bytes=new Uint8Array(await file.arrayBuffer());
 const jpg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 const png=bytes.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const webp=bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 if(file.type==="image/jpeg"&&jpg)return{ext:"jpg",bytes};
 if(file.type==="image/png"&&png)return{ext:"png",bytes};
 if(file.type==="image/webp"&&webp)return{ext:"webp",bytes};
 return null;
}
async function familyAuthorized(req:Request,memorialId:string,contextKey:string|null){
 const auth=req.headers.get("authorization");
 const token=auth?.replace(/^Bearer\s+/i,"").trim();
 if(!token)return false;
 const session=createClient(SUPABASE_URL,PUBLISH_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await session.auth.getUser(token);
 if(error||!data.user?.id||!data.user.email_confirmed_at)return false;
 const userId=data.user.id;
 if(contextKey){
  if(!uuid.test(contextKey))return false;
  const [owner,ctx]=await Promise.all([
   api.from("platform_memberships").select("user_id").eq("user_id",userId).eq("role","OWNER").eq("active",true).maybeSingle(),
   api.from("platform_operator_contexts").select("id").eq("id",contextKey).eq("actor_id",userId).eq("memorial_id",memorialId).eq("context_type","FAMILY").is("closed_at",null).gt("expires_at",new Date().toISOString()).maybeSingle()
  ]);
  return !owner.error&&!ctx.error&&!!owner.data&&!!ctx.data;
 }
 const {data:member,error:memberError}=await api.from("family_members").select("role,active,can_moderate").eq("user_id",userId).eq("memorial_id",memorialId).eq("active",true).maybeSingle();
 return !memberError&&!!member&&(member.role==="OWNER"||(member.role==="EDITOR"&&member.can_moderate===true));
}
async function proposal(req:Request){
 const len=+(req.headers.get("content-length")??0);
 if(len>6*1024*1024)return respond(req,{error:"Richiesta troppo grande (massimo 5 MB per foto)."},413);
 const form=await req.formData();
 const memorialId=String(form.get("memorial_id")??"");
 const author=String(form.get("author")??"").trim();
 const body=String(form.get("body")??"").trim();
 const honeypot=String(form.get("website")??"").trim();
 const rightsConfirmed=form.get("rights_confirmed")==="yes";
 const file=form.get("photo");
 if(honeypot)return respond(req,{ok:true});
 if(!rightsConfirmed)return respond(req,{error:"È richiesta la conferma di autorizzazione alla condivisione."},400);
 if(!uuid.test(memorialId)||author.length<2||author.length>100||body.length<10||body.length>1000)return respond(req,{error:"Controlla nome e descrizione del ricordo."},400);
 if(file!==null&&!(file instanceof File))return respond(req,{error:"Fotografia non valida."},400);
 const img=file instanceof File&&file.size>0?await photoValid(file):null;
 if(file instanceof File&&file.size>0&&!img)return respond(req,{error:"Fotografia non valida. Sono consentiti JPG, PNG e WebP fino a 5 MB."},400);
 const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const fingerprint=new TextEncoder().encode(ip+"|"+SERVICE_KEY);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",fingerprint))).map(b=>b.toString(16).padStart(2,"0")).join("");
 const {data:allowed,error:rateError}=await api.rpc("visitor_memory_allow",{memorial_key:memorialId,ip_key:digest});
 if(rateError)return safeError(req);
 if(!allowed)return respond(req,{error:"Il memoriale non accetta nuove proposte oppure è stato raggiunto il limite giornaliero. Riprova più tardi."},429);
 const id=crypto.randomUUID();
 const path=img?`${memorialId}/${id}.${img.ext}`:null;
 if(img&&path){
  const {error:uploadError}=await api.storage.from("memorial-pending").upload(path,img.bytes,{contentType:file instanceof File?file.type:"image/jpeg",upsert:false,cacheControl:"0"});
  if(uploadError)return safeError(req);
 }
 const {error:insertError}=await api.from("memorial_memories").insert({
  id,memorial_id:memorialId,is_demo:true,
  title:"Ricordo di "+author,body,guest_author:author,visitor_submitted:true,
  moderation_status:"PENDING",photo_private_path:path,photo_public_path:null
 });
 if(insertError){
  if(path)await api.storage.from("memorial-pending").remove([path]);
  return safeError(req);
 }
 return respond(req,{ok:true,message:"Ricordo ricevuto. La famiglia potrà approvarlo prima della pubblicazione."},201);
}
async function list(req:Request,url:URL){
 const memorialId=url.searchParams.get("memorial_id")??"";
 const contextKey=url.searchParams.get("context_key");
 if(!uuid.test(memorialId)||!(await familyAuthorized(req,memorialId,contextKey)))return respond(req,{error:"Accesso non autorizzato."},403);
 const {data,error}=await api.from("memorial_memories").select("id,memorial_id,title,body,guest_author,moderation_status,photo_private_path,photo_public_path,created_at").eq("memorial_id",memorialId).eq("visitor_submitted",true).order("created_at",{ascending:false}).limit(100);
 if(error)return safeError(req);
 const entries=[];
 for(const row of data as MemoryRow[]){
  let photoUrl:string|null=null;
  if(row.photo_private_path){
   const signed=await api.storage.from("memorial-pending").createSignedUrl(row.photo_private_path,600);
   photoUrl=signed.data?.signedUrl??null;
  }
  entries.push({id:row.id,title:row.title,author:row.guest_author,body:row.body,status:row.moderation_status,photo_url:photoUrl,created_at:row.created_at});
 }
 return respond(req,{memories:entries});
}
async function moderate(req:Request){
 const data=await req.json().catch(()=>null);
 const memorialId=String(data?.memorial_id??"");
 const contextKey=typeof data?.context_key==="string"?data.context_key:null;
 const recordId=String(data?.record_id??"");
 const action=String(data?.action??"");
 if(!uuid.test(memorialId)||!uuid.test(recordId)||!["APPROVE","REJECT"].includes(action))return respond(req,{error:"Richiesta non valida."},400);
 if(!(await familyAuthorized(req,memorialId,contextKey)))return respond(req,{error:"Accesso non autorizzato."},403);
 const {data:row,error}=await api.from("memorial_memories")
  .select("id,moderation_status,photo_private_path,photo_public_path")
  .eq("id",recordId).eq("memorial_id",memorialId).eq("visitor_submitted",true).maybeSingle();
 if(error||!row)return respond(req,{error:"Ricordo non trovato."},404);
 if(row.moderation_status===action)return respond(req,{ok:true});
 let publicPath:string|null=row.photo_public_path;
 let uploaded=false;
 if(action==="APPROVE"&&row.photo_private_path&&!publicPath){
  const download=await api.storage.from("memorial-pending").download(row.photo_private_path);
  if(download.error||!download.data)return safeError(req);
  const type=row.photo_private_path.endsWith(".webp")?"image/webp":row.photo_private_path.endsWith(".png")?"image/png":"image/jpeg";
  const result=await api.storage.from("memorial-approved").upload(row.photo_private_path,download.data,{contentType:type,upsert:false,cacheControl:"0"});
  if(result.error)return safeError(req);
  publicPath=row.photo_private_path;uploaded=true;
 }
 const {data:saved,error:saveError}=await api.from("memorial_memories").update({
  moderation_status:action==="APPROVE"?"APPROVED":"REJECTED",
  photo_public_path:action==="APPROVE"?publicPath:null
 }).eq("id",recordId).eq("memorial_id",memorialId).eq("moderation_status",row.moderation_status).select("id").maybeSingle();
 if(saveError||!saved){
  if(uploaded&&publicPath)await api.storage.from("memorial-approved").remove([publicPath]);
  return respond(req,{error:"Lo stato è cambiato: aggiorna l'elenco e riprova."},409);
 }
 if(action==="REJECT"&&publicPath)await api.storage.from("memorial-approved").remove([publicPath]);
 return respond(req,{ok:true});
}

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return respond(req,{ok:true});
 const origin=req.headers.get("origin");
 if(origin&&!allowedOrigins.has(origin))return respond(req,{error:"Origine non autorizzata."},403);
 try{
  const url=new URL(req.url);
  if(req.method==="POST"&&url.searchParams.get("action")==="submit")return await proposal(req);
  if(req.method==="GET"&&url.searchParams.get("action")==="list")return await list(req,url);
  if(req.method==="POST"&&url.searchParams.get("action")==="moderate")return await moderate(req);
  return respond(req,{error:"Operazione sconosciuta."},404);
 }catch(e){
  console.error("visitor-memory-flow error",e instanceof Error?e.message:"unknown");
  return safeError(req);
 }
});
