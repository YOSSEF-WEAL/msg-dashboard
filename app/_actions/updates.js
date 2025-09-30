"use server";

import { createClient as createServerSupabase } from "@/lib/server";

export async function updateCompanyInformation(updatedData, clientId) {
  const { data, error } = await supabase
    .from("company_information")
    .update({ other_column: "otherValue" })
    .eq("some_column", "someValue")
    .select();

  if (error) {
  }
}
