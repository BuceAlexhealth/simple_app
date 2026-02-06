"use client";

import { Send, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ChatInputProps {
  newMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ChatInput({
  newMessage,
  onMessageChange,
  onSendMessage,
  onImageUpload,
  isUploading,
  fileInputRef
}: ChatInputProps) {
  return (
    <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--border)] z-20">
      <form onSubmit={onSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 bg-[var(--surface-bg)] rounded-xl border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all flex items-center px-4 py-2.5">
          <input
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] max-h-20 resize-none"
            placeholder="Type your message..."
            value={newMessage}
            onChange={e => onMessageChange(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={onImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-lg hover:bg-[var(--border)] transition-colors ${isUploading ? 'animate-pulse text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--primary)]'}`}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          </button>
        </div>
        <Button
          type="submit"
          disabled={!newMessage.trim() && !isUploading}
          className="p-3 h-11 w-11 rounded-xl"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
