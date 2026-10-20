import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { canStartAgencySignup } from "@/lib/registration";
import { registerAgencyCredentials } from "./actions";

export const metadata: Metadata = { title: "Registrazione agenzia" };

export default async function AgencyRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;
  const enabled = canStartAgencySignup() && hasPublicSupabaseConfiguration();
  const privacyNotice = process.env.B2B_PRIVACY_NOTICE_URL;

  return (
    <>
      <header className="site-header">
        <div className="page-container header-inner">
          <Brand />
          <Link href="/accedi" className="header-login">Hai già un account? Accedi</Link>
        </div>
      </header>
      <main className="auth-page" id="contenuto">
        <section className="auth-card" aria-labelledby="signup-heading">
          <span className="section-kicker">AGENZIE FUNEBRI</span>
          <h1 id="signup-heading">Crea il tuo account.</h1>
          <p>Registra le credenziali del responsabile e verifica l&apos;email. L&apos;agenzia Free sarà attivata soltanto dopo la conferma dei dati e l&apos;accettazione delle condizioni B2B ufficiali.</p>
          {!enabled && <p role="status" className="auth-error">La registrazione è in preparazione: mancano le condizioni operative e l&apos;informativa da pubblicare. Non vengono raccolte nuove registrazioni.</p>}
          {errore && <p role="alert" className="auth-error">
            {errore === "dati"
              ? "Controlla ragione sociale, partita IVA italiana, email e password (almeno 12 caratteri)."
              : "Impossibile completare la richiesta. Riprova più tardi."}
          </p>}
          <form action={registerAgencyCredentials}>
            <div className="field">
              <label htmlFor="company">Ragione sociale</label>
              <input id="company" name="company" autoComplete="organization" maxLength={240} required disabled={!enabled}/>
            </div>
            <div className="field">
              <label htmlFor="vat">Partita IVA italiana</label>
              <input id="vat" name="vat" inputMode="numeric" maxLength={15} required disabled={!enabled}/>
            </div>
            <div className="field">
              <label htmlFor="email">Email del responsabile</label>
              <input id="email" name="email" type="email" autoComplete="email" required disabled={!enabled}/>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" minLength={12} autoComplete="new-password" required disabled={!enabled}/>
            </div>
            {enabled && privacyNotice && (
              <p className="auth-note">
                Leggi l&apos;<a href={privacyNotice} rel="noopener noreferrer" target="_blank">informativa privacy</a> prima di procedere. L&apos;accettazione del contratto B2B è un passaggio successivo, prima dell&apos;attivazione.
              </p>
            )}
            <button type="submit" className="button auth-submit" disabled={!enabled}>Crea credenziali</button>
          </form>
          <p className="auth-note">La verifica email non assegna ruoli amministrativi e non attiva pagamenti, memoriali o servizi prima del completamento WF01.</p>
        </section>
      </main>
    </>
  );
}
