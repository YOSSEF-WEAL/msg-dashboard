"use client";

import { createClient } from "@/lib/client";

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}
