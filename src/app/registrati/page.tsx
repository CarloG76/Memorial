import Link from "next/link";
import type {Metadata} from "next";
import {Brand} from "@/components/brand";
export const metadata:Metadata={title:"Accesso alle agenzie Memorial"};
export default function AgencyRegistrationPage(){
 return <><header className="site-header"><div className="page-container header-inner"><Brand/><Link href="/accedi" className="header-login">Accedi</Link></div></header>
 <main className="auth-page" id="contenuto"><section className="auth-card">
  <span className="section-kicker">MEMORIAL · AGENZIE FUNEBRI</span>
  <h1>La tua agenzia entra su invito.</h1>
  <p>Per attivare una nuova agenzia, il nostro team invia al titolare un link personale valido 72 ore. Dal link puoi creare la password e accedere alla tua area riservata.</p>
  <p>Una nuova agenzia riceve due memoriali gratuiti iniziali; i successivi possono essere acquistati singolarmente, con o senza abbonamento.</p>
  <p className="auth-note">Hai ricevuto un invito? Apri il link contenuto nella comunicazione. Se hai già attivato l&apos;account, puoi accedere direttamente.</p>
  <Link href="/accedi" className="button auth-submit">Accedi a Memorial</Link>
 </section></main></>;
}
