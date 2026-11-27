/** Browser-side preflight. Storage also independently enforces MIME and size. */
export const MAX_PORTRAIT_BYTES = 5 * 1024 * 1024;
export const PORTRAIT_EXTENSIONS:Readonly<Record<string,"jpg"|"png"|"webp">>={
 "image/jpeg":"jpg","image/png":"png","image/webp":"webp",
};

export type PortraitValidation = {ok:true;extension:"jpg"|"png"|"webp"} | {ok:false;message:string};

export function validatePortraitFile(input:{type:string;size:number}):PortraitValidation{
 const extension=Object.prototype.hasOwnProperty.call(PORTRAIT_EXTENSIONS,input.type)
  ?PORTRAIT_EXTENSIONS[input.type]:undefined;
 if(!extension)return {ok:false,message:"Sono accettati solo JPG, PNG e WebP."};
 if(!Number.isSafeInteger(input.size)||input.size<1||input.size>MAX_PORTRAIT_BYTES)
  return {ok:false,message:"Dimensione massima: 5 MB."};
 return {ok:true,extension};
}
