"use client";

import { useEffect } from "react";
import { initExpiredOrderChecker } from "@/lib/orderExpiry";

export default function OrderExpiryChecker() {
    useEffect(() => {
        const cleanup = initExpiredOrderChecker();
        return cleanup;
    }, []);

    return null; // This component doesn't render anything
}