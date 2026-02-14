"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createPortal } from "react-dom";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-[var(--surface-bg)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--error-bg)] rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              {title}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-muted)]">{description}</p>
            <p className="font-medium text-[var(--text-main)] bg-[var(--surface-bg)]/50 p-3 rounded-lg border border-[var(--border)]">
              &ldquo;{itemName}&rdquo;
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
