"use client";
import {useEffect,useMemo,useState,type CSSProperties} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";

// Private Storage media are fetched through the Supabase Storage download endpoint.
// Supabase enforces RLS: authorized editors can preview drafts; visitors can fetch
// ONLY gallery objects referenced by published, covered memorials.
function useGalleryMedia(value:string|null|undefined){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [resolved,setResolved]=useState("");
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  setResolved("");setFailed(false);
  if(!value)return;
  const prefix="/storage/v1/object/public/memorial-gallery/";
  if(!value.startsWith(prefix)){setResolved(value);return;}
  const key=value.slice(prefix.length);
  if(!/^[0-9a-f-]{36}\/[-0-9a-f]{36}\.(jpg|png|webp)$/.test(key)){setFailed(true);return;}
  let alive=true;
  let blobUrl="";
  void db.storage.from("memorial-gallery").download(key).then(({data,error})=>{
   if(!alive)return;
   if(error||!data){setFailed(true);return;}
   blobUrl=URL.createObjectURL(data);
   setResolved(blobUrl);
  });
  return ()=>{alive=false;if(blobUrl)URL.revokeObjectURL(blobUrl);};
 },[db,value]);
 return {src:resolved,failed};
}
export function GalleryBackgroundImage({url,label,className,style}:{
 url:string;label:string;className?:string;style?:CSSProperties;
}){
 const {src,failed}=useGalleryMedia(url);
 return <div className={className} role="img" aria-label={failed?label+" (immagine non disponibile)":label}
  style={{...style,backgroundImage:src?"url("+JSON.stringify(src)+")":undefined}}/>;
}
export function GalleryThumbnail({url,alt,style}:{
 url:string;alt:string;style?:CSSProperties;
}){
 const {src,failed}=useGalleryMedia(url);
 return src?<img src={src} alt={alt} style={style}/>:
 <div role="img" aria-label={failed?alt+" (non disponibile)":alt+" (caricamento)"} style={{...style,background:"#e8edf0"}}/>;
}
