"use client";

import { formatDistanceToNow } from "date-fns";

export default function MessageItem({ message }) {
  //   console.log("🚀 ~ MessageItem ~ message:", message);
  const { fromMe, text, timestamp } = message;
  return (
    <div className={`flex my-1 ${fromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-3 py-2 max-w-xs text-sm shadow-sm ${
          fromMe ? "bg-primary text-accent" : "bg-muted text-foreground"
        }`}
      >
        <p>{text}</p>
        <span className="block text-[10px] opacity-70 mt-1 text-right">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
