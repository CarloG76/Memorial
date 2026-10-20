import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-page" id="contenuto">
      <section className="auth-card">
        <span className="section-kicker">PAGINA NON DISPONIBILE</span>
        <h1>Non troviamo questa pagina.</h1>
        <p>Il collegamento potrebbe non essere valido oppure il contenuto non essere accessibile.</p>
        <Link className="text-link" href="/">Torna alla pagina iniziale</Link>
      </section>
    </main>
  );
}
