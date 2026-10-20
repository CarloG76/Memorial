import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Memorial — torna alla pagina iniziale">
      <span className="brand-mark" aria-hidden="true">✦</span>
      <span className="brand-text">
        <strong>Memorial</strong>
        {!compact && <small>I ricordi continuano a vivere</small>}
      </span>
    </Link>
  );
}
