import type {Metadata} from "next";
import {notFound,redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {PublicMemorialDemo,type DemoMemorial} from "@/components/public-memorial-demo";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Anteprima privata del memoriale · MEMORIAL",
 description:"Anteprima riservata alle persone autorizzate.",
 robots:{index:false,follow:false,nocache:true}
};
export default async function AuthorizedMemorialPreview({params,searchParams}:{
 params:Promise<{id:string}>;searchParams:Promise<{contesto?:string}>
}){
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))notFound();
 const query=await searchParams;
 const context=typeof query.contesto==="string"&&/^[0-9a-f-]{36}$/i.test(query.contesto)?query.contesto:null;
 const db=await createServerSupabaseClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/accedi");
 const {data,error}=await db.rpc("get_authorized_memorial_preview",{target_memorial:id,context_key:context});
 if(error||!data||typeof data!=="object")notFound();
 const memorial=data as DemoMemorial;
 if(memorial.memorial_id!==id||!memorial.name||!Array.isArray(memorial.memories)||!Array.isArray(memorial.thoughts))notFound();
 return <PublicMemorialDemo data={memorial}/>;
}
