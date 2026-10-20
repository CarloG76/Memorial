import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata: Metadata = { title: "Verifica email" };

export default function SignupResultPage() {
  return (
    <>
      <header className="site-header"><div className="page-container header-inner"><Brand /></div></header>
      <main className="auth-page" id="contenuto">
        <section className="auth-card">
          <span className="section-kicker">CONFERMA IDENTITÀ</span>
          <h1>Controlla la tua posta.</h1>
          <p>Se la richiesta può essere elaborata, riceverai un messaggio per verificare l&apos;email. Dopo la verifica potrai accedere al tuo account.</p>
          <p>L&apos;agenzia non è ancora attiva: le condizioni contrattuali e l&apos;abilitazione Free saranno completate in un passaggio separato.</p>
          <Link href="/accedi" className="text-link">Torna al login</Link>
        </section>
      </main>
    </>
  );
}
