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
    console.log("🚀 Setting up new account for:", email);

    const supabase = await createClient();

    // 1. الحصول على الخطة المجانية
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id")
      .eq("slug", "free_trial")
      .single();

    if (planError) {
      console.error("❌ Plan error:", planError);
      throw new Error("Free plan not found");
    }

    // 2. إنشاء الشركة
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: company_name,
        plan_id: plan.id,
        subscription_status: "trial",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        max_sessions_allowed: 1,
        max_contacts_allowed: 500,
        max_agents_allowed: 1,
      })
      .select()
      .single();

    if (companyError) {
      console.error("❌ Company creation error:", companyError);
      throw companyError;
    }

    // 3. الحصول على دور Company Owner
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("slug", "company_owner")
      .single();

    if (roleError) {
      console.error("❌ Role error:", roleError);
      throw roleError;
    }

    // 4. إنشاء العميل
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        user_id: user_id,
        company_id: company.id,
        role_id: role.id,
        is_active: true,
      })
      .select()
      .single();

    if (clientError) {
      console.error("❌ Client creation error:", clientError);
      throw clientError;
    }

    // 5. إنشاء company information
    const { error: infoError } = await supabase
      .from("company_information")
      .insert({
        client_id: client.id,
        company_name: company_name,
        email: email,
        created_at: new Date().toISOString(),
      });

    if (infoError) {
      console.error("❌ Company info error:", infoError);
      throw infoError;
    }

    console.log("✅ Account setup completed for:", email);

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Account setup completed",
      company_id: company.id,
      client_id: client.id,
    };
  } catch (error) {
    console.error("🔥 Setup account error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
