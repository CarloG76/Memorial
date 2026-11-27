import { NextResponse, type NextRequest } from "next/server";
import { paymentAdmin, type SignedStripeEvent } from "@/lib/business/stripe-sandbox";
import { verifyStripeSignature } from "@/lib/business/stripe-signature";

export const runtime="nodejs";
const accepted=new Set([
 "checkout.session.completed",
 "checkout.session.async_payment_succeeded",
 "checkout.session.async_payment_failed",
 "checkout.session.expired"
]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(status:number)=>NextResponse.json({error:"Webhook non elaborato"},{status});

export async function POST(request:NextRequest){
 const secret=process.env.STRIPE_WEBHOOK_SECRET;
 if(process.env.STRIPE_SANDBOX_ENABLED!=="true"||!secret?.startsWith("whsec_"))return fail(503);
 const signature=request.headers.get("stripe-signature");
 if(!signature)return fail(400);
 const payload=await request.text();
 if(payload.length>1024*1024||!verifyStripeSignature(payload,signature,secret))return fail(400);
 let event:SignedStripeEvent;
 try{event=JSON.parse(payload) as SignedStripeEvent;}catch{return fail(400);}
 if(!accepted.has(event.type))return NextResponse.json({received:true,ignored:true});
 const session=event.data?.object;
 if(!session||session.object!=="checkout.session"||session.mode!=="payment"||
    event.livemode||session.livemode||!session.id?.startsWith("cs_test_")||
    !event.id?.startsWith("evt_")||!uuid.test(session.metadata?.order_id||"")||
    !uuid.test(session.metadata?.agency_id||"")||
    typeof session.amount_total!=="number"||!Number.isSafeInteger(session.amount_total)||session.amount_total < 0)return fail(400);
 const expected=Number(session.metadata.expected_amount_cents);
 if(!Number.isSafeInteger(expected)||expected!==session.amount_total)return fail(400);
 try{
  const admin=paymentAdmin();
  const {error}=await admin.rpc("stripe_apply_checkout_event",{
   event_key:event.id,event_kind:event.type,order_key:session.metadata.order_id,
   session_key:session.id,agency_key:session.metadata.agency_id,
   paid_cents:session.amount_total,paid_currency:session.currency,
   payment_state:session.payment_status,is_live:event.livemode
  });
  if(error)return fail(500); // Stripe retries: do not acknowledge an uncommitted event.
  return NextResponse.json({received:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return fail(503);}
}
