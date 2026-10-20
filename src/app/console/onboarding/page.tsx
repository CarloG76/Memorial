import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { readIdentityAndMemberships } from "@/lib/authz/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { activateAgencyFree } from "./actions";

export const dynamic = "force-dynamic";

export default async function AgencyOnboarding({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const identity = await readIdentityAndMemberships();
  if (!identity) redirect("/accedi");
  if (identity.workspaces.agencyCount > 0) redirect("/console/agenzia");
  const { errore } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("agency_legal_documents")
    .select("kind,version,document_url").eq("active", true);
  const terms = data?.find(d => d.kind === "B2B_TERMS");
  const privacy = data?.find(d => d.kind === "PRIVACY_NOTICE");
  const ready = !error && !!terms && !!privacy;

  return (
    <>
      <header className="site-header">
        <div className="page-container header-inner">
          <Brand /><Link className="header-login" href="/console">I tuoi spazi</Link>
        </div>
      </header>
      <main className="auth-page" id="contenuto">
        <section className="auth-card">
          <span className="section-kicker">AGENZIE · PIANO FREE</span>
          <h1>Completa la registrazione.</h1>
          <p>Conferma i dati aziendali e accetta le condizioni B2B.
             Il piano Free non prevede un canone.</p>
          {!ready && <p className="auth-error" role="status">
            Attivazione non disponibile: i documenti B2B devono essere approvati
            e pubblicati. Nessuna agenzia viene creata.
          </p>}
          {errore && <p className="auth-error" role="alert">
            Impossibile completare la registrazione. Controlla i dati
            e riprova.
          </p>}
          <form action={activateAgencyFree}>
            <div className="field">
              <label htmlFor="company">Ragione sociale</label>
              <input id="company" name="company" maxLength={240} required disabled={!ready}/>
            </div>
            <div className="field">
              <label htmlFor="vat">Partita IVA italiana</label>
              <input id="vat" name="vat" inputMode="numeric" maxLength={15} required disabled={!ready}/>
            </div>
            {ready && terms && privacy && (
              <>
                <input type="hidden" name="terms_version" value={terms.version}/>
                <input type="hidden" name="privacy_version" value={privacy.version}/>
                <p>Leggi le <a href={terms.document_url} target="_blank"
                  rel="noopener noreferrer">condizioni B2B</a> e
                  l&apos; <a href={privacy.document_url} target="_blank"
                  rel="noopener noreferrer">informativa privacy</a>.</p>
                <div className="field">
                  <label><input type="checkbox" name="accept_terms" required/>
                    Accetto le condizioni contrattuali B2B.</label>
                </div>
              </>
            )}
            <button type="submit" className="button auth-submit" disabled={!ready}>
              Attiva la mia agenzia Free
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
