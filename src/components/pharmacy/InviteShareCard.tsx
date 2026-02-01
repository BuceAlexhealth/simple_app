"use client";

import { Share2, CheckCircle2, Copy, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useInviteLink } from "@/hooks/useInviteLink";

export function InviteShareCard() {
  const { inviteLink, copied, copyToClipboard } = useInviteLink();

  return (
    <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
      <div className="relative z-10 w-full md:w-auto">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Share2 className="w-5 h-5" /> Share Your Store
        </h3>
        <p className="text-indigo-100 text-sm mt-1">Invite patients to connect and browse your live inventory.</p>

        <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-2 flex items-center justify-between gap-3 border border-white/20">
          <code className="text-xs font-mono opacity-90 truncate overflow-hidden px-2">
            {inviteLink || "Generating link..."}
          </code>
          <Button
            size="icon"
            variant="ghost"
            className={`h-8 w-8 text-white hover:bg-white/20 ${copied ? "text-green-300" : ""}`}
            onClick={copyToClipboard}
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="hidden md:block opacity-20 rotate-12 scale-125">
        <Store className="w-24 h-24" />
      </div>
    </div>
  );
}