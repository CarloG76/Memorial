import {createHmac} from "node:crypto";
import {describe,expect,it} from "vitest";
import {verifyStripeSignature} from "./stripe-signature";

describe("Stripe Sandbox webhook signature",()=>{
 const secret="whsec_test_example";
 const body=JSON.stringify({id:"evt_test",type:"checkout.session.completed"});
 const time=1795770000;
 const signed=(payload:string,ts:number)=>"t="+ts+",v1="+createHmac("sha256",secret).update(ts+"."+payload).digest("hex");
 it("accepts an authentic unmodified payload",()=>{
  expect(verifyStripeSignature(body,signed(body,time),secret,time)).toBe(true);
 });
 it("rejects a tampered body",()=>{
  expect(verifyStripeSignature(body+" ",signed(body,time),secret,time)).toBe(false);
 });
 it("rejects absent, malformed, invalid and stale signatures",()=>{
  expect(verifyStripeSignature(body,"",secret,time)).toBe(false);
  expect(verifyStripeSignature(body,"t=not-a-number,v1=aaaa",secret,time)).toBe(false);
  expect(verifyStripeSignature(body,"t="+time+",v1="+("00".repeat(32)),secret,time)).toBe(false);
  expect(verifyStripeSignature(body,signed(body,time-301),secret,time)).toBe(false);
 });
 it("accepts a valid signature when header also includes rotated invalid values",()=>{
  expect(verifyStripeSignature(body,signed(body,time)+",v1="+("cc".repeat(32)),secret,time)).toBe(true);
 });
});
