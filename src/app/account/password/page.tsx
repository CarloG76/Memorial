import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { changeOwnPassword } from "./actions";

export const dynamic="force-dynamic";
export default async function ChangePassword({
  searchParams
}: {searchParams:Promise<{errore?:string;esito?:string}>}) {
  if(!hasPublicSupabaseConfiguration())redirect("/accedi");
  const db=await createServerSupabaseClient();
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user)redirect("/accedi");
  const q=await searchParams;
  return <main id="contenuto" className="auth-page">
    <section className="auth-card">
      <span className="section-kicker">SICUREZZA ACCOUNT</span>
      <h1>Cambia password</h1>
      <p>Modifica la password iniziale del tuo account. La nuova password non viene registrata nel database applicativo.</p>
      {q.errore&&<p className="auth-error" role="alert">Password non aggiornata. Verifica i campi e riprova.</p>}
      {q.esito==="ok"&&<p role="status">Password aggiornata correttamente.</p>}
      <form action={changeOwnPassword}>
        <div className="field"><label htmlFor="newPassword">Nuova password (minimo 12 caratteri)</label>
        <input id="newPassword" name="new_password" type="password" minLength={12} required autoComplete="new-password"/></div>
        <div className="field"><label htmlFor="confirmPassword">Ripeti la nuova password</label>
        <input id="confirmPassword" name="confirm_password" type="password" minLength={12} required autoComplete="new-password"/></div>
        <button type="submit" className="button auth-submit">Aggiorna password</button>
      </form>
      <p className="auth-note"><Link href="/console">Torna alla console</Link></p>
    </section>
  </main>;
}
