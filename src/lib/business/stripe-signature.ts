import {createHmac,timingSafeEqual} from "node:crypto";

/** Constant-time comparison of Stripe v1 HMAC over the raw request body. */
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
