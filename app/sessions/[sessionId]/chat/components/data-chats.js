/**
 * ✅ Helper: Detect the real session name (Core uses only 'default')
 */

const baseUrl =
  process.env.NEXT_PUBLIC_WAHA_API_URL || process.env.WAHA_API_URL;
const apiKey = process.env.NEXT_PUBLIC_WAHA_API_KEY || process.env.WAHA_API_KEY;

async function resolveSessionName(sessionId) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `ApiKey ${apiKey}`;

    const sessionsRes = await fetch(`${baseUrl}/api/sessions`, {
      headers,
      cache: "no-store",
    });

    if (!sessionsRes.ok) {
      console.warn("⚠️ Could not fetch sessions, fallback to 'default'");
      return "default";
    }

    const sessions = await sessionsRes.json();

    // ✅ If WAHA Core → use only "default"
    if (sessions.length === 1 && sessions[0].name === "default") {
      return "default";
    }

    // ✅ Otherwise find matching session (Plus)
    const found =
      sessions.find(
        (s) =>
          s.id?.toString() === sessionId?.toString() ||
          s.name?.toString() === sessionId?.toString()
      ) || sessions[0];

    return found?.name || found?.id || "default";
  } catch (err) {
    console.warn("⚠️ Session detection failed, fallback to 'default'");
    return "default";
  }
}

/**
 * ✅ Fetch WhatsApp chats (with pagination)
 */
export async function fetchChats(sessionId, offset = 0, limit = 20) {
  try {
    if (!baseUrl) throw new Error("WAHA_API_URL not defined");

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `ApiKey ${apiKey}`;

    const realSession = await resolveSessionName(sessionId);

    const chatsRes = await fetch(
      `${baseUrl}/api/${realSession}/chats/overview?limit=${limit}&offset=${offset}`,
      { headers, cache: "no-store" }
    );

    const text = await chatsRes.text();
    if (!chatsRes.ok)
      throw new Error(`WAHA chats fetch failed: ${chatsRes.status} - ${text}`);

    const data = JSON.parse(text);

    return data.map((chat) => ({
      id: chat.id,
      name: chat.name || chat.id,
      lastMessage: chat.last_message?.text || "No messages yet",
      timestamp: chat.last_message?.timestamp
        ? new Date(chat.last_message.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      unreadCount: chat.unread_count || 0,
      avatar: chat.picture || null,
    }));
  } catch (error) {
    console.error("❌ Error fetching chats:", error);
    return [];
  }
}

/**
 * ✅ Fetch messages for a chat (with pagination)
 */

export async function fetchMessages(sessionId, chatId, offset = 0, limit = 20) {
  try {
    if (!baseUrl) throw new Error("WAHA_API_URL not defined");

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const realSession = await resolveSessionName(sessionId);

    const res = await fetch(
      `${baseUrl}/api/${realSession}/chats/${encodeURIComponent(
        chatId
      )}/messages?limit=${limit}&offset=${offset}`,
      { headers, cache: "no-store" }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Messages fetch failed: ${res.status} - ${text}`);
    }

    const data = await res.json();

    return data.map((msg) => ({
      id: msg.id,
      fromMe: msg.fromMe,
      text: msg.body || "",
      timestamp: msg.timestamp
        ? new Date(msg.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      ack: msg.ack,
      hasMedia: msg.hasMedia,
    }));
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    throw error;
  }
}

/**
 * ✅ Send a message
 */
export async function sendMessage(sessionId, chatId, text) {
  try {
    if (!baseUrl) throw new Error("WAHA_API_URL not defined");

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `ApiKey ${apiKey}`;

    const res = await fetch(`${baseUrl}/api/sendText`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        // session: sessionId || "default",
        session: "default",
        chatId,
        text,
        reply_to: null,
        linkPreview: true,
        linkPreviewHighQuality: false,
      }),
    });

    if (!res.ok)
      throw new Error(
        `Send message failed: ${res.status} - ${await res.text()}`
      );

    return await res.json();
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return false;
  }
}
