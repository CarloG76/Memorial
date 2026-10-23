import type { ReactNode } from "react";
type Name="dashboard"|"agenzie"|"memoriali"|"economia"|"statistiche"|"assistenza"|"impostazioni"|"search"|"bell"|"chevron"|"external"|"users"|"calendar"|"check"|"clock"|"shield"|"heart"|"folder";
const paths:Record<Name,ReactNode>={
 dashboard:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 agenzie:<><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 22v-5h6v5M9 6h.01M15 6h.01M9 11h.01M15 11h.01"/></>,
 memoriali:<><path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h5l2 4 2-4h5a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2h-5l-2 2-2-2H5a2 2 0 0 0-2 2Z"/></>,
 economia:<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v7c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12v7c0 1.7 4 3 9 3s9-1.3 9-3v-7"/></>,
 statistiche:<><path d="M4 20V11M10 20V5M16 20v-8M22 20V2M2 22h21"/></>,
 assistenza:<><path d="M3 14v-3a9 9 0 0 1 18 0v3M3 13h3a2 2 0 0 1 2 2v3H5a2 2 0 0 1-2-2zm18 0h-3a2 2 0 0 0-2 2v3h3a2 2 0 0 0 2-2zM20 18a5 5 0 0 1-5 4h-3"/></>,
 impostazioni:<><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/></>,
 search:<><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
 bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
 chevron:<path d="m6 9 6 6 6-6"/>,
 external:<path d="M7 17 17 7M7 7h10v10"/>,
 users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
 check:<path d="m5 12 4 4 10-10"/>,
 clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
 shield:<><path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6l9-4"/><path d="m8 12 3 3 5-6"/></>,
 heart:<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
 folder:<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9H3Z"/>
};
export function UiIcon({name,size=18}:{name:Name;size?:number}){return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>}
