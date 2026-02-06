"use client";

import { motion } from "framer-motion";
import { MessageCircle, CheckCircle, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AvatarSkeleton } from "@/components/ui";
import { format } from "@/lib/notifications";
import type { ChatConnection } from "@/hooks/useChatConnections";

interface ChatConnectionListProps {
  connections: ChatConnection[];
  activeConnectionId: string | null;
  loading: boolean;
  onSelectConnection: (connectionId: string) => void;
  onClearActiveConnection: () => void;
  className?: string;
}

export function ChatConnectionList({
  connections,
  activeConnectionId,
  loading,
  onSelectConnection,
  onClearActiveConnection,
  className
}: ChatConnectionListProps) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <AvatarSkeleton />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-[var(--border-light)] rounded animate-pulse"></div>
                <div className="h-3 w-48 bg-[var(--border-light)] rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <MessageCircle className="w-12 h-12 mx-auto text-[var(--text-light)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-main)] mb-2">
          No conversations yet
        </h3>
        <p className="text-[var(--text-muted)] max-w-sm mx-auto">
          Start a conversation to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {activeConnectionId && (
        <div className="flex items-center justify-between mb-4 p-3 bg-[var(--primary-light)] rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm text-[var(--primary)]">
              Active conversation
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearActiveConnection}
            className="text-[var(--primary)] hover:bg-[var(--primary)]/20"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        </div>
      )}

      {connections.map((connection) => (
        <motion.div
          key={connection.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectConnection(connection.id)}
          className={cn(
            "p-4 rounded-lg border cursor-pointer transition-all duration-200",
            activeConnectionId === connection.id
              ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg"
              : "bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {connection.full_name ? connection.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                {connection.is_online && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-[var(--text-main)] truncate">
                    {connection.full_name || 'Unknown User'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    {connection.is_online && (
                      <>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Online</span>
                      </>
                    )}
                    {!connection.is_online && connection.last_message_time && (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Last seen {format.date(connection.last_message_time)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Unread count */}
            {connection.unread_count && connection.unread_count > 0 && (
              <Badge 
                variant="default" 
                className="bg-[var(--error)] text-white text-xs font-bold"
              >
                {connection.unread_count > 99 ? "99+" : connection.unread_count}
              </Badge>
            )}

            {/* Status indicator */}
            {activeConnectionId === connection.id && (
              <div className="w-2 h-2 bg-white rounded-full"></div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}