"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, User, ChevronLeft, Loader2, MessageCircle } from "lucide-react";

export default function PatientChatsPage() {
    const [connections, setConnections] = useState<any[]>([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        fetchConnections();
    }, []);

    useEffect(() => {
        if (selectedPharmacy) {
            fetchMessages(selectedPharmacy.id);
            subscribeToMessages(selectedPharmacy.id);
        }
    }, [selectedPharmacy]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    async function fetchConnections() {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        const { data } = await supabase
            .from("connections")
            .select("pharmacy_id, profiles:pharmacy_id(id, full_name)")
            .eq("patient_id", user?.id);

        setConnections(data?.map(c => c.profiles) || []);
        setLoading(false);
    }

    async function fetchMessages(pharmacyId: string) {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${pharmacyId}),and(sender_id.eq.${pharmacyId},receiver_id.eq.${currentUser.id})`)
            .order("created_at", { ascending: true });

        setMessages(data || []);
    }

    function subscribeToMessages(pharmacyId: string) {
        const channel = supabase
            .channel(`chat:${pharmacyId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    if (
                        (payload.new.sender_id === currentUser.id && payload.new.receiver_id === pharmacyId) ||
                        (payload.new.sender_id === pharmacyId && payload.new.receiver_id === currentUser.id)
                    ) {
                        setMessages(prev => [...prev, payload.new]);
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || !selectedPharmacy) return;

        const { error } = await supabase
            .from("messages")
            .insert([{
                sender_id: currentUser.id,
                receiver_id: selectedPharmacy.id,
                content: newMessage
            }]);

        if (error) alert(error.message);
        else setNewMessage("");
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>;

    if (!selectedPharmacy) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Messages</h2>
                    <p className="text-sm text-slate-500">Chat with your connected pharmacies.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {connections.map((pharmacy) => (
                        <div
                            key={pharmacy.id}
                            onClick={() => setSelectedPharmacy(pharmacy)}
                            className="app-card flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[var(--primary)]">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{pharmacy.full_name || "Pharmacist"}</h3>
                                    <p className="text-xs text-slate-400">Tap to start conversation</p>
                                </div>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-slate-300 rotate-180" />
                        </div>
                    ))}
                    {connections.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No connected pharmacies found.</p>
                            <p className="text-slate-300 text-sm mt-1">Connect with a pharmacy to start chatting.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[70vh] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-slate-50 p-4 border-b flex items-center gap-4">
                <button onClick={() => setSelectedPharmacy(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-bold">
                    {selectedPharmacy.full_name?.[0] || "P"}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">{selectedPharmacy.full_name}</h3>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Online</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`msg-bubble ${msg.sender_id === currentUser.id ? 'msg-bubble-out ml-auto' : 'msg-bubble-in mr-auto'}`}
                    >
                        {msg.content}
                        <div className={`text-[9px] mt-1 ${msg.sender_id === currentUser.id ? 'text-white/60' : 'text-slate-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
                {messages.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-xs text-slate-400 italic">No messages yet. Say hello!</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
                <input
                    type="text"
                    placeholder="Type your message..."
                    className="input-field py-2"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn-primary p-3 rounded-xl flex items-center justify-center">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
