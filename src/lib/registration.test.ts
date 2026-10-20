import { describe, expect, it } from "vitest";
import {
  canStartAgencySignup, normalizeAgencyName, normalizeEmail, normalizeItalianVat,
} from "./registration";

describe("agency signup validation", () => {
  it("validates the Italian VAT checksum", () => {
    expect(normalizeItalianVat("IT12345678903")).toBe("12345678903");
    expect(normalizeItalianVat("12345678901")).toBeNull();
    expect(normalizeItalianVat("1234567890")).toBeNull();
    expect(normalizeItalianVat("unexpected")).toBeNull();
  });
  it("normalizes names and email", () => {
    expect(normalizeAgencyName("  Agenzia   Prova SRL  ")).toBe("Agenzia Prova SRL");
    expect(normalizeAgencyName(" ")).toBeNull();
    expect(normalizeEmail("  TEST@Example.IT ")).toBe("test@example.it");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });
  it("never opens signup absent explicit gate AND published privacy notice", () => {
    expect(canStartAgencySignup({})).toBe(false);
    expect(canStartAgencySignup({ AGENCY_SIGNUP_ENABLED: "true" })).toBe(false);
    expect(canStartAgencySignup({
      AGENCY_SIGNUP_ENABLED: "true", B2B_PRIVACY_NOTICE_URL: "http://example.com",
    })).toBe(false);
    expect(canStartAgencySignup({
      AGENCY_SIGNUP_ENABLED: "true", B2B_PRIVACY_NOTICE_URL: "https://example.com/privacy",
    })).toBe(true);
  });
});
