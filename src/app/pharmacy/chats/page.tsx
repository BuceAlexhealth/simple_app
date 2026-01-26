"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, User, ChevronLeft, Loader2, MessageSquare } from "lucide-react";

export default function PharmacyChatsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        if (selectedPatient) {
            fetchMessages(selectedPatient.id);
            subscribeToMessages(selectedPatient.id);
        }
    }, [selectedPatient]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    async function fetchPatients() {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Fetch all patients who have connected or messaged
        const { data: connections } = await supabase
            .from("connections")
            .select("patient_id, profiles:patient_id(id, full_name)")
            .eq("pharmacy_id", user?.id);

        setPatients(connections?.map(c => c.profiles) || []);
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

        return () => supabase.removeChannel(channel);
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || !selectedPatient) return;

        const { error } = await supabase
            .from("messages")
            .insert([{
                sender_id: currentUser.id,
                receiver_id: selectedPatient.id,
                content: newMessage
            }]);

        if (error) alert(error.message);
        else setNewMessage("");
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>;

    if (!selectedPatient) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Consultations</h2>
                    <p className="text-sm text-slate-500">Respond to patients medical inquiries.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {patients.map((patient) => (
                        <div
                            key={patient.id}
                            onClick={() => setSelectedPatient(patient)}
                            className="app-card flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{patient.full_name || "Patient"}</h3>
                                    <p className="text-xs text-slate-400">Manage prescription requests</p>
                                </div>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-slate-300 rotate-180" />
                        </div>
                    ))}
                    {patients.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No connected patients found.</p>
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
                <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedPatient.full_name?.[0] || "P"}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">{selectedPatient.full_name}</h3>
                    <p className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest">Patient Profile</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`msg-bubble ${msg.sender_id === currentUser.id ? 'msg-bubble-out ml-auto bg-emerald-600' : 'msg-bubble-in mr-auto'}`}
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
                        <p className="text-xs text-slate-400 italic">Start a professional consultation.</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
                <input
                    type="text"
                    placeholder="Provide medical guidance..."
                    className="input-field py-2"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn-primary p-3 rounded-xl flex items-center justify-center bg-emerald-600 hover:bg-emerald-700">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
