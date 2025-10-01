"use server";

import { createClient as createServerSupabase } from "@/lib/server";

export async function getClient(userId) {
  if (!userId) {
    throw new Error("getClient: userId is required");
  }
  const supabase = await createServerSupabase();

  let { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getClient error:", error);
    throw new Error("Failed to load client");
  }

  return clients ?? null;
}

export async function getCompanyInformation(clientId) {
  const supabase = await createServerSupabase();

  let { data: companyInformation, error } = await supabase
    .from("company_information")
    .select("*")
    .eq("client_id", clientId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getCompanyInformation error:", error);
    throw new Error("Failed to load company information");
  }

  return companyInformation ?? null;
}

export async function getCountrys() {
  const supabase = await createServerSupabase();

  let { data: countrys, error } = await supabase.from("countrys").select("*");

  if (error) {
    console.error("getCountrys error:", error);
    throw new Error("Failed to load countrys");
  }

  return countrys ?? null;
}

export async function getIndustrys() {
  const supabase = await createServerSupabase();

  let { data: industrys, error } = await supabase.from("industrys").select("*");

  if (error) {
    console.error("getIndustries error:", error);
    throw new Error("Failed to load industries");
  }

  return industrys ?? null;
}

export async function getPaymentMethods() {
  const supabase = await createServerSupabase();

  let { data: payment_methods, error } = await supabase
    .from("payment_methods")
    .select("*");

  if (error) {
    console.error("getPaymentMethods error:", error);
    throw new Error("Failed to load payment methods");
  }

  return payment_methods ?? null;
}

export async function getPlans() {
  const supabase = await createServerSupabase();

  let { data: plans, error } = await supabase.from("plans").select("*");

  if (error) {
    console.error("getPlans error:", error);
    throw new Error("Failed to load Plans methods");
  }

  return plans ?? null;
}

export async function getRoles() {
  const supabase = await createServerSupabase();

  let { data: roles, error } = await supabase.from("roles").select("*");

  if (error) {
    console.error("getroles error:", error);
    throw new Error("Failed to load roles ");
  }

  return roles ?? null;
}

export async function getClientWithDetails(userId) {
  if (!userId) {
    throw new Error("getClientWithDetails: userId is required");
  }

  const supabase = await createServerSupabase();

  let { data: clients, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      roles (*),
      company_id (
        company_name,
        logo_url
        )
        `
    )
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getClientWithDetails error:", error);
    throw new Error("Failed to load client details");
  }

  return clients ?? null;
}
