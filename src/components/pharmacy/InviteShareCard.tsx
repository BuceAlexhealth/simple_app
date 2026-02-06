"use client";

import { Share2, CheckCircle2, Copy, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useInviteLink } from "@/hooks/useInviteLink";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";

export function InviteShareCard() {
  const { inviteLink, copied, copyToClipboard } = useInviteLink();

  return (
    <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] border-none text-white shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Share Your Shop</h3>
            </div>
            <p className="text-sm text-white/80">
              Invite patients to see your live inventory and place orders directly from their portal.
            </p>
            
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1 border border-white/20">
              <code className="flex-1 px-3 text-xs font-mono truncate text-white/90">
                {inviteLink || "Generating link..."}
              </code>
              <Button
                size="sm"
                variant={copied ? "default" : "ghost"}
                className={`rounded-md ${copied ? "bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
                onClick={copyToClipboard}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs">Copied</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">Copy</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          <div className="hidden md:flex w-16 h-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
            <Share2 className="w-8 h-8 text-white/80" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
