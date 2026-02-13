"use client";

import { Search, Store, User } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";

interface Connection {
  id: string;
  full_name?: string;
}

interface ChatSidebarProps {
  connections: Connection[];
  selectedConnection: Connection | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onConnectionSelect: (connection: Connection) => void;
  role: 'patient' | 'pharmacy';
  isMobile: boolean;
}

export function ChatSidebar({
  connections,
  selectedConnection,
  searchTerm,
  onSearchChange,
  onConnectionSelect,
  role,
  isMobile
}: ChatSidebarProps) {
  const filteredConnections = connections.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const listTitle = role === 'patient' ? 'Pharmacies' : 'Messages';
  const emptyIcon = role === 'patient' ? <Store className="w-8 h-8 mb-2 opacity-40" /> : <User className="w-8 h-8 mb-2 opacity-40" />;
  const emptyText = role === 'patient' ? "No connected pharmacies" : "No patients found";
  const statusText = role === 'patient' ? "Consultation open" : "Tap to view chat";
  const itemIcon = role === 'patient' ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className="w-full md:w-80 lg:w-96 border-r border-[var(--border)] bg-[var(--card-bg)] flex flex-col z-10 absolute md:relative inset-y-0"
    >
      <div className="p-4 border-b border-[var(--border)] bg-[var(--card-bg)] z-10 sticky top-0">
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-3">{listTitle}</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--surface-bg)] border-[var(--border)] text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
            {emptyIcon}
            <p className="text-sm">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConnections.map(conn => (
              <motion.div
                key={conn.id}
                layoutId={`conn-${conn.id}`}
                onClick={() => onConnectionSelect(conn)}
                className={`p-3 rounded-xl cursor-pointer transition-all group flex items-center gap-3 ${selectedConnection?.id === conn.id
                  ? 'bg-[var(--primary-light)] ring-1 ring-[var(--primary)]'
                  : 'hover:bg-[var(--surface-bg)]'
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors shrink-0 ${selectedConnection?.id === conn.id
                  ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                  : 'bg-[var(--surface-bg)] border border-[var(--border)] text-[var(--text-muted)] group-hover:border-[var(--primary)]'
                  }`}>
                  {conn.full_name?.[0]?.toUpperCase() || itemIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold truncate ${selectedConnection?.id === conn.id ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>
                    {conn.full_name || 'Unknown'}
                  </h4>
                  <p className={`text-xs truncate ${selectedConnection?.id === conn.id ? 'text-[var(--primary)] opacity-70' : 'text-[var(--text-muted)]'}`}>
                    {statusText}
                  </p>
                </div>
                {selectedConnection?.id === conn.id && (
                  <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
