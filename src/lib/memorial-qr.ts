/** Self-contained ISO/IEC 18004 QR version 6-L (41x41, byte mode).
 * No external QR service, scripts, analytics or tracking.
 * Maximum text: 134 UTF-8 bytes; quiet zone: four modules.
 */
export const QR_SIZE=41;
const CAPACITY=136;
function gfMul(a:number,b:number):number{
 let z=0;
 for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11d);z^=((b>>>i)&1)*a;}
 return z;
}
function divisor(degree:number):number[]{
 const result=Array<number>(degree).fill(0);result[degree-1]=1;let root=1;
 for(let i=0;i<degree;i++){
  for(let j=0;j<degree;j++){result[j]=gfMul(result[j],root);if(j+1<degree)result[j]^=result[j+1];}
  root=gfMul(root,2);
 }
 return result;
}
function remainder(data:number[],div:number[]):number[]{
 const res=Array<number>(div.length).fill(0);
 for(const b of data){const factor=b^res.shift()!;res.push(0);for(let i=0;i<res.length;i++)res[i]^=gfMul(div[i],factor);}
 return res;
}
export function qrMatrix(text:string):boolean[][]{
 const raw=new TextEncoder().encode(text);
 if(raw.length>134)throw new Error("QR URL troppo lungo (massimo 134 byte).");
 const bits:number[]=[];
 function add(value:number,length:number){for(let i=length-1;i>=0;i--)bits.push((value>>>i)&1);}
 add(4,4);add(raw.length,8);
 for(const b of raw)add(b,8);
 for(let i=0;i<Math.min(4,CAPACITY*8-bits.length);i++)bits.push(0);
 while(bits.length%8)bits.push(0);
 const data:number[]=[];
 for(let i=0;i<bits.length;i+=8){let n=0;for(let j=0;j<8;j++)n=(n<<1)|bits[i+j];data.push(n);}
 const filled=data.length;
 for(let i=filled;i<CAPACITY;i++)data.push((i-filled)%2===0?0xec:0x11);
 const div=divisor(18);
 const blocks=[data.slice(0,68),data.slice(68)];
 const ecc=blocks.map(b=>remainder(b,div));
 const all:number[]=[];
 for(let i=0;i<68;i++)for(let k=0;k<2;k++)all.push(blocks[k][i]);
 for(let i=0;i<18;i++)for(let k=0;k<2;k++)all.push(ecc[k][i]);
 const m=Array.from({length:QR_SIZE},()=>Array<boolean>(QR_SIZE).fill(false));
 const fixed=Array.from({length:QR_SIZE},()=>Array<boolean>(QR_SIZE).fill(false));
 function set(x:number,y:number,dark:boolean){if(x<0||y<0||x>=QR_SIZE||y>=QR_SIZE)return;m[y][x]=dark;fixed[y][x]=true;}
 function finder(cx:number,cy:number){for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy));set(cx+dx,cy+dy,d!==2&&d!==4);}}
 for(let i=0;i<QR_SIZE;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
 finder(3,3);finder(QR_SIZE-4,3);finder(3,QR_SIZE-4);
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(34+dx,34+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 const d=8;let rem=d;
 for(let i=0;i<10;i++)rem=(rem<<1)^((rem>>>9)*0x537);
 const format=((d<<10)|rem)^0x5412;
 const bit=(i:number)=>((format>>>i)&1)!==0;
 for(let i=0;i<=5;i++)set(8,i,bit(i));
 set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));
 for(let i=9;i<15;i++)set(14-i,8,bit(i));
 for(let i=0;i<8;i++)set(QR_SIZE-1-i,8,bit(i));
 for(let i=8;i<15;i++)set(8,QR_SIZE-15+i,bit(i));
 set(8,QR_SIZE-8,true);
 let k=0;
 for(let right=QR_SIZE-1;right>=1;right-=2){
  if(right===6)right=5;
  for(let v=0;v<QR_SIZE;v++){
   const y=(((right+1)&2)===0)?QR_SIZE-1-v:v;
   for(let j=0;j<2;j++){
    const x=right-j;
    if(fixed[y][x])continue;
    const value=k<all.length*8?((all[k>>>3]>>>(7-(k&7)))&1)!==0:false;
    m[y][x]=value!==((x+y)%2===0);k++;
   }
  }
 }
 return m;
}
export function qrSvg(text:string):string{
 const m=qrMatrix(text);const cells:string[]=[];
 for(let y=0;y<QR_SIZE;y++)for(let x=0;x<QR_SIZE;x++)if(m[y][x])cells.push("M"+(x+4)+" "+(y+4)+"h1v1h-1z");
 return '<svg xmlns="http://www.w3.org/2000/svg" width="588" height="588" viewBox="0 0 49 49" shape-rendering="crispEdges"><rect width="49" height="49" fill="#fff"/><path d="'+cells.join("")+'" fill="#000"/></svg>';
}
