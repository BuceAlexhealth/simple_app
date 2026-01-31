"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
    Send,
    User,
    ChevronLeft,
    Loader2,
    MessageSquare,
    Package,
    ExternalLink,
    Search,
    MoreVertical,
    Check,
    Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PharmacyChatsPage() {
    // Data State
    const [patients, setPatients] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        fetchPatients();
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load Messages when patient selected
    useEffect(() => {
        if (selectedPatient) {
            fetchMessages(selectedPatient.id);
            const unsubscribe = subscribeToMessages(selectedPatient.id);
            return () => { unsubscribe(); };
        }
    }, [selectedPatient]);

    // Scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    async function fetchPatients() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        const { data: connections } = await supabase
            .from("connections")
            .select("patient_id, profiles:patient_id(id, full_name)")
            .eq("pharmacy_id", user.id);

        if (connections) {
            // Remove duplicates just in case
            // Remove duplicates just in case
            const entries = connections.map((c: any) => {
                const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                return [profile?.id, profile] as [string, any];
            }).filter((entry): entry is [string, any] => !!entry[0]);

            const uniquePatients = Array.from(new Map(entries).values());
            setPatients(uniquePatients);
        }
        setLoading(false);
    }

    async function fetchMessages(patientId: string) {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${patientId}),and(sender_id.eq.${patientId},receiver_id.eq.${currentUser.id})`)
            .order("created_at", { ascending: true });

        setMessages(data || []);
    }

    function subscribeToMessages(patientId: string) {
        const channel = supabase
            .channel(`chat:${patientId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    if (
                        (payload.new.sender_id === currentUser.id && payload.new.receiver_id === patientId) ||
                        (payload.new.sender_id === patientId && payload.new.receiver_id === currentUser.id)
                    ) {
                        setMessages(prev => [...prev, payload.new]);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || !e.target.files[0] || !selectedPatient) return;

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
        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function sendMessage(e: React.FormEvent | null, imageUrl?: string) {
        if (e) e.preventDefault();

        const content = newMessage.trim();
        if ((!content && !imageUrl) || !selectedPatient) return;

        if (!imageUrl) setNewMessage(""); // Optimistic clear

        // Optimistic update
        const optimisticMsg = {
            id: Date.now(),
            sender_id: currentUser.id,
            receiver_id: selectedPatient.id,
            content: content || (imageUrl ? "Sent an image" : ""),
            image_url: imageUrl,
            created_at: new Date().toISOString(),
            isOptimistic: true
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const { error } = await supabase
            .from("messages")
            .insert([{
                sender_id: currentUser.id,
                receiver_id: selectedPatient.id,
                content: content || (imageUrl ? "Sent an image" : ""),
                image_url: imageUrl
            }]);

        if (error) {
            alert("Failed to send message");
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    }

    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Determines visibility for mobile
    const showSidebar = !isMobile || !selectedPatient;
    const showChat = !isMobile || selectedPatient;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        // Main container - Fixed height to look like an app
        <div className="h-[calc(100dvh-80px)] md:h-[calc(100vh-110px)] flex bg-white md:rounded-3xl md:shadow-xl md:border md:border-slate-200 overflow-hidden relative">

            {/* Sidebar - Patient List */}
            <AnimatePresence mode="popLayout" initial={false}>
                {showSidebar && (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        className="w-full md:w-80 lg:w-96 border-r border-slate-100 bg-white flex flex-col z-10 absolute md:relative inset-y-0"
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-slate-50 bg-white z-10 sticky top-0">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-4">Messages</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredPatients.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                    <User className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-xs">No patients found</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredPatients.map(patient => (
                                        <motion.div
                                            key={patient.id}
                                            layoutId={`patient-${patient.id}`}
                                            onClick={() => setSelectedPatient(patient)}
                                            className={`p-3 rounded-2xl cursor-pointer transition-all group flex items-center gap-3 ${selectedPatient?.id === patient.id
                                                ? 'bg-emerald-50 shadow-sm ring-1 ring-emerald-100'
                                                : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors shrink-0 ${selectedPatient?.id === patient.id
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-white border border-slate-100 text-slate-600 group-hover:border-emerald-200'
                                                }`}>
                                                {patient.full_name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-bold truncate ${selectedPatient?.id === patient.id ? 'text-emerald-900' : 'text-slate-700'}`}>
                                                    {patient.full_name || 'Unknown Patient'}
                                                </h4>
                                                <p className={`text-xs truncate ${selectedPatient?.id === patient.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    Tap to view chat
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
                        className="flex-1 flex flex-col bg-[#F8FAFC] relative z-0 w-full absolute md:relative inset-0"
                    >
                        {selectedPatient ? (
                            <>
                                {/* Chat Header */}
                                <div className="h-16 border-b border-slate-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {isMobile && (
                                            <button
                                                onClick={() => setSelectedPatient(null)}
                                                className="p-1.5 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                        )}
                                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md shadow-emerald-200">
                                            {selectedPatient.full_name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm leading-tight">
                                                {selectedPatient.full_name}
                                            </h3>
                                            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Content */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-6 md:p-6 bg-slate-50/50">
                                    {messages.map((msg, i) => {
                                        const isMe = msg.sender_id === currentUser.id;
                                        const isOrder = msg.content.includes("ORDER_ID:");

                                        return (
                                            <motion.div
                                                key={msg.id || i}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.2 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {isOrder ? (
                                                    <OrderBubble msg={msg} />
                                                ) : (
                                                    <div className={`max-w-[85%] md:max-w-[70%]`}>
                                                        {msg.image_url ? (
                                                            <div className={`rounded-xl overflow-hidden mb-1 border ${isMe ? 'border-indigo-200' : 'border-slate-200'}`}>
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
                                                                ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl rounded-tr-sm'
                                                                : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm'
                                                                }`}>
                                                                {msg.content}
                                                            </div>
                                                        )}
                                                        <div className={`text-[10px] mt-1 opacity-60 flex gap-1 items-center ${isMe ? 'justify-end text-slate-400' : 'justify-start text-slate-400'
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

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.02)] z-20">
                                    <form onSubmit={(e) => sendMessage(e)} className="flex items-end gap-2 max-w-4xl mx-auto">
                                        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all flex items-center px-4 py-3">
                                            <input
                                                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 max-h-20 resize-none"
                                                placeholder="Type a message..."
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
                                                className={`p-2 rounded-full hover:bg-slate-200 transition-colors ${isUploading ? 'animate-pulse text-indigo-500' : 'text-slate-400 hover:text-indigo-500'}`}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <button
                                            disabled={!newMessage.trim() && !isUploading}
                                            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:scale-105 active:scale-95"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            // Desktop Placeholder
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 hidden md:flex">
                                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-50">
                                    <MessageSquare className="w-16 h-16 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Select a Conversation</h3>
                                <p className="text-sm max-w-xs text-center text-slate-400">Choose a patient from the list to view their profile and start chatting.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Subcomponent for Order Bubbles to keep main clear
function OrderBubble({ msg }: { msg: any }) {
    const isCancelled = msg.content.includes("ORDER_STATUS:cancelled");
    const orderId = msg.content.match(/ORDER_ID:([0-9a-f-]{36})/)?.[1];
    const total = msg.content.match(/ORDER_TOTAL:([^\\n]+)/)?.[1] || '0.00';
    const lines = msg.content.split('\n\n')[0];

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => orderId && (window.location.href = `/pharmacy#order-${orderId}`)}
            className={`w-full max-w-sm rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${isCancelled ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                }`}
        >
            <div className={`p-3 flex items-center justify-between ${isCancelled ? 'bg-red-100/50' : 'bg-amber-100/50'}`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isCancelled ? 'bg-white text-red-500' : 'bg-white text-amber-500'}`}>
                        <Package className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isCancelled ? 'text-red-700' : 'text-amber-700'}`}>
                        {isCancelled ? 'Order Cancelled' : 'New Order'}
                    </span>
                </div>
                <ExternalLink className={`w-3.5 h-3.5 ${isCancelled ? 'text-red-400' : 'text-amber-400'}`} />
            </div>

            <div className="p-4 bg-white/50 space-y-3">
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {lines}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                    <div className="text-xs text-slate-500">
                        Order <span className="font-mono text-slate-700">#{orderId?.slice(0, 8)}</span>
                    </div>
                    <div className="font-bold text-slate-900">
                        ₹{total}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
