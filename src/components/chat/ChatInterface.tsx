"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useAuth";
import {
    Send,
    User,
    ChevronLeft,
    Loader2,
    MessageCircle,
    MoreVertical,
    Search,
    Check,
    Store,
    Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getErrorMessage } from "@/lib/error-handling";
import { OrderBubble } from "./OrderBubble";

interface ChatInterfaceProps {
    role: 'patient' | 'pharmacy';
}

interface Connection {
    id: string;
    full_name?: string;
}

interface Message {
    id: number | string;
    sender_id: string;
    receiver_id: string;
    content: string;
    image_url?: string;
    created_at: string;
}

export default function ChatInterface({ role }: ChatInterfaceProps) {
    const { user: currentUser, loading: userLoading } = useUser();
    
    // Data State
    const [connections, setConnections] = useState<Connection[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Determines identifiers based on role
    const myIdField = useMemo(() => role === 'patient' ? 'patient_id' : 'pharmacy_id', [role]);
    const otherIdField = useMemo(() => role === 'patient' ? 'pharmacy_id' : 'patient_id', [role]);

    // Fetch connections
    const fetchConnections = useCallback(async () => {
        if (!currentUser) return;
        
        const { data } = await supabase
            .from("connections")
            .select(`${otherIdField}, profiles:${otherIdField}(id, full_name)`)
            .eq(myIdField, currentUser.id);

        if (data) {
            const normalized = data.map((c: { profiles: Connection | Connection[] }) => {
                const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                return profile;
            }).filter(Boolean);

            const unique = Array.from(new Map(normalized.map((p: Connection) => [p.id, p])).values());
            setConnections(unique);
        }
        setLoading(false);
    }, [currentUser, myIdField, otherIdField]);

    const fetchMessages = useCallback(async (otherId: string) => {
        if (!currentUser) return;
        
        const { data } = await supabase
            .from("messages")
            .select("*")
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${currentUser.id})`)
            .order("created_at", { ascending: true });

        setMessages(data || []);
    }, [currentUser]);

    const subscribeToMessages = useCallback((otherId: string) => {
        if (!currentUser) return () => {};
        
        const channel = supabase
            .channel(`chat:${otherId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload: { new: Message }) => {
                    if (
                        (payload.new.sender_id === currentUser.id && payload.new.receiver_id === otherId) ||
                        (payload.new.sender_id === otherId && payload.new.receiver_id === currentUser.id)
                    ) {
                        setMessages(prev => [...prev, payload.new]);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUser]);

    // Initial Load
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        const initFetch = async () => {
            if (!currentUser) return;
            
            const { data } = await supabase
                .from("connections")
                .select(`${otherIdField}, profiles:${otherIdField}(id, full_name)`)
                .eq(myIdField, currentUser.id);

            if (data) {
                const normalized = data.map((c: { profiles: Connection | Connection[] }) => {
                    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                    return profile;
                }).filter(Boolean);

                const unique = Array.from(new Map(normalized.map((p: Connection) => [p.id, p])).values());
                setConnections(unique);
            }
            setLoading(false);
        };
        
        initFetch();
        return () => window.removeEventListener('resize', checkMobile);
    }, [currentUser, myIdField, otherIdField]);

    // Load Messages when connection selected
    useEffect(() => {
        if (selectedConnection) {
            fetchMessages(selectedConnection.id);
            const unsubscribe = subscribeToMessages(selectedConnection.id);
            return () => { unsubscribe(); };
        }
    }, [selectedConnection, fetchMessages, subscribeToMessages]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Show loading while UserContext is initializing
    if (userLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    // Don't render if no user
    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-[var(--text-muted)]">Please log in to access chats</p>
            </div>
        );
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || !e.target.files[0] || !currentUser) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(filePath);

            await sendMessage(null, publicUrl);
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(getErrorMessage(error));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function sendMessage(e: React.FormEvent | null, imageUrl?: string) {
        if (e) e.preventDefault();

        const content = newMessage.trim();
        if ((!content && !imageUrl) || !selectedConnection || !currentUser) return;

        if (!imageUrl) setNewMessage("");

        // Optimistic update
        const optimisticMsg = {
            id: Date.now(),
            sender_id: currentUser.id,
            receiver_id: selectedConnection.id,
            content: content || (imageUrl ? "Sent an image" : ""),
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const { error } = await supabase
            .from("messages")
            .insert([{
                sender_id: currentUser.id,
                receiver_id: selectedConnection.id,
                content: content || (imageUrl ? "Sent an image" : ""),
                image_url: imageUrl
            }]);

        if (error) {
            alert("Failed to send message: " + error.message);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    }

    const filteredConnections = connections.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showSidebar = !isMobile || !selectedConnection;
    const showChat = !isMobile || selectedConnection;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    // Role-specific UI constants
    const listTitle = role === 'patient' ? 'Pharmacies' : 'Messages';
    const emptyIcon = role === 'patient' ? <Store className="w-8 h-8 mb-2 opacity-20" /> : <User className="w-8 h-8 mb-2 opacity-20" />;
    const emptyText = role === 'patient' ? "No connected pharmacies" : "No patients found";
    const statusText = role === 'patient' ? "Consultation open" : "Tap to view chat";
    const badgeText = role === 'patient' ? "Verified Pharmacist" : "Online";
    const itemIcon = role === 'patient' ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />;

    return (
        <div className="h-[calc(100dvh-80px)] md:h-[calc(100vh-110px)] flex bg-[var(--card-bg)] md:rounded-3xl md:shadow-xl md:border md:border-[var(--border)] overflow-hidden relative">

            {/* Sidebar - List */}
            <AnimatePresence mode="popLayout" initial={false}>
                {showSidebar && (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        className="w-full md:w-80 lg:w-96 border-r border-[var(--border-light)] bg-[var(--card-bg)] flex flex-col z-10 absolute md:relative inset-y-0"
                    >
                        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--card-bg)] z-10 sticky top-0">
                            <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-4">{listTitle}</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-light)]" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface-bg)] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[var(--primary-light)] outline-none transition-all placeholder:text-[var(--text-light)]"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredConnections.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-[var(--text-light)]">
                                    {emptyIcon}
                                    <p className="text-xs">{emptyText}</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredConnections.map(conn => (
                                        <motion.div
                                            key={conn.id}
                                            layoutId={`conn-${conn.id}`}
                                            onClick={() => setSelectedConnection(conn)}
                                            className={`p-3 rounded-2xl cursor-pointer transition-all group flex items-center gap-3 ${selectedConnection?.id === conn.id
                                                ? 'bg-[var(--primary-light)] shadow-sm ring-1 ring-[var(--primary-light)]'
                                                : 'hover:bg-[var(--surface-bg)]'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors shrink-0 ${selectedConnection?.id === conn.id
                                                ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                                                : 'bg-[var(--card-bg)] border border-[var(--border-light)] text-[var(--neutral)] group-hover:border-[var(--primary-light)]'
                                                }`}>
                                                {conn.full_name?.[0]?.toUpperCase() || itemIcon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-bold truncate ${selectedConnection?.id === conn.id ? 'text-[var(--primary-dark)]' : 'text-[var(--text-main)]'}`}>
{conn.full_name || 'Unknown'}
                                                </h4>
                                                <p className={`text-xs truncate ${selectedConnection?.id === conn.id ? 'text-[var(--primary)]' : 'text-[var(--text-light)]'}`}>
                                                    {statusText}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <AnimatePresence mode="popLayout" initial={false}>
                {showChat && (
                    <motion.div
                        initial={isMobile ? { x: "100%" } : { opacity: 0 }}
                        animate={isMobile ? { x: 0 } : { opacity: 1 }}
                        exit={isMobile ? { x: "100%" } : { opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className="flex-1 flex flex-col bg-[var(--app-bg)] relative z-0 w-full absolute md:relative inset-0"
                    >
                        {selectedConnection ? (
                            <>
                                <div className="h-16 border-b border-[var(--border)]/50 bg-[var(--card-bg)]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {isMobile && (
                                            <button
                                                onClick={() => setSelectedConnection(null)}
                                                className="p-1.5 -ml-2 rounded-full hover:bg-[var(--surface-bg)] text-[var(--text-muted)]"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                        )}
                                        <div className="w-9 h-9 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-full flex items-center justify-center text-[var(--text-inverse)] text-sm font-bold shadow-md shadow-[var(--primary-glow)]">
                                            {selectedConnection.full_name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--text-main)] text-sm leading-tight">
                                                {selectedConnection.full_name}
                                            </h3>
                                            <span className="flex items-center gap-1.5 text-[10px] text-[var(--success)] font-bold uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-500)] animate-pulse" />
                                                {badgeText}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="p-2 text-[var(--text-light)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-bg)] rounded-full transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-6 md:p-6 bg-[var(--surface-bg)]/50">
                                    {messages.map((msg, i) => {
                                        const isMe = msg.sender_id === currentUser.id;
                                        const isOrder = msg.content.includes("ORDER_ID:");

                                        return (
                                            <motion.div
                                                key={msg.id || i}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {isOrder ? (
                                                    <OrderBubble
                                                        msg={msg}
                                                        role={role}
                                                        currentUser={currentUser}
                                                        selectedConnection={selectedConnection}
                                                    />
                                                ) : (
                                                    <div className={`max-w-[85%] md:max-w-[70%]`}>
                                                        {msg.image_url ? (
                                                            <div className={`rounded-xl overflow-hidden mb-1 border ${isMe ? 'border-[var(--primary-light)]' : 'border-[var(--border)]'}`}>
                                                                <img
                                                                    src={msg.image_url}
                                                                    alt="Attachment"
                                                                    className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                    onClick={() => window.open(msg.image_url, '_blank')}
                                                                />
                                                            </div>
                                                        ) : null}
                                                        {msg.content && msg.content !== "Sent an image" && (
                                                            <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm  ${isMe
                                                                ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-[var(--text-inverse)] rounded-2xl rounded-tr-sm'
                                                                : 'bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-light)] rounded-2xl rounded-tl-sm'
                                                                }`}>
                                                                {msg.content}
                                                            </div>
                                                        )}
                                                        <div className={`text-[10px] mt-1 opacity-60 flex gap-1 items-center ${isMe ? 'justify-end text-[var(--text-light)]' : 'justify-start text-[var(--text-light)]'
                                                            }`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isMe && <Check className="w-3 h-3" />}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--border-light)] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.02)] z-20">
                                    <form onSubmit={(e) => sendMessage(e)} className="flex items-end gap-2 max-w-4xl mx-auto">
                                        <div className="flex-1 bg-[var(--surface-bg)] rounded-2xl border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--primary-light)] focus-within:border-[var(--primary)] transition-all flex items-center px-4 py-3">
                                            <input
                                                className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-main)] placeholder:text-[var(--text-light)] max-h-20 resize-none"
                                                placeholder="Type your message..."
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`p-2 rounded-full hover:bg-[var(--border-light)] transition-colors ${isUploading ? 'animate-pulse text-[var(--primary)]' : 'text-[var(--text-light)] hover:text-[var(--primary)]'}`}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <button
                                            disabled={!newMessage.trim() && !isUploading}
                                            className="p-3 bg-[var(--primary)] text-[var(--text-inverse)] rounded-2xl hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-all shadow-lg hover:scale-105 active:scale-95"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-light)] p-8 hidden md:flex">
                                <div className="w-32 h-32 bg-[var(--surface-bg)] rounded-full flex items-center justify-center mb-6 ring-4 ring-[var(--surface-bg)]">
                                    <MessageCircle className="w-16 h-16 text-[var(--border-light)]" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Select a Conversation</h3>
                                <p className="text-sm max-w-xs text-center text-[var(--text-muted)]">Choose a contact from the list to start a professional consultation.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
