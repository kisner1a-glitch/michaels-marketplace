import { createClient } from "@supabase/supabase-js";

// Server-only client. The secret key bypasses RLS, so never import this
// file from a "use client" component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);