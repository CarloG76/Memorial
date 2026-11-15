import {notFound} from "next/navigation";
import {InvitationActivation} from "@/components/invitation-activation";
export const dynamic="force-dynamic";
export default async function FamilyInvitePage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[a-f0-9]{64}$/.test(token))notFound();
 return <InvitationActivation token={token} kind="FAMILY"/>;
}
