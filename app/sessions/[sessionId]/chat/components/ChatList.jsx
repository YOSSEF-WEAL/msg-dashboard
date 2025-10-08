"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";

export default function ChatList({
  sessionId,
  chats = [],
  activeChat,
  onSelectChat,
  loading,
}) {
  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  // Loading state
  if (loading) {
    return (
      <Card className="w-80 h-full flex flex-col border-border bg-background">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Empty state
  if (chats.length === 0) {
    return (
      <Card className="w-80 h-full flex flex-col border-border bg-background">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Chats</h2>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center p-6 text-muted-foreground">
          <MessageCircle className="h-14 w-14 text-muted-foreground mb-4" />
          <p>No conversations found</p>
          <p className="text-sm mt-1">Start a new chat from WhatsApp</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-full flex flex-col border-border bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Chats</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {chats.length} conversations
        </p>
      </div>

      {/* Chat List */}
      <ScrollArea className="max-h-screen overflow-hidden flex-1 p-0">
        <div className="divide-y divide-border">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full p-4 flex items-start gap-3 text-left transition-colors 
                ${
                  activeChat === chat.id
                    ? "bg-primary/10 border-r-4 border-primary"
                    : "hover:bg-muted/50"
                }`}
            >
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={chat.avatar} alt={chat.name} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials(chat.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-sm truncate">{chat.name}</h3>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatTime(chat.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 && (
                    <Badge
                      variant="default"
                      className="shrink-0 ml-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                    >
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
