import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { previewMemorialOrder } from "@/lib/business/commercial-catalog";
import { paymentAdmin, stripeApi, stripeSandboxConfig, type SandboxSession } from "@/lib/business/stripe-sandbox";

export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reject=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});

/**
 * Sandbox-only, card-only, one-time PAYG order.
 * This route cannot create a paid memorial, publish content or send invitations.
 * All of those require a separate verified fulfilment operation.
 */
export async function POST(request:NextRequest){
 const config=stripeSandboxConfig();
 if(!config)return reject("Stripe Sandbox non configurato.",503);
 const origin=request.headers.get("origin");
 if(!origin || new URL(origin).host!==request.nextUrl.host)return reject("Origine non autorizzata.",403);
 if(Number(request.headers.get("content-length")||"0")>8192)return reject("Richiesta troppo grande.",413);
 let input:Record<string,unknown>;
 try{input=await request.json();}catch{return reject("JSON non valido.",400);}
 const agencyId=input.agencyId,requestKey=input.requestKey,tier=input.tier;
 const name=typeof input.personName==="string"?input.personName.trim():"";
 const email=typeof input.familyEmail==="string"?input.familyEmail.trim().toLowerCase():"";
 if(typeof agencyId!=="string"||!uuid.test(agencyId)||typeof requestKey!=="string"||!uuid.test(requestKey)||
    (tier!=="STANDARD"&&tier!=="PREMIUM")||name.length<3||name.length>180||
    email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
  return reject("Dati dell'ordine non validi.",400);
 }
 const auth=await createServerSupabaseClient();
 const {data:{user},error:authError}=await auth.auth.getUser();
 if(authError||!user?.email_confirmed_at)return reject("Accesso richiesto.",401);
 const {data:membership,error:memberError}=await auth.from("agency_members")
  .select("agency_id,role,active").eq("agency_id",agencyId).eq("user_id",user.id).eq("active",true).maybeSingle();
 if(memberError||membership?.role!=="OWNER")return reject("Operazione non autorizzata.",403);
 const {data:agency,error:agencyError}=await auth.from("agencies")
  .select("id,is_demo,status,plan").eq("id",agencyId).maybeSingle();
 if(agencyError||!agency||agency.is_demo||agency.status!=="ACTIVE"||agency.plan!=="FREE")
  return reject("Questa operazione è disponibile solo per agenzie PAYG reali attive.",403);
 let admin:ReturnType<typeof paymentAdmin>;
 try{admin=paymentAdmin();}catch{return reject("Database pagamenti non configurato.",503);}
 const {data:entitlement,error:entError}=await admin.from("agency_free_entitlements").select("total,used").eq("agency_id",agencyId).maybeSingle();
 if(entError||!entitlement)return reject("Diritti gratuiti non configurati.",409);
 if(entitlement.used<entitlement.total)return reject("Sono ancora disponibili attivazioni gratuite.",409);
 const quote=previewMemorialOrder({plan:"PAYG",tier,freeActivationsRemaining:0});
 // Duplicate request keys must never create a second Stripe session.
 const {data:existing,error:existingError}=await admin.from("payment_orders")
  .select("id,status,stripe_session_id,amount_cents,actor_user_id").eq("agency_id",agencyId).eq("request_key",requestKey).maybeSingle();
 if(existingError)return reject("Registro ordini non disponibile.",503);
 if(existing){
  if(existing.actor_user_id!==user.id||existing.amount_cents!==quote.totalCents)return reject("Richiesta duplicata non coerente.",409);
  if(existing.status!=="CHECKOUT_OPEN"||!existing.stripe_session_id)return reject("Ordine già elaborato oppure in preparazione.",409);
  try{
   const session=await stripeApi<SandboxSession>("GET","checkout/sessions/"+encodeURIComponent(existing.stripe_session_id),config.secret);
   if(session.livemode||!session.client_secret||session.amount_total!==quote.totalCents)return reject("Sessione non valida.",409);
   return NextResponse.json({clientSecret:session.client_secret,publishableKey:config.publishable,orderId:existing.id},{headers:{"Cache-Control":"no-store"}});
  }catch{return reject("Sessione Stripe non disponibile.",503);}
 }
 const {data:order,error:insertError}=await admin.from("payment_orders").insert({
  agency_id:agencyId,actor_user_id:user.id,request_key:requestKey,
  memorial_tier:tier,plan_code:"PAYG",person_name:name,family_email:email,
  amount_cents:quote.totalCents,currency:"eur",status:"CREATED"
 }).select("id").single();
 if(insertError||!order)return reject("Ordine non creato; riprovare con lo stesso identificativo.",409);
 const params=new URLSearchParams();
 params.set("ui_mode","elements");params.set("mode","payment");
 params.set("payment_method_types[0]","card");
 params.set("line_items[0][price_data][currency]","eur");
 params.set("line_items[0][price_data][unit_amount]",String(quote.totalCents));
 params.set("line_items[0][price_data][product_data][name]","Memoriale "+tier);
 params.set("line_items[0][quantity]","1");
 params.set("client_reference_id",order.id);
 params.set("metadata[order_id]",order.id);
 params.set("metadata[agency_id]",agencyId);
 params.set("metadata[expected_amount_cents]",String(quote.totalCents));
 params.set("return_url",request.nextUrl.origin+"/console/agenzia?sezione=amministrazione&stripe_session_id={CHECKOUT_SESSION_ID}");
 try{
  const session=await stripeApi<SandboxSession>("POST","checkout/sessions",config.secret,params,"memorial-order-"+order.id);
  if(session.livemode||!session.id.startsWith("cs_test_")||!session.client_secret||
      session.amount_total!==quote.totalCents||session.currency!=="eur")throw new Error("Unverified sandbox session");
  const {error:saveError}=await admin.from("payment_orders").update({
   status:"CHECKOUT_OPEN",stripe_session_id:session.id,updated_at:new Date().toISOString()
  }).eq("id",order.id).eq("status","CREATED");
  if(saveError)throw new Error("Cannot persist session identifier");
  return NextResponse.json({clientSecret:session.client_secret,publishableKey:config.publishable,orderId:order.id},{headers:{"Cache-Control":"no-store"}});
 }catch{
  // Fail closed; do not activate any memorial or invite.
  return reject("Checkout Sandbox non disponibile. L'ordine resta non pagato.",503);
 }
}
