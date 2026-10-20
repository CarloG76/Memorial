import { describe, expect, it } from "vitest";
import { hasPublicSupabaseConfiguration } from "./env";

describe("public Supabase configuration", () => {
  it("fails closed without configuration", () => {
    expect(hasPublicSupabaseConfiguration({})).toBe(false);
  });

  it("rejects secret or legacy keys", () => {
    expect(hasPublicSupabaseConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_bad",
    })).toBe(false);
  });

  it("accepts a publishable key only for a Supabase HTTPS host", () => {
    expect(hasPublicSupabaseConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://memorial.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    })).toBe(true);
    expect(hasPublicSupabaseConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co.attacker.test",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    })).toBe(false);
  });
});
