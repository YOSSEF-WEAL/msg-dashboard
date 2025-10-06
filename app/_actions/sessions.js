"use server";

import { createClient } from "@supabase/supabase-js";

const WAHA_API_URL = process.env.WAHA_API_URL;
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only report missing critical config as errors
if (!SUPABASE_URL) {
  console.error("CRITICAL: SUPABASE_URL is missing!");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing! RLS may block DB operations."
  );
}

function cleanApiUrl(url) {
  if (!url) return url;
  return url.replace(/\/+$/, "");
}

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase Admin configuration is missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// Helper function to get WAHA session status
async function fetchWahaStatus(wahaSessionId) {
  if (!WAHA_API_URL || !WAHA_API_KEY || !wahaSessionId) return null;

  const cleanUrl = cleanApiUrl(WAHA_API_URL);
  const endpoints = [
    `${cleanUrl}/api/sessions/${wahaSessionId}`,
    `${cleanUrl}/api/${wahaSessionId}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": WAHA_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        return data?.status?.toUpperCase() || null;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function createWhatsAppSession(
  companyId,
  phoneNumber,
  sessionName
) {
  try {
    const supabase = getSupabaseAdmin();

    if (!WAHA_API_URL || !WAHA_API_KEY) {
      throw new Error("WAHA API configuration is missing");
    }

    const cleanUrl = cleanApiUrl(WAHA_API_URL);
    const sessionId = "default";

    const { data: existingSession, error: fetchErr } = await supabase
      .from("sessions")
      .select("id")
      .eq("waha_session_id", sessionId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (existingSession) {
      throw new Error("Session already exists. Only one session is allowed.");
    }

    const sessionConfig = {};
    if (process.env.APP_URL) {
      const webhookUrl = `${cleanApiUrl(
        process.env.APP_URL
      )}/api/webhooks/whatsapp`;
      sessionConfig.webhooks = [
        {
          url: webhookUrl,
          events: ["message", "message.any", "session.status"],
        },
      ];
    }

    const requestBody = {
      name: sessionId,
      start: true,
      config: sessionConfig,
    };

    const response = await fetch(`${cleanUrl}/api/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": WAHA_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`WAHA API error: ${response.status} - ${responseText}`);
    }

    let sessionData = {};
    try {
      sessionData = JSON.parse(responseText);
    } catch {
      sessionData = { status: "STARTING" };
    }

    const wahaStatus = sessionData.status || "STARTING";
    const now = new Date().toISOString();
    const { data: session, error: dbError } = await supabase
      .from("sessions")
      .insert({
        waha_session_id: sessionId,
        phone_number: phoneNumber,
        session_name: sessionName || `Session-${phoneNumber}`,
        status: wahaStatus,
        company_id: companyId,
        started_at: now,
        created_at: now,
        updated_at: now,
        last_synced_at: now,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      success: true,
      message: "WhatsApp session created successfully",
      data: session,
    };
  } catch (error) {
    console.error("createWhatsAppSession error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to create WhatsApp session",
    };
  }
}

// ✅ Updated getCompanySessions to sync with WAHA
export async function getCompanySessions(companyId) {
  try {
    const supabase = getSupabaseAdmin();

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!sessions?.length) return { success: true, data: [] };

    const updatedSessions = [];

    for (const session of sessions) {
      const wahaStatus = await fetchWahaStatus(session.waha_session_id);
      if (wahaStatus && wahaStatus !== session.status) {
        await supabase
          .from("sessions")
          .update({
            status: wahaStatus,
            updated_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", session.id);
        updatedSessions.push({ ...session, status: wahaStatus });
      } else {
        updatedSessions.push(session);
      }
    }

    return { success: true, data: updatedSessions };
  } catch (error) {
    console.error("getCompanySessions error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to fetch or sync sessions",
    };
  }
}

export async function deleteSession(sessionId) {
  try {
    const supabase = getSupabaseAdmin();

    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("waha_session_id")
      .eq("id", sessionId)
      .single();

    if (fetchError) throw fetchError;

    const cleanUrl = cleanApiUrl(WAHA_API_URL);
    const wahaResponse = await fetch(
      `${cleanUrl}/api/sessions/${session.waha_session_id}`,
      {
        method: "DELETE",
        headers: { "X-Api-Key": WAHA_API_KEY },
      }
    );

    if (!wahaResponse.ok) {
      const warnText = await wahaResponse.text();
      console.error("WAHA delete warning:", warnText);
    }

    const { error: deleteError } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (deleteError) throw deleteError;

    return { success: true, message: "Session deleted successfully" };
  } catch (error) {
    console.error("deleteSession error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to delete session",
    };
  }
}

export async function getSessionQRCode(sessionId) {
  try {
    const supabase = getSupabaseAdmin();

    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("waha_session_id, status")
      .eq("id", sessionId)
      .single();

    if (fetchError) throw fetchError;

    const cleanUrl = cleanApiUrl(WAHA_API_URL);

    const endpoints = [
      `/api/${session.waha_session_id}/auth/qr`,
      `/api/sessions/${session.waha_session_id}/auth/qr`,
      `/api/${session.waha_session_id}/qr`,
      `/api/sessions/${session.waha_session_id}/qr`,
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      const fullUrl = `${cleanUrl}${endpoint}`;

      try {
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "X-Api-Key": WAHA_API_KEY,
            Accept: "application/json, image/png, image/jpeg, text/plain, */*",
          },
        });

        if (!response.ok) {
          lastError = `${response.status}: ${await response.text()}`;
          continue;
        }

        const contentType = response.headers.get("content-type") || "";
        let qrData = null;

        if (contentType.includes("application/json")) {
          const jsonData = await response.json();

          if (jsonData.qr) qrData = jsonData.qr;
          else if (jsonData.base64)
            qrData = jsonData.base64.startsWith("data:")
              ? jsonData.base64
              : `data:image/png;base64,${jsonData.base64}`;
          else if (jsonData.url) qrData = jsonData.url;
          else if (typeof jsonData === "string" && jsonData.length > 50)
            qrData = jsonData.startsWith("data:")
              ? jsonData
              : `data:image/png;base64,${jsonData}`;
        } else if (contentType.includes("image/")) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const mimeType = contentType.split(";")[0].trim();
          qrData = `data:${mimeType};base64,${base64}`;
        } else if (contentType.includes("text/")) {
          const text = await response.text();
          const cleanText = text.trim();
          if (cleanText.startsWith("data:image")) qrData = cleanText;
          else if (cleanText.length > 50)
            qrData = `data:image/png;base64,${cleanText}`;
        }

        if (qrData) return { success: true, data: { qr: qrData } };
      } catch (endpointError) {
        lastError = endpointError.message;
      }
    }

    throw new Error(
      `All QR endpoints failed. Last error: ${lastError || "Unknown error"}`
    );
  } catch (error) {
    console.error("getSessionQRCode error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to get QR code",
    };
  }
}

export async function updateSessionStatus(wahaSessionId, sessionId, newStatus) {
  try {
    const supabase = getSupabaseAdmin();

    if (!WAHA_API_URL || !WAHA_API_KEY) {
      throw new Error("WAHA API configuration is missing");
    }

    const cleanUrl = cleanApiUrl(WAHA_API_URL);
    const statusUrl = `${cleanUrl}/api/sessions/${wahaSessionId}`;

    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: { "X-Api-Key": WAHA_API_KEY },
    });

    let currentWahaStatus = null;
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      currentWahaStatus = statusData.status?.toUpperCase();
    }

    let wahaAction = null;
    const newStatusUpper = newStatus.toUpperCase();

    if (["WORKING", "STARTING", "SCAN_QR_CODE"].includes(newStatusUpper)) {
      if (["STOPPED", "FAILED", null].includes(currentWahaStatus)) {
        wahaAction = "start";
      }
    } else if (["STOPPED", "FAILED"].includes(newStatusUpper)) {
      if (["WORKING", "STARTING", "SCAN_QR_CODE"].includes(currentWahaStatus)) {
        wahaAction = "stop";
      }
    } else {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    if (wahaAction) {
      const wahaUrl = `${cleanUrl}/api/sessions/${wahaSessionId}/${wahaAction}`;
      const wahaResponse = await fetch(wahaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": WAHA_API_KEY,
        },
      });
      const wahaResponseText = await wahaResponse.text();
      if (!wahaResponse.ok)
        throw new Error(
          `WAHA API error: ${wahaResponse.status} - ${wahaResponseText}`
        );
    }

    const { data: session, error: dbError } = await supabase
      .from("sessions")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      success: true,
      message: wahaAction
        ? "Session status updated successfully in WAHA and database"
        : "Session status updated in database (WAHA already in desired state)",
      data: session,
    };
  } catch (error) {
    console.error("updateSessionStatus error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to update session status",
    };
  }
}
