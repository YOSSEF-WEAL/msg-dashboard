"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUp } from "lucide-react";
import { fetchMessages, sendMessage } from "./data-chats";

export default function ChatWindow({ sessionId, chatId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      const msgs = await fetchMessages(sessionId, chatId, 0);
      setMessages(msgs);
      setOffset(msgs.length);
      setLoading(false);
    };
    loadMessages();
  }, [sessionId, chatId]);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const older = await fetchMessages(sessionId, chatId, offset);
    if (older.length > 0) {
      setMessages((prev) => [...older, ...prev]);
      setOffset((prev) => prev + older.length);
    }
    setLoadingMore(false);
  };

  const handleSend = async (text) => {
    if (!text?.trim()) return;

    try {
      const result = await sendMessage(sessionId, chatId, text);

      if (result && result.id) {
        const newMsg = {
          id: result.id,
          fromMe: true,
          text: text,
          timestamp: new Date().toISOString(),
          pending: false,
        };
        setMessages((prev) => [...prev, newMsg]);
      } else {
        const failedMsg = {
          id: Date.now(),
          fromMe: true,
          text,
          timestamp: new Date().toISOString(),
          pending: true,
          error: true,
        };
        setMessages((prev) => [...prev, failedMsg]);
      }
    } catch (err) {
      console.error("❌ Error in handleSend:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b border-border">
        <h2 className="font-semibold truncate">{chatId}</h2>
      </div>

      <ScrollArea className="h-full flex-1 p-4 space-y-2 overflow-hidden gap-8">
        {loading ? (
          <div className="flex justify-center items-center h-50">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowUp className="h-4 w-4 mr-1" />
                    Load older
                  </>
                )}
              </Button>
            </div>

            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
          </>
        )}
      </ScrollArea>

      <MessageInput onSend={handleSend} />
    </div>
  );
}
