import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { signIn } from "./actions";

export const metadata: Metadata = { title: "Accesso riservato" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;
  const ready = hasPublicSupabaseConfiguration();

  return (
    <>
      <header className="site-header">
        <div className="page-container header-inner">
          <Brand />
          <Link href="/" className="header-login">Torna all&apos;inizio</Link>
        </div>
      </header>
      <main className="auth-page" id="contenuto">
        <section className="auth-card" aria-labelledby="access-title">
          <span className="section-kicker">ACCESSO RISERVATO</span>
          <h1 id="access-title">Bentornato.</h1>
          <p>Accedi con le credenziali verificate associate al tuo account Memorial.</p>
          {!ready && (
            <p role="status" className="auth-error">
              Autenticazione non ancora configurata per questo ambiente.
            </p>
          )}
          {errore === "accesso" && (
            <p role="alert" className="auth-error">
              Impossibile accedere. Verifica le credenziali e riprova.
            </p>
          )}
          {errore === "verifica" && (
            <p role="alert" className="auth-error">
              Verifica l&apos;indirizzo email del tuo account prima di effettuare l&apos;accesso.
            </p>
          )}
          <form action={signIn}>
            <div className="field">
              <label htmlFor="email">Indirizzo email</label>
              <input id="email" name="email" type="email" autoComplete="email" required disabled={!ready} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required disabled={!ready} />
            </div>
            <button className="button auth-submit" type="submit" disabled={!ready}>Accedi in sicurezza</button>
          </form>
          <p className="auth-note">
            La registrazione delle agenzie e l&apos;assegnazione dei ruoli saranno attivate nelle milestone successive.
          </p>
        </section>
      </main>
    </>
  );
}
