import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfiguration } from "@/lib/env";

export type SandboxSession = Readonly<{
 id: string;
 client_secret: string | null;
 livemode: boolean;
 amount_total: number | null;
 currency: string | null;
 payment_status: string;
}>;

export function stripeSandboxConfig() {
 const secret = process.env.STRIPE_SECRET_KEY;
 const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
 if(process.env.STRIPE_SANDBOX_ENABLED !== "true" || !secret?.startsWith("sk_test_") ||
    !publishable?.startsWith("pk_test_")) return null;
 return {secret,publishable};
}

export function paymentAdmin() {
 const key=process.env.SUPABASE_SECRET_KEY;
 if(!key)throw new Error("Supabase server secret not configured");
 const {url}=getPublicSupabaseConfiguration();
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function stripeApi<T>(method:"GET"|"POST",path:string,secret:string,body?:URLSearchParams,idempotencyKey?:string):Promise<T>{
 const response=await fetch("https://api.stripe.com/v1/"+path,{
  method,
  headers:{
   Authorization:"Bearer "+secret,
   ...(body?{"Content-Type":"application/x-www-form-urlencoded"}:{}),
   ...(idempotencyKey?{"Idempotency-Key":idempotencyKey}:{})
  },
  body:body?.toString(),
  cache:"no-store",
 });
 const value:unknown=await response.json();
 if(!response.ok){
  // Never send Stripe's raw error to clients: it may contain sensitive details.
  throw new Error("Stripe sandbox API failed with HTTP "+response.status);
 }
 return value as T;
}

export type SignedStripeEvent={
 id:string;type:string;livemode:boolean;
 data:{object:{
  id:string;object:string;mode:string;livemode:boolean;payment_status:string;
  amount_total:number|null;currency:string|null;metadata:Record<string,string>;
 }};
};

export function verifyStripeSignature(payload:string,header:string,secret:string,nowSeconds=Math.floor(Date.now()/1000)):boolean{
 const parts=header.split(",").map(s=>s.trim());
 const timestamp=parts.find(p=>p.startsWith("t="))?.slice(2);
 const signatures=parts.filter(p=>p.startsWith("v1=")).map(p=>p.slice(3));
 if(!timestamp || !/^\d+$/.test(timestamp) || signatures.length===0 || Math.abs(nowSeconds-Number(timestamp))>300)return false;
 const expected=createHmac("sha256",secret).update(timestamp+"."+payload).digest();
 return signatures.some(value=>{
  if(!/^[a-f0-9]{64}$/i.test(value))return false;
  return timingSafeEqual(Buffer.from(value,"hex"),expected);
 });
}
