/** Memorial lifecycle labels used by ALL workspaces.
 * Technical DB states remain immutable; this is presentation only.
 * Unknown codes are labelled safely, never displayed as raw snake-case.
 */
export const MEMORIAL_STATE_LABELS = {
 DRAFT:"Bozza",
 PAYMENT_PENDING:"In attesa di attivazione",
 SKELETON_ACTIVE:"Da completare",
 FAMILY_PREPARING:"In preparazione",
 READY_FOR_PUBLICATION:"Pronto da pubblicare",
 PUBLISHED_ACTIVE:"Pubblicato",
 PRESERVED_STATIC:"In conservazione",
 EXPIRED:"Copertura scaduta",
 UNPUBLISHED_ARCHIVED:"Archiviato",
} as const;

const descriptions:Record<keyof typeof MEMORIAL_STATE_LABELS,string>={
 DRAFT:"Il memoriale è stato iniziato ma non ancora attivato.",
 PAYMENT_PENDING:"Il memoriale deve essere attivato prima di procedere.",
 SKELETON_ACTIVE:"Il memoriale è stato creato: completa i contenuti prima della pubblicazione.",
 FAMILY_PREPARING:"La famiglia sta personalizzando il memoriale.",
 READY_FOR_PUBLICATION:"I contenuti sono pronti: serve la conferma esplicita di pubblicazione.",
 PUBLISHED_ACTIVE:"Il memoriale è accessibile ai visitatori secondo le impostazioni di visibilità.",
 PRESERVED_STATIC:"Il memoriale è conservato in modalità statica.",
 EXPIRED:"La copertura del memoriale è scaduta.",
 UNPUBLISHED_ARCHIVED:"Il memoriale non è attualmente pubblicato."
};
export type MemorialState = keyof typeof MEMORIAL_STATE_LABELS;
export function isMemorialState(code:string):code is MemorialState {
 return Object.prototype.hasOwnProperty.call(MEMORIAL_STATE_LABELS,code);
}
export function memorialStateLabel(code:string|null|undefined):string{
 return code&&isMemorialState(code)?MEMORIAL_STATE_LABELS[code]:"Stato non disponibile";
}
export function memorialStateDescription(code:string|null|undefined):string{
 return code&&isMemorialState(code)?descriptions[code]:"Contatta l'assistenza per verificare lo stato di questo memoriale.";
}
export function memorialStateTone(code:string|null|undefined):"success"|"warning"|"muted"|"danger"{
 if(code==="PUBLISHED_ACTIVE")return "success";
 if(code==="EXPIRED")return "danger";
 if(code==="SKELETON_ACTIVE"||code==="FAMILY_PREPARING"||code==="READY_FOR_PUBLICATION"||code==="PAYMENT_PENDING")return "warning";
 return "muted";
}
export function agencyStatusLabel(code:string):string{
 return ({ACTIVE:"Attiva",SUSPENDED:"Sospesa",CLOSED:"Chiusa"} as Record<string,string>)[code]??"Stato non disponibile";
}
export function moderationStatusLabel(code:string):string{
 return ({PENDING:"Da verificare",APPROVED:"Approvato",REJECTED:"Rifiutato"} as Record<string,string>)[code]??"Stato non disponibile";
}
