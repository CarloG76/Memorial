import {describe,expect,it} from "vitest";
import {validatePortraitFile,MAX_PORTRAIT_BYTES} from "./portrait-validation";

describe("portrait file preflight",()=>{
 it("accepts supported formats at exact size boundary",()=>{
  expect(validatePortraitFile({type:"image/jpeg",size:1})).toEqual({ok:true,extension:"jpg"});
  expect(validatePortraitFile({type:"image/png",size:MAX_PORTRAIT_BYTES})).toEqual({ok:true,extension:"png"});
  expect(validatePortraitFile({type:"image/webp",size:500})).toEqual({ok:true,extension:"webp"});
 });
 it("rejects forbidden formats and invalid sizes",()=>{
  for(const type of ["image/svg+xml","image/gif","application/pdf",""]){
   expect(validatePortraitFile({type,size:100}).ok).toBe(false);
  }
  for(const size of [0,-1,MAX_PORTRAIT_BYTES+1,NaN,Infinity,1.5]){
   expect(validatePortraitFile({type:"image/jpeg",size}).ok).toBe(false);
  }
 });
});
