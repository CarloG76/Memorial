import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {PublicMemorialDemo,type DemoMemorial} from "@/components/public-memorial-demo";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Memoriale · Una storia da custodire",robots:{index:false,follow:false,nocache:true}};
export default async function PublishedMemorial({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[0-9a-f]{48}$/.test(token))notFound();
 const db=await createServerSupabaseClient();
 const {data,error}=await db.rpc("get_published_memorial_by_token",{share_token:token});
 if(error||!data||typeof data!=="object")notFound();
 const memorial=data as DemoMemorial;
 if(!memorial.memorial_id||!memorial.name||!Array.isArray(memorial.memories)||!Array.isArray(memorial.thoughts))notFound();
 return <PublicMemorialDemo data={memorial}/>;
}
