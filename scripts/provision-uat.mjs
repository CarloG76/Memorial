#!/usr/bin/env node
/**
 * One-time administrative provisioning. NEVER import into Next.js route handlers.
 * Invoke locally with privileged env vars, never in CI or browser bundles.
 * Passwords are read from env and are never printed, logged, or committed.
 */
import { createClient } from "@supabase/supabase-js";

const EXPECTED_PROJECT = "ojzkikhtcrqcpsvhepbp";
const OWNER_EMAIL = "gonella.carlo@gmail.com";
const ACCOUNTS = Object.freeze([
  ["owner.aurora@memorial-test.example", "agency", "A01", "OWNER"],
  ["operatore.aurora@memorial-test.example", "agency", "A01", "OPERATOR"],
  ["owner.quiete@memorial-test.example", "agency", "A02", "OWNER"],
  ["owner.ricordo@memorial-test.example", "agency", "A03", "OWNER"],
  ["laura.rossi@memorial-test.example", "family", "M01,M02", "OWNER"],
  ["marco.rossi@memorial-test.example", "family", "M01,M02", "EDITOR"],
  ["anna.bianchi@memorial-test.example", "family", "M07,M08,M09", "OWNER"],
  ["elena.verdi@memorial-test.example", "family", "M10,M11,M12", "OWNER"],
]);
const env = process.env;
function required(name) {
  if (!env[name]) throw new Error(`Missing required environment variable: ${name}`);
  return env[name];
}
const url = required("SUPABASE_URL");
const key = required("SUPABASE_SECRET_KEY");
const ownerPassword = required("MEMORIAL_OWNER_INITIAL_PASSWORD");
const demoPassword = required("MEMORIAL_DEMO_INITIAL_PASSWORD");
if (env.MEMORIAL_PROVISION_APPROVED !== "YES") {
  throw new Error("Set MEMORIAL_PROVISION_APPROVED=YES to run administrative provisioning.");
}
if (env.CI || env.VERCEL || env.NEXT_RUNTIME) {
  throw new Error("Do not provision identities from CI, a deployed app, or a runtime request.");
}
const parsed = new URL(url);
if (parsed.protocol !== "https:" || parsed.hostname !== `${EXPECTED_PROJECT}.supabase.co`) {
  throw new Error("Supabase target mismatch; refusing provisioning.");
}
if (ownerPassword === demoPassword || ownerPassword.length < 10 || demoPassword.length < 10) {
  throw new Error("Initial credentials do not satisfy provisioning policy.");
}
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});
async function must(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}
async function allUsers() {
  const result = [];
  for (let page = 1; page <= 30; page++) {
    const data = await must(await supabase.auth.admin.listUsers({ page, perPage: 100 }), "Read Auth users");
    result.push(...data.users);
    if (data.users.length < 100) return result;
  }
  throw new Error("Auth pagination limit reached; abort to avoid duplicate users.");
}
async function createOrVerify(email, password, demo, users) {
  const matches = users.filter(u => u.email?.toLowerCase() === email);
  if (matches.length > 1) throw new Error(`Duplicate Auth email ${email}`);
  if (matches.length) {
    const user = matches[0];
    if (!user.email_confirmed_at) throw new Error(`Existing account is unconfirmed: ${email}`);
    if (demo && user.app_metadata?.memorial_demo !== true) {
      throw new Error(`Existing non-demo Auth account collision: ${email}`);
    }
    // Idempotent: never overwrite password, verified status, or metadata.
    return user;
  }
  const user = await must(await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: demo ? { memorial_demo: true } : { memorial_owner_bootstrap: true },
  }), `Create Auth identity ${email}`);
  return user.user;
}
async function readCode(table, code) {
  const data = await must(await supabase.from(table)
    .select("id,is_demo,status").eq("demo_code", code).eq("is_demo", true).single(), `Lookup ${code}`);
  return data;
}
async function upsert(table, rows, conflict) {
  await must(await supabase.from(table).upsert(rows, {
    onConflict: conflict, ignoreDuplicates: false
  }), `Write ${table}`);
}
async function main() {
  const existingUsers = await allUsers();
  const existingOwners = await must(await supabase.from("platform_memberships")
    .select("user_id").eq("role","OWNER").eq("active",true), "Check platform owners");
  if (existingOwners.some(p => !existingUsers.find(u => u.id === p.user_id && u.email?.toLowerCase() === OWNER_EMAIL))) {
    throw new Error("An unexpected platform OWNER already exists. Manual review required.");
  }
  const agencies = new Map();
  for (const code of ["A01","A02","A03"]) agencies.set(code,await readCode("agencies",code));
  const memorials = new Map();
  for (const code of ["M01","M02","M07","M08","M09","M10","M11","M12"]) {
    memorials.set(code,await readCode("memorials",code));
  }

  // Create Auth identities first; no direct manipulation of auth.users.
  const owner = await createOrVerify(OWNER_EMAIL,ownerPassword,false,existingUsers);
  const users = new Map();
  for (const [email] of ACCOUNTS) {
    users.set(email, await createOrVerify(email,demoPassword,true,existingUsers));
  }
  await upsert("profiles",[{user_id:owner.id,display_name:"SuperAdmin Memorial",is_demo:false}],"user_id");
  await upsert("platform_memberships",[
    {user_id:owner.id,role:"OWNER",active:true,granted_by:owner.id}
  ],"user_id,role");

  for (const [email,type,code,role] of ACCOUNTS) {
    const user = users.get(email);
    await upsert("profiles",[{
      user_id:user.id,display_name:email.split("@")[0].replaceAll("."," "),is_demo:true
    }],"user_id");
    if (type === "agency") {
      const agency = agencies.get(code);
      await upsert("agency_members",[{
        agency_id:agency.id,user_id:user.id,role,
        active:agency.status === "ACTIVE",is_demo:true
      }],"agency_id,user_id");
    } else {
      const rows = code.split(",").map(c=>({
        memorial_id:memorials.get(c).id,user_id:user.id,role,
        can_moderate:role==="OWNER"||email.startsWith("marco."),
        can_edit_content:true,can_view_contacts:true,active:true,is_demo:true
      }));
      await upsert("family_members",rows,"memorial_id,user_id");
    }
  }
  const finalUsers = await allUsers();
  for (const email of [OWNER_EMAIL,...ACCOUNTS.map(a=>a[0])]) {
    if (!finalUsers.some(u=>u.email?.toLowerCase()===email && u.email_confirmed_at)) {
      throw new Error(`Post-provision verification failed for ${email}`);
    }
  }
  console.log("PROVISIONED: 9 confirmed Auth accounts, roles and memberships.");
  console.log("PASSWORDS: supplied through environment only, never printed.");
  console.log("RE-RUN: safe for existing identities; credentials are never reset.");
}
main().catch(error=>{
  // Never log request payloads or client configuration (which can include secrets).
  console.error("Provisioning failed:",error.message);
  process.exitCode=1;
});
