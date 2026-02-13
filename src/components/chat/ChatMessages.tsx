"use client";

import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import { OrderBubble } from "./OrderBubble";

interface Message {
  id: number | string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface User {
  id: string;
}

interface Connection {
  id: string;
  full_name?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  currentUser: User;
  role: 'patient' | 'pharmacy';
  selectedConnection: Connection;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  currentUser,
  role,
  selectedConnection,
  messagesEndRef
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--app-bg)]">
      {messages.map((msg, i) => {
        const isMe = msg.sender_id === currentUser.id;
        const isOrder = msg.content.includes("ORDER_ID:");

        return (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
          >
            {isOrder ? (
              <OrderBubble
                msg={msg}
                role={role}
                currentUser={currentUser}
                selectedConnection={selectedConnection}
              />
            ) : (
              <div className={`max-w-[85%] md:max-w-[70%]`}>
                {msg.image_url ? (
                  <div className={`rounded-xl overflow-hidden mb-1 border ${isMe ? 'border-[var(--primary)]' : 'border-[var(--border)]'}`}>
                    <img
                      src={msg.image_url}
                      alt="Attachment"
                      className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.image_url, '_blank')}
                    />
                  </div>
                ) : null}
                {msg.content && msg.content !== "Sent an image" && (
                  <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${isMe
                    ? 'bg-[var(--primary)] text-[var(--text-inverse)] rounded-2xl rounded-tr-sm'
                    : 'bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border)] rounded-2xl rounded-tl-sm'
                    }`}>
                    {msg.content}
                  </div>
                )}
                <div className={`text-[10px] mt-1 flex gap-1 items-center ${isMe ? 'justify-end text-[var(--text-muted)]' : 'justify-start text-[var(--text-muted)]'
                  }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && (
                    <CheckCheck className="w-3 h-3 text-[var(--success)]" />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
