"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Brand } from "./brand";
import { UiIcon } from "./ui-icon";
import { WORKSPACE_NAV, type WorkspaceArea } from "@/lib/navigation";

const platformActive = new Set(["dashboard", "agenzie", "memoriali"]);
const icons = ["dashboard", "agenzie", "memoriali", "economia", "statistiche", "assistenza", "impostazioni"] as const;
type IconName = (typeof icons)[number];
const areaLabel: Record<WorkspaceArea, string> = {
  piattaforma: "SuperAdmin", agenzia: "Agenzia", famiglia: "Famiglia",
};
function iconFor(slug: string): IconName {
  return icons.find(icon => icon === slug) ?? "dashboard";
}
function workspaceUrl(area: WorkspaceArea, slug: string) {
  if (area === "piattaforma") return `/console/piattaforma?sezione=${slug}`;
  return `/console/${area}`;
}

function NavItems({ area, selected, onNavigate }: {
  area: WorkspaceArea; selected: string; onNavigate?: () => void;
}) {
  return <nav className="workspace-nav" aria-label={`Sezioni ${areaLabel[area]}`}>
    {WORKSPACE_NAV[area].map((item) => {
      const available = area==="piattaforma" ? platformActive.has(item.slug) : area==="agenzia" ? item.slug==="dashboard" : item.slug==="panoramica";
      const active = selected === item.slug;
      return available ? (
        <Link key={item.slug} href={workspaceUrl(area,item.slug)}
          className={active ? "side-item side-item-selected" : "side-item"}
          aria-current={active ? "page" : undefined} onClick={onNavigate}>
          <span className="sidebar-icon"><UiIcon name={iconFor(item.slug)} /></span>
          <span>{item.label}</span>
        </Link>
      ) : (
        <span key={item.slug} className="side-item side-item-disabled"
          aria-disabled="true" title="Sezione non ancora disponibile">
          <span className="sidebar-icon"><UiIcon name={iconFor(item.slug)} /></span>
          <span>{item.label}</span>
          <span className="side-item-soon">Prossimamente</span>
        </span>
      );
    })}
  </nav>;
}

export function WorkspaceChrome({ area, children }: { area: WorkspaceArea; children: React.ReactNode }) {
  const [open,setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("sezione");
  const selected = area==="piattaforma"
    ? pathname.includes("/agenzie/") ? "agenzie"
      : pathname.includes("/memoriali/") ? "memoriali"
      : section==="agenzie" || section==="memoriali" ? section : "dashboard"
    : area==="agenzia" ? "dashboard" : "panoramica";

  useEffect(() => {
    if(!open) return;
    const menu=menuRef.current;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const close=menu?.querySelector<HTMLButtonElement>(".workspace-mobile-close");
    close?.focus();
    function handleKey(e:KeyboardEvent) {
      if(e.key==="Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
      if(e.key!=="Tab" || !menu) return;
      const elements=Array.from(menu.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ));
      if(!elements.length) return;
      const first=elements[0],last=elements[elements.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
    document.addEventListener("keydown",handleKey);
    return () => {
      document.body.style.overflow=previousOverflow;
      document.removeEventListener("keydown",handleKey);
    };
  },[open]);

  function closeMenu(){setOpen(false);triggerRef.current?.focus();}
  return <div className="workspace">
    <aside className="workspace-sidebar workspace-desktop-sidebar" aria-label="Navigazione desktop">
      <Brand compact />
      <p className="workspace-context">Console {areaLabel[area]}</p>
      <NavItems area={area} selected={selected}/>
      <p className="sidebar-footnote">Un luogo di memoria, custodito nel tempo.</p>
    </aside>

    <div className="workspace-main">
      <header className="workspace-topbar">
        <button ref={triggerRef} className="workspace-menu-trigger" type="button"
          aria-controls="workspace-mobile-menu" aria-expanded={open} aria-label="Apri menu di navigazione"
          onClick={()=>setOpen(true)}>
          <span className="workspace-hamburger" aria-hidden="true"><span/><span/><span/></span>
        </button>
        <Link className="workspace-mobile-brand" href="/console" aria-label="Memorial, scegli area">
          <span className="workspace-mobile-monogram">✦</span> Memorial
        </Link>
        <Link href={area==="piattaforma"?"/console/piattaforma?sezione=agenzie":"/console"}
          className="workspace-search"><UiIcon name="search"/><span>Esplora i contenuti…</span></Link>
        <div className="workspace-account">
          <span className="workspace-avatar">{area==="piattaforma"?"SA":area==="agenzia"?"AG":"FA"}</span>
          <span className="workspace-account-label">{areaLabel[area]}</span>
          <Link href="/account/password" aria-label="Cambia password" title="Cambia password">
            <UiIcon name="shield" size={18}/>
          </Link>
          <Link href="/" aria-label="Sito pubblico" title="Sito pubblico">
            <UiIcon name="external" size={18}/>
          </Link>
        </div>
      </header>
      <main className="workspace-content" id="contenuto">{children}</main>
    </div>

    {open&&<>
      <button type="button" className="workspace-mobile-backdrop" aria-label="Chiudi menu"
        onClick={closeMenu}/>
      <aside ref={menuRef} id="workspace-mobile-menu" className="workspace-mobile-drawer"
        role="dialog" aria-modal="true" aria-label={`Menu ${areaLabel[area]}`}>
        <div className="workspace-mobile-drawer-top">
          <Brand compact/>
          <button type="button" className="workspace-mobile-close" aria-label="Chiudi menu"
            onClick={closeMenu}>×</button>
        </div>
        <p className="workspace-mobile-drawer-context">Console {areaLabel[area]}</p>
        <NavItems area={area} selected={selected} onNavigate={()=>setOpen(false)}/>
        <div className="workspace-mobile-drawer-footer">
          <Link href="/account/password" onClick={()=>setOpen(false)}>Cambia password</Link>
          <Link href="/" onClick={()=>setOpen(false)}>Torna al sito</Link>
        </div>
      </aside>
    </>}
  </div>;
}
