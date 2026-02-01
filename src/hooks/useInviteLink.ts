"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const useInviteLink = () => {
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const setupInviteLink = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/invite/${user.id}`);
    }
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    setupInviteLink();
  }, [setupInviteLink]);

  return {
    inviteLink,
    copied,
    copyToClipboard
  };
};