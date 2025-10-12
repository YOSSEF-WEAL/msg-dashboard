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
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let lastChats = [];

    const loadInitialChats = async () => {
      setLoading(true);
      const result = await fetchChats(sessionId, 0);
      if (isMounted && result) {
        setChats(result);
        lastChats = result;
        setOffset(result.length);
        setLoading(false);
      }
    };

    loadInitialChats();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const handleLoadMore = async () => {
    const newChats = await fetchChats(sessionId, offset);
    if (newChats.length > 0) {
      setChats((prev) => [...prev, ...newChats]);
      setOffset((prev) => prev + newChats.length);
    }
  };

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
        onLoadMore={handleLoadMore}
        loading={loading}
      />
    </Card>
  );
}
