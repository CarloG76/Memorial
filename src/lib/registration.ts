/** Pure validation for WF01 credential request; never authorizes an agency. */
export function normalizeItalianVat(raw: string): string | null {
  const digits = raw.trim().replace(/^IT/i, "").replace(/[\s.\-]/g, "");
  if (!/^\d{11}$/.test(digits)) return null;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let n = Number(digits[i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return Number(digits[10]) === (10 - (sum % 10)) % 10 ? digits : null;
}

export function normalizeAgencyName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 240 ? name : null;
}

export function normalizeEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

/** Safeguard: no signup before a privacy notice is actually published. */
export function canStartAgencySignup(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.AGENCY_SIGNUP_ENABLED !== "true") return false;
  const notice = env.B2B_PRIVACY_NOTICE_URL;
  if (!notice) return false;
  try {
    return new URL(notice).protocol === "https:";
  } catch {
    return false;
  }
}
