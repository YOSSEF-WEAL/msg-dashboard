"use client";

import { use, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ChatList from "./components/ChatList";
import { fetchChats } from "./components/data-chats";

export default function ChatPage({ params }) {
  const { sessionId } = use(params);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let lastChats = [];

    // ✅ أول تحميل فقط مع Skeleton
    const loadInitialChats = async () => {
      setLoading(true);
      const result = await fetchChats(sessionId);
      if (isMounted && result) {
        setChats(result);
        lastChats = result;
        setLoading(false);
      }
    };

    // ✅ تحديث صامت بعدين (بدون Skeleton)
    const silentUpdateChats = async () => {
      const result = await fetchChats(sessionId);
      if (isMounted && result) {
        const hasChanged = JSON.stringify(result) !== JSON.stringify(lastChats);
        if (hasChanged) {
          setChats(result);
          lastChats = result;
          console.log("🔄 Chats updated (silent refresh)");
        }
      }
    };

    loadInitialChats();

    const interval = setInterval(silentUpdateChats, 5000);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  const handleSelectChat = (chatId) => {
    setActiveChat(chatId);
  };

  return (
    <Card className="flex h-screen p-0">
      <ChatList
        sessionId={sessionId}
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        loading={loading}
      />
    </Card>
  );
}
