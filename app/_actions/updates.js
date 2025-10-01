"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";

export async function updateCompanyInformation(data) {
  try {
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

    revalidatePath("/company");

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

export async function uploadCompanyLogo(formData) {
  try {
    const supabase = await createClient();
    const file = formData.get("file");
    const clientId = formData.get("client_id");

    if (!file || !clientId) {
      return { success: false, error: "File and client ID are required" };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${clientId}-${Date.now()}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    // الحصول على URL العام
    const { data: urlData } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const { data: updateData, error: updateError } = await supabase
      .from("company_information")
      .update({ logo_url: publicUrl })
      .eq("client_id", clientId)
      .select();

    if (updateError) {
      console.error("❌ Database update error:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log("✅ Database updated:", updateData);

    revalidatePath("/company");

    return {
      success: true,
      message: "Logo uploaded successfully",
      data: { logo_url: publicUrl, company: updateData },
    };
  } catch (error) {
    console.error("🔥 uploadCompanyLogo unexpected error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
