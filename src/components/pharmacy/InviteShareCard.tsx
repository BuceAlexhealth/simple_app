"use client";

import { Share2, CheckCircle2, Copy, Store, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useInviteLink } from "@/hooks/useInviteLink";
import { motion, AnimatePresence } from "framer-motion";

export function InviteShareCard() {
  const { inviteLink, copied, copyToClipboard } = useInviteLink();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-2xl glow-primary"
    >
      {/* Decorative Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full mix-blend-overlay filter blur-2xl animate-blob"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full mix-blend-overlay filter blur-2xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-300" /> Professional Dashboard
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3">
              Share Your Shop <Share2 className="w-6 h-6 opacity-80" />
            </h3>
            <p className="text-indigo-100/90 text-sm font-medium mt-2 max-w-sm">
              Invite patients to see your live inventory and place orders directly from their portal.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-1 flex items-center gap-2 border border-white/20 shadow-inner group transition-all hover:bg-white/15">
            <div className="flex-1 min-w-0 px-4">
              <code className="text-xs font-mono font-bold text-white/90 truncate block tracking-tighter">
                {inviteLink || "Generating your unique link..."}
              </code>
            </div>
            <Button
              size="lg"
              variant="ghost"
              className={`rounded-xl px-6 h-12 text-white hover:bg-white/20 hover:text-white transition-all transform active:scale-95 ${copied ? "bg-emerald-500/20 text-emerald-300" : ""}`}
              onClick={copyToClipboard}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="checked"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-2 font-black text-xs uppercase tracking-widest"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Copied!
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-2 font-black text-xs uppercase tracking-widest"
                  >
                    <Copy className="w-4 h-4" /> Copy Link
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        <div className="hidden lg:flex flex-shrink-0 w-32 h-32 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 rotate-6 transform transition-transform hover:rotate-0 duration-500 shadow-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <Store className="w-16 h-16 text-white opacity-90 drop-shadow-lg" />
        </div>
      </div>
    </motion.div>
  );
}