import {describe,expect,it} from "vitest";
import {createHash} from "node:crypto";
import {qrMatrix,qrSvg,QR_SIZE} from "./memorial-qr";

describe("QR permanente di MEMORIAL",()=>{
 const url="https://memorial-ai-visions.vercel.app/r/123456789abcdef0123456789abcdef0";
 it("codifica esattamente il riferimento ISO QR v6-L, mask 0",()=>{
  const m=qrMatrix(url);
  expect(m).toHaveLength(QR_SIZE);
  expect(m.every(r=>r.length===QR_SIZE)).toBe(true);
  const bits=m.flat().map(v=>v?"1":"0").join("");
  expect(createHash("sha256").update(bits).digest("hex"))
   .toBe("f8e7c7a5e4d264f1b69a2fa3bfc6e82a8637c3af74e32cc0810676b053653fc1");
 });
 it("emette SVG stampabile e quiet-zone bianca di 4 moduli",()=>{
  const svg=qrSvg(url);
  expect(svg).toContain('viewBox="0 0 49 49"');
  expect(svg).toContain('shape-rendering="crispEdges"');
  expect(svg).toContain('fill="#fff"');
 });
 it("rifiuta payload più grandi della versione supportata",()=>{
  expect(()=>qrMatrix("a".repeat(135))).toThrow(/troppo lungo/);
 });
});
