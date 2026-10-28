import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PublicMemorialDemo, type DemoMemorial } from "@/components/public-memorial-demo";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Memoriale dimostrativo",
 description:"Anteprima pubblica di un memoriale Premium sintetico. Nessuna registrazione richiesta.",
 robots:{index:false,follow:false,nocache:true}
};

export default async function DemoPublicMemorial(){
 const db=await createServerSupabaseClient();
 const {data,error}=await db.rpc("get_public_memorial_demo");
 if(error)throw new Error("Impossibile caricare l'anteprima del memoriale.");
 if(!data||typeof data!=="object")notFound();
 const preview=data as DemoMemorial;
 if(!preview.is_demo||!preview.name||!Array.isArray(preview.memories)||!Array.isArray(preview.thoughts))notFound();
 return <PublicMemorialDemo data={preview}/>;
}
