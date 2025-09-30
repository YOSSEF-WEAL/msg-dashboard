"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";

export async function updateCompanyInformation(data) {
  try {
    console.log("🚀 ~ updateCompanyInformation ~ input data:", data);

    const supabase = await createClient();

    const companyData = {
      company_name: data.company_name,
      email: data.email,
      address: data.address,
      phone_number: data.phone_number,
      whatsapp_number: data.whatsapp_number,
      country: data.country,
      industry: data.industry,
    };

    const clientId = data.client_id;

    if (!clientId) {
      return { success: false, error: "Client ID is missing" };
    }

    const { data: companyUpdateData, error: companyError } = await supabase
      .from("company_information")
      .update(companyData)
      .eq("client_id", clientId)
      .select();

    if (companyError) {
      console.error("❌ Company update error:", companyError);
      return {
        success: false,
        error: companyError.message || "Failed to update company information",
      };
    }

    revalidatePath("/dashboard/company");

    return {
      success: true,
      message: "Company information updated successfully",
      data: { company: companyUpdateData },
    };
  } catch (error) {
    console.error("🔥 updateCompanyInformation unexpected error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
