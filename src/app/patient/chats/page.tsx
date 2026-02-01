"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
    Send,
    User,
    ChevronLeft,
    Loader2,
    MessageCircle,
    ShoppingCart,
    ExternalLink,
    MoreVertical,
    Search,
    Check,
    Store,
    Image as ImageIcon,
    Clock,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientChatsPage() {
    // Data State
    const [connections, setConnections] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
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
        fetchConnections();
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load Messages when pharmacy selected
    useEffect(() => {
        if (selectedPharmacy) {
            fetchMessages(selectedPharmacy.id);
            const unsubscribe = subscribeToMessages(selectedPharmacy.id);
            return () => { unsubscribe(); };
        }
    }, [selectedPharmacy]);

    // Scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    async function fetchConnections() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        const { data } = await supabase
            .from("connections")
            .select("pharmacy_id, profiles:pharmacy_id(id, full_name)")
            .eq("patient_id", user.id);

        if (data) {
            setConnections(data.map((c: any) => c.profiles).filter(Boolean));
        }
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

        return () => { supabase.removeChannel(channel); };
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || !e.target.files[0] || !selectedPharmacy) return;

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
        if ((!content && !imageUrl) || !selectedPharmacy) return;

        if (!imageUrl) setNewMessage("");

        // Optimistic update
        const optimisticMsg = {
            id: Date.now(),
            sender_id: currentUser.id,
            receiver_id: selectedPharmacy.id,
            content: content || (imageUrl ? "Sent an image" : ""),
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const { error } = await supabase
            .from("messages")
            .insert([{
                sender_id: currentUser.id,
                receiver_id: selectedPharmacy.id,
                content: content || (imageUrl ? "Sent an image" : ""),
                image_url: imageUrl
            }]);

        if (error) {
            alert("Failed to send message: " + error.message);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    }

    const filteredPharmacies = connections.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showSidebar = !isMobile || !selectedPharmacy;
    const showChat = !isMobile || selectedPharmacy;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100dvh-80px)] md:h-[calc(100vh-110px)] flex bg-white md:rounded-3xl md:shadow-xl md:border md:border-slate-200 overflow-hidden relative">

            {/* Sidebar - Pharmacy List */}
            <AnimatePresence mode="popLayout" initial={false}>
                {showSidebar && (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        className="w-full md:w-80 lg:w-96 border-r border-slate-100 bg-white flex flex-col z-10 absolute md:relative inset-y-0"
                    >
                        <div className="p-4 border-b border-slate-50 bg-white z-10 sticky top-0">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-4">Pharmacies</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search pharmacy..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredPharmacies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                    <Store className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-xs">No connected pharmacies</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredPharmacies.map(pharmacy => (
                                        <motion.div
                                            key={pharmacy.id}
                                            layoutId={`pharma-${pharmacy.id}`}
                                            onClick={() => setSelectedPharmacy(pharmacy)}
                                            className={`p-3 rounded-2xl cursor-pointer transition-all group flex items-center gap-3 ${selectedPharmacy?.id === pharmacy.id
                                                ? 'bg-indigo-50 shadow-sm ring-1 ring-indigo-100'
                                                : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors shrink-0 ${selectedPharmacy?.id === pharmacy.id
                                                ? 'bg-[var(--primary)] text-white'
                                                : 'bg-white border border-slate-100 text-slate-600 group-hover:border-indigo-200'
                                                }`}>
                                                {pharmacy.full_name?.[0]?.toUpperCase() || <Store className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-bold truncate ${selectedPharmacy?.id === pharmacy.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {pharmacy.full_name || 'Pharmacy'}
                                                </h4>
                                                <p className={`text-xs truncate ${selectedPharmacy?.id === pharmacy.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                    Consultation open
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
                        {selectedPharmacy ? (
                            <>
                                <div className="h-16 border-b border-slate-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {isMobile && (
                                            <button
                                                onClick={() => setSelectedPharmacy(null)}
                                                className="p-1.5 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                        )}
                                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-200">
                                            {selectedPharmacy.full_name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm leading-tight">
                                                {selectedPharmacy.full_name}
                                            </h3>
                                            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Verified Pharmacist
                                            </span>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-6 md:p-6 bg-slate-50/50">
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
                                                    <OrderNotification msg={msg} currentUser={currentUser} selectedPharmacy={selectedPharmacy} />
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

                                <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.02)] z-20">
                                    <form onSubmit={(e) => sendMessage(e)} className="flex items-end gap-2 max-w-4xl mx-auto">
                                        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all flex items-center px-4 py-3">
                                            <input
                                                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 max-h-20 resize-none"
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
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 hidden md:flex">
                                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-50">
                                    <MessageCircle className="w-16 h-16 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Select a Pharmacy</h3>
                                <p className="text-sm max-w-xs text-center text-slate-400">Choose a pharmacy from the list to start a professional consultation.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function OrderNotification({ msg, currentUser, selectedPharmacy }: { msg: any; currentUser: any; selectedPharmacy: any }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    
    const isPharmacyOrder = msg.content.includes("PHARMACY_ORDER_REQUEST");
    const isCancelled = msg.content.includes("ORDER_STATUS:cancelled");
    const orderId = msg.content.match(/ORDER_ID:([0-9a-f-]{36})/)?.[1];
    const total = msg.content.match(/TOTAL:₹([^\\n]+)/)?.[1] || '0.00';
    const patientName = msg.content.match(/PATIENT:([^\\n]+)/)?.[1] || 'Patient';
    const items = msg.content.match(/ITEMS:([^\\n]+)/)?.[1] || 'Items';
    const notes = msg.content.match(/NOTES:([^\\n]+)/)?.[1] || 'None';
    const statusLine = msg.content.match(/STATUS:([^\\n]+)/)?.[1] || 'Unknown';
    const deadlineLine = msg.content.match(/DEADLINE:([^\\n]+)/)?.[1];
    const lines = msg.content.split('\n\n')[0];

    // Check order status for pharmacy orders
    useEffect(() => {
        if (isPharmacyOrder && orderId) {
            checkOrderStatus();
        }
    }, [isPharmacyOrder, orderId]);

    async function checkOrderStatus() {
        const { data } = await supabase
            .from("orders")
            .select("acceptance_status")
            .eq("id", orderId)
            .single();
        
        if (data) {
            setOrderStatus(data.acceptance_status);
        }
    }

    async function handleOrderAction(action: 'accept' | 'reject') {
        if (!orderId) return;
        
        setIsProcessing(true);
        try {
            if (action === 'accept') {
                // Update order status
                const { error: updateError } = await supabase
                    .from("orders")
                    .update({ 
                        acceptance_status: 'accepted',
                        status: 'placed'
                    })
                    .eq("id", orderId);

                if (updateError) throw updateError;

                // Send confirmation message
                await supabase
                    .from("messages")
                    .insert({
                        sender_id: currentUser.id,
                        receiver_id: selectedPharmacy.id,
                        content: `ORDER_ACCEPTED\nORDER_ID:${orderId}\nRESPONSE:Customer has accepted the order\nSTATUS:Ready for fulfillment`
                    });

                toast.success("Order accepted! You will receive updates on fulfillment.");

            } else {
                // Update order status
                const { error: updateError } = await supabase
                    .from("orders")
                    .update({ acceptance_status: 'rejected', status: 'cancelled' })
                    .eq("id", orderId);

                if (updateError) throw updateError;

                // Send rejection message
                await supabase
                    .from("messages")
                    .insert({
                        sender_id: currentUser.id,
                        receiver_id: selectedPharmacy.id,
                        content: `ORDER_REJECTED\nORDER_ID:${orderId}\nRESPONSE:Customer has rejected the order\nSTATUS:Cancelled`
                    });

                toast.success("Order rejected successfully.");
            }

            setOrderStatus(action === 'accept' ? 'accepted' : 'rejected');
            
        } catch (error: any) {
            toast.error("Error: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    }

    if (isPharmacyOrder) {
        const isPending = orderStatus === 'pending' || (!orderStatus && statusLine.includes('Pending'));
        const isExpired = deadlineLine && new Date(deadlineLine) < new Date();
        const isAccepted = orderStatus === 'accepted';
        const isRejected = orderStatus === 'rejected';

        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                className={`w-full max-w-sm rounded-2xl overflow-hidden border-2 transition-all ${
                    isRejected ? 'bg-red-50 border-red-100' : 
                    isAccepted ? 'bg-emerald-50 border-emerald-100' : 
                    isExpired ? 'bg-amber-50 border-amber-100' :
                    'bg-indigo-50 border-indigo-100'
                }`}
            >
                <div className={`p-3 flex items-center justify-between ${
                    isRejected ? 'bg-red-100/50' : 
                    isAccepted ? 'bg-emerald-100/50' : 
                    isExpired ? 'bg-amber-100/50' :
                    'bg-indigo-100/50'
                }`}>
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                            isRejected ? 'bg-white text-red-500' : 
                            isAccepted ? 'bg-white text-emerald-500' : 
                            isExpired ? 'bg-white text-amber-500' :
                            'bg-white text-indigo-500'
                        }`}>
                            {isRejected ? <AlertCircle className="w-4 h-4" /> : 
                             isAccepted ? <Check className="w-4 h-4" /> : 
                             isExpired ? <Clock className="w-4 h-4" /> :
                             <ShoppingCart className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                            isRejected ? 'text-red-700' : 
                            isAccepted ? 'text-emerald-700' : 
                            isExpired ? 'text-amber-700' :
                            'text-indigo-700'
                        }`}>
                            {isRejected ? 'Order Rejected' : 
                             isAccepted ? 'Order Accepted' : 
                             isExpired ? 'Order Expired' :
                             'Order Request'}
                        </span>
                    </div>
                    {isPending && !isExpired && (
                        <div className="text-xs text-indigo-600 font-medium">
                            {deadlineLine && `Expires: ${new Date(deadlineLine).toLocaleDateString()}`}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white/50 space-y-3">
                    <div className="space-y-2">
                        <div className="text-xs text-slate-500 font-medium">ORDER DETAILS</div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Total:</span>
                                <span className="font-semibold text-slate-900">₹{total}</span>
                            </div>
                            <div className="text-sm text-slate-600">
                                <span className="font-medium">Items:</span> {items}
                            </div>
                            {notes !== 'None' && (
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium">Notes:</span> {notes}
                                </div>
                            )}
                        </div>
                    </div>

                    {isPending && !isExpired && (
                        <div className="flex gap-2 pt-3 border-t border-slate-200/50">
                            <button
                                onClick={() => handleOrderAction('accept')}
                                disabled={isProcessing}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => handleOrderAction('reject')}
                                disabled={isProcessing}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Reject'}
                            </button>
                        </div>
                    )}

                    {isExpired && (
                        <div className="pt-3 border-t border-slate-200/50">
                            <div className="text-xs text-amber-600 font-medium text-center">
                                This order has expired. Please contact the pharmacy for a new order.
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    // Regular order notification (unchanged)
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => orderId && (window.location.href = `/patient/orders#order-${orderId}`)}
            className={`w-full max-w-sm rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${isCancelled ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
                }`}
        >
            <div className={`p-3 flex items-center justify-between ${isCancelled ? 'bg-red-100/50' : 'bg-emerald-100/50'}`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isCancelled ? 'bg-white text-red-500' : 'bg-white text-emerald-500'}`}>
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isCancelled ? 'text-red-700' : 'text-emerald-700'}`}>
                        {isCancelled ? 'Order Cancelled' : 'Order Placed'}
                    </span>
                </div>
                <ExternalLink className={`w-3.5 h-3.5 ${isCancelled ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>

            <div className="p-4 bg-white/50 space-y-3">
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                    {lines}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                    <div className="text-xs text-slate-500">View Details</div>
                    <div className="font-bold text-slate-900 italic">₹{total}</div>
                </div>
            </div>
        </motion.div>
    );
}
