"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

export async function setupNewAccount({
  user_id,
  email,
  company_name,
  full_name,
}) {
  try {

    const supabase = await createClient();

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id")
      .eq("slug", "free_trial")
      .single();

    if (planError) {
      console.error("❌ Plan error:", planError);
      const { data: firstPlan, error: firstPlanError } = await supabase
        .from("plans")
        .select("id")
        .limit(1)
        .single();

      if (firstPlanError) {
        throw new Error("No plans found in database");
      }
      plan = firstPlan;
    }

    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .limit(1)
      .single();

    let roleId = null;
    if (roleError) {
      console.log("⚠️ No roles found, using null");
    } else {
      roleId = role.id;
      console.log("✅ Using role:", roleId);
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        user_id: user_id,
        name: full_name,
        email: email,
        role: roleId, 
        is_active: true,
      })
      .select()
      .single();

    if (clientError) {
      console.error("❌ Client creation error:", clientError);
      throw clientError;
    }

    const { data: companyInfo, error: companyError } = await supabase
      .from("company_information")
      .insert({
        company_name: company_name,
        email: email,
        client_id: client.id,
        plan: plan.id,
      })
      .select()
      .single();

    if (companyError) {
      console.error("❌ Company info creation error:", companyError);
      throw companyError;
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        company_id: companyInfo.id,
      })
      .eq("id", client.id);

    if (updateError) {
      console.error("❌ Client update error:", updateError);
      throw updateError;
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Account setup completed",
      client_id: client.id,
      company_info_id: companyInfo.id,
    };
  } catch (error) {
    console.error("🔥 Setup account error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
