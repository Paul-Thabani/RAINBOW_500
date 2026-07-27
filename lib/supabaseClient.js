import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only throws when actually used (not at import time), so the rest of the
// app still renders with a clear error surfaced instead of a build crash if
// Supabase hasn't been configured yet.
export function getSupabaseClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase isn't configured yet: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }
  return createClient(url, anonKey);
}
