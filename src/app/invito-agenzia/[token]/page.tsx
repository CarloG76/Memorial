import {notFound} from "next/navigation";
import {AgencyInviteAccept} from "@/components/agency-invite-accept";
export const dynamic="force-dynamic";
export default async function OperatorInvitationPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[0-9a-f]{64}$/.test(token))notFound();
 return <AgencyInviteAccept token={token}/>;
}
