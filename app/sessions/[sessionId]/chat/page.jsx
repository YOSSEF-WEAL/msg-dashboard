"use client";

import { use, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import { fetchChats } from "./components/data-chats";

export default function ChatPage({ params }) {
  const { sessionId } = use(params);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const loadChats = async () => {
      setLoading(true);
      const result = await fetchChats(sessionId, 0);
      setChats(result);
      setOffset(result.length);
      setLoading(false);
    };
    loadChats();
  }, [sessionId]);

  const handleSelectChat = (chatId) => setActiveChat(chatId);

  const handleLoadMore = async () => {
    const newChats = await fetchChats(sessionId, offset);
    if (newChats.length > 0) {
      setChats((prev) => [...prev, ...newChats]);
      setOffset((prev) => prev + newChats.length);
    }
  };

  return (
    <Card className="flex flex-row h-screen w-full p-0">
      <ChatList
        sessionId={sessionId}
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onLoadMore={handleLoadMore}
        loading={loading}
      />
      <div className="flex-1 border-l border-border">
        {activeChat ? (
          <ChatWindow sessionId={sessionId} chatId={activeChat} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </Card>
  );
}
