import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-only client using the service-role key, which bypasses row level
// security. Never import this from a Client Component - it's only for the
// API routes under app/api/.
export function getSupabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase isn't configured yet: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
