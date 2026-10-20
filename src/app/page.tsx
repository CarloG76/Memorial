import Link from "next/link";
import { Brand } from "@/components/brand";

export default function Home() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="page-container header-inner">
          <Brand />
          <nav aria-label="Navigazione principale">
            <Link href="/accedi" className="header-login">Accedi <span aria-hidden="true">→</span></Link>
          </nav>
        </div>
      </header>
      <main id="contenuto">
        <section className="hero">
          <div className="hero-light" aria-hidden="true" />
          <div className="page-container hero-inner">
            <div className="eyebrow"><span aria-hidden="true" className="eyebrow-rule" /> UN LUOGO PER RICORDARE</div>
            <h1>Ogni vita è una storia<br /><em>che merita di continuare.</em></h1>
            <p className="hero-copy">
              Un luogo riservato ai ricordi, alle parole e alle persone.
              Per custodire ciò che resta prezioso, nel tempo.
            </p>
            <div className="hero-actions">
              <Link href="/accedi" className="button button-gold">Accedi al tuo spazio <span aria-hidden="true">→</span></Link>
              <a href="#come-funziona" className="button button-outline">Scopri Memorial</a>
            </div>
            <p className="hero-caption">Pensato per le famiglie, insieme alle agenzie.</p>
          </div>
          <div className="hero-arc" aria-hidden="true" />
        </section>
        <section className="section-intro" id="come-funziona">
          <div className="page-container">
            <div className="section-heading">
              <span className="section-kicker">UN PERCORSO SEMPLICE</span>
              <h2>Un ricordo, tante voci.</h2>
              <p>Memorial accompagna ogni persona nel rispetto della propria storia.</p>
            </div>
            <div className="feature-grid">
              <article className="feature-card">
                <span className="feature-number">01</span>
                <div className="feature-symbol" aria-hidden="true">✧</div>
                <h3>L&apos;agenzia accompagna</h3>
                <p>L&apos;agenzia attiva lo spazio e invita i familiari a prepararlo.</p>
              </article>
              <article className="feature-card">
                <span className="feature-number">02</span>
                <div className="feature-symbol" aria-hidden="true">❦</div>
                <h3>La famiglia custodisce</h3>
                <p>Foto, storie e ricordi vengono scelti e approvati dalla famiglia.</p>
              </article>
              <article className="feature-card">
                <span className="feature-number">03</span>
                <div className="feature-symbol" aria-hidden="true">✦</div>
                <h3>Le persone ricordano</h3>
                <p>Chi riceve il collegamento può leggere e lasciare un pensiero, senza registrazione obbligatoria.</p>
              </article>
            </div>
          </div>
        </section>
        <section className="closing-band" aria-label="Il valore dei ricordi">
          <div className="page-container">
            <p>Perché i ricordi non appartengono al passato.</p>
            <strong>Continuano a vivere in chi li porta con sé.</strong>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="page-container footer-inner">
          <span>© 2026 Memorial</span>
          <span>Uno spazio di memoria e rispetto</span>
        </div>
      </footer>
    </div>
  );
}
