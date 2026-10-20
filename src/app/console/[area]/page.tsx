import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspaceAccess } from "@/lib/authz/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isWorkspaceArea, type WorkspaceArea } from "@/lib/navigation";

export const dynamic = "force-dynamic";

type Membership = Awaited<ReturnType<typeof requireWorkspaceAccess>>;

async function AgencyOverview({ userId }: { userId: string }) {
  const client = await createServerSupabaseClient();
  const memberships = await client.from("agency_members")
    .select("agency_id,role").eq("user_id",userId).eq("active",true);
  if (memberships.error) return <LoadError />;

  const agencyIds = (memberships.data ?? []).map(m => m.agency_id);
  if (agencyIds.length === 0) return <p>Non risultano agenzie attive collegate al tuo account.</p>;

  const agencies = await client.from("agencies")
    .select("id,legal_name,plan,status").in("id",agencyIds);
  if (agencies.error) return <LoadError />;

  const counts = await Promise.all(
    (agencies.data ?? []).map(async agency => ({
      agency,
      result: await client.from("memorials")
        .select("id",{ count: "exact", head: true })
        .eq("agency_id",agency.id),
    })),
  );

  return (
    <>
      <span className="workspace-label">Dashboard agenzia</span>
      <h1>Le tue agenzie</h1>
      <p className="muted">Solo le attività associate al tuo account. I dati familiari e i contenuti privati non sono accessibili da questa vista.</p>
      <div className="overview-grid">
        {counts.map(({agency,result}) => (
          <section className="workspace-panel overview-card" key={agency.id}>
            <span className="workspace-label">Agenzia</span>
            <h2>{agency.legal_name}</h2>
            <p>Abbonamento: <strong>{agency.plan === "PRO" ? "Pro" : "Free"}</strong></p>
            <p>Stato: <strong>{agency.status}</strong></p>
            <p>Memoriali gestiti: <strong>{result.error ? "Non disponibili" : result.count ?? 0}</strong></p>
          </section>
        ))}
      </div>
    </>
  );
}

async function FamilyOverview({ userId }: { userId: string }) {
  const client = await createServerSupabaseClient();
  const members = await client.from("family_members")
    .select("memorial_id,role").eq("user_id",userId).eq("active",true);
  if (members.error) return <LoadError />;
  return (
    <>
      <span className="workspace-label">Panoramica famiglia</span>
      <h1>I tuoi memoriali</h1>
      <p className="muted">Visualizzi solo i memoriali per cui hai un ruolo attivo. La compilazione dei contenuti sarà abilitata nelle prossime milestone.</p>
      <div className="overview-grid">
        {(members.data ?? []).map((entry, i) => (
          <section className="workspace-panel overview-card" key={entry.memorial_id}>
            <span className="workspace-label">Memoriale {i + 1}</span>
            <h2>Area riservata</h2>
            <p>Ruolo: <strong>{entry.role}</strong></p>
            <p className="muted">I contenuti privati non sono ancora disponibili in questa fase.</p>
          </section>
        ))}
      </div>
      {(members.data ?? []).length === 0 && <p>Non risultano memoriali collegati al tuo account.</p>}
    </>
  );
}

async function PlatformOverview({ membership }: { membership: Membership }) {
  const elevated = membership.workspaces.platformRoles.some(r => r === "OWNER" || r === "ADMIN");
  if (!elevated) {
    return (
      <>
        <span className="workspace-label">Area staff</span>
        <h1>Area riservata</h1>
        <p className="muted">Il tuo ruolo è attivo. I moduli dedicati allo staff saranno disponibili nelle prossime milestone. I dati delle agenzie e delle famiglie non sono accessibili da questo ruolo.</p>
      </>
    );
  }
  const client = await createServerSupabaseClient();
  const agencies = await client.from("agencies").select("id",{ count:"exact", head:true });
  return (
    <>
      <span className="workspace-label">Piattaforma Memorial</span>
      <h1>Panoramica operativa</h1>
      <p className="muted">Indicatori aggregati, senza accesso ai contenuti privati delle famiglie.</p>
      {agencies.error ? <LoadError /> : (
        <section className="workspace-panel overview-card">
          <span className="workspace-label">Agenzie registrate</span>
          <p className="overview-number">{agencies.count ?? 0}</p>
          <p className="muted">Numero di agenzie nel database.</p>
        </section>
      )}
    </>
  );
}

function LoadError() {
  return <p role="alert">Non è possibile leggere i dati autorizzati. Riprova successivamente.</p>;
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area } = await params;
  if (!isWorkspaceArea(area)) notFound();
  const identity = await requireWorkspaceAccess(area as WorkspaceArea);

  return (
    <WorkspaceShell area={area}>
      {area === "agenzia" && <AgencyOverview userId={identity.userId} />}
      {area === "famiglia" && <FamilyOverview userId={identity.userId} />}
      {area === "piattaforma" && <PlatformOverview membership={identity} />}
    </WorkspaceShell>
  );
}
