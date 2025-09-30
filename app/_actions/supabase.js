import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required (define SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in .env.local)");
}
if (!SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_ANON_KEY is required (define SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local)");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);