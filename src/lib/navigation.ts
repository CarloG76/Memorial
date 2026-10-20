export type WorkspaceArea = "piattaforma" | "agenzia" | "famiglia";

export type NavigationItem = Readonly<{ label: string; slug: string }>;

export const WORKSPACE_NAV: Record<WorkspaceArea, readonly NavigationItem[]> = {
  piattaforma: [
    { label: "Dashboard", slug: "dashboard" },
    { label: "Agenzie", slug: "agenzie" },
    { label: "Memoriali", slug: "memoriali" },
    { label: "Economia", slug: "economia" },
    { label: "Statistiche", slug: "statistiche" },
    { label: "Assistenza", slug: "assistenza" },
    { label: "Impostazioni", slug: "impostazioni" },
  ],
  agenzia: [
    { label: "Dashboard", slug: "dashboard" },
    { label: "Memoriali", slug: "memoriali" },
    { label: "Statistiche", slug: "statistiche" },
    { label: "Amministrazione", slug: "amministrazione" },
    { label: "La mia agenzia", slug: "la-mia-agenzia" },
  ],
  famiglia: [
    { label: "Panoramica", slug: "panoramica" },
    { label: "Profilo e storia", slug: "profilo-e-storia" },
    { label: "Ricordi", slug: "ricordi" },
    { label: "Pensieri e commenti", slug: "pensieri-e-commenti" },
    { label: "Famiglia e contatti", slug: "famiglia-e-contatti" },
    { label: "Anniversari e solidarietà", slug: "anniversari-e-solidarieta" },
    { label: "Impostazioni", slug: "impostazioni" },
  ],
} as const;

export function isWorkspaceArea(input: string): input is WorkspaceArea {
  return Object.prototype.hasOwnProperty.call(WORKSPACE_NAV, input);
}
