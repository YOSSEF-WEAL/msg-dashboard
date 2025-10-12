/**
 * Fetch WhatsApp chats from WAHA API for a given session.
 */
export async function fetchChats(sessionId, offset = 0, limit = 20) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL || process.env.WAHA_API_URL;
    const apiKey =
      process.env.NEXT_PUBLIC_WAHA_API_KEY || process.env.WAHA_API_KEY;

    if (!baseUrl) throw new Error("WAHA_API_URL not defined");

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `ApiKey ${apiKey}`;

    // ✅ 1. Get sessions
    const sessionsRes = await fetch(`${baseUrl}/api/sessions`, {
      headers,
      cache: "no-store",
    });

    if (!sessionsRes.ok)
      throw new Error(`WAHA sessions fetch failed: ${sessionsRes.status}`);

    const sessions = await sessionsRes.json();
    const sessionObj =
      sessions.find(
        (s) =>
          s.id?.toString() === sessionId?.toString() ||
          s.name?.toString() === sessionId?.toString()
      ) || sessions[0];

    if (!sessionObj) throw new Error("No valid WAHA session found");

    const realSession = sessionObj.name || sessionObj.id;

    // ✅ 2. Fetch chats with pagination
    const chatsRes = await fetch(
      `${baseUrl}/api/${realSession}/chats/overview?limit=${limit}&offset=${offset}`,
      {
        headers,
        cache: "no-store",
      }
    );

    const text = await chatsRes.text();
    if (!chatsRes.ok)
      throw new Error(`WAHA chats fetch failed: ${chatsRes.status} - ${text}`);

    const data = JSON.parse(text);

    // ✅ 3. Normalize
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
