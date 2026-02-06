"use client";

import ChatInterface from "@/components/chat/ChatInterface";
import { motion } from "framer-motion";

export default function PharmacyChatsPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
        >
            <ChatInterface role="pharmacy" />
        </motion.div>
    );
}
