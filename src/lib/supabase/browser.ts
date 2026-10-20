"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfiguration } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const { url, key } = getPublicSupabaseConfiguration();
  return createBrowserClient(url, key);
}
