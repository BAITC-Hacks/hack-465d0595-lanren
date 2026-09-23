import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getSupabase() {
  if (typeof window === "undefined") {
    throw new Error("Этот клиент предназначен для браузера.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Проверьте настройки Supabase в .env.local.");
  }

  if (!client) {
    client = createClient(url, key);
  }

  return client;
}