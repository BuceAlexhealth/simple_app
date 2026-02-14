"use client";

import { useState } from "react";
import { FileText, Store, Search, Calendar, ChevronDown, ChevronUp, X, Check, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvoices } from "@/hooks/useInvoices";
import { Invoice, InvoiceStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function PharmacyInvoicesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
    const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

    const { invoices, loading, refetch, updateStatus } = useInvoices({
        searchQuery: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
    });

    const filteredInvoices = invoices;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toFixed(2)}`;
    };

    const getStatusBadge = (status: InvoiceStatus) => {
        switch (status) {
            case 'issued':
                return <Badge variant="warning">Issued</Badge>;
            case 'paid':
                return <Badge variant="success">Paid</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const handleStatusChange = (invoiceId: string, newStatus: InvoiceStatus) => {
        updateStatus({ invoiceId, status: newStatus });
    };

    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0);
    const pendingAmount = filteredInvoices.filter(inv => inv.status === 'issued').reduce((sum, inv) => sum + inv.total_amount, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Store className="w-5 h-5 text-[var(--primary)]" />
                        <span className="text-sm font-medium text-[var(--primary)]">Store Operations</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">Invoices</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        View and manage generated invoices for completed orders
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--surface-bg)] rounded-lg p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)]">Total Invoices</p>
                    <p className="text-2xl font-bold text-[var(--text-main)]">{filteredInvoices.length}</p>
                </div>
                <div className="bg-[var(--surface-bg)] rounded-lg p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)]">Total Amount</p>
                    <p className="text-2xl font-bold text-[var(--text-main)]">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="bg-[var(--surface-bg)] rounded-lg p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)]">Pending Payments</p>
                    <p className="text-2xl font-bold text-[var(--warning)]">{formatCurrency(pendingAmount)}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <Input
                        placeholder="Search by invoice number or patient name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                    className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-bg)] text-[var(--text-main)]"
                >
                    <option value="all">All Status</option>
                    <option value="issued">Issued</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-auto"
                    placeholder="From"
                />
                <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-auto"
                    placeholder="To"
                />
            </div>

            <div className="bg-[var(--surface-bg)] rounded-lg border border-[var(--border)] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[var(--text-muted)]">Loading invoices...</div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No invoices found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {filteredInvoices.map((invoice) => (
                            <div key={invoice.id}>
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                                    onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <FileText className="w-5 h-5 text-[var(--primary)]" />
                                        <div>
                                            <p className="font-medium text-[var(--text-main)]">{invoice.invoice_number}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{invoice.patient_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-medium text-[var(--text-main)]">{formatCurrency(invoice.total_amount)}</p>
                                            <p className="text-sm text-[var(--text-muted)]">{formatDate(invoice.invoice_date)}</p>
                                        </div>
                                        {getStatusBadge(invoice.status)}
                                        {expandedInvoice === invoice.id ? (
                                            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                                        )}
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {expandedInvoice === invoice.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-[var(--surface-main)] border-t border-[var(--border)]"
                                        >
                                            <div className="p-4 space-y-4">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-[var(--text-muted)]">Pharmacy</p>
                                                        <p className="text-[var(--text-main)]">{invoice.pharmacy_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[var(--text-muted)]">Patient Phone</p>
                                                        <p className="text-[var(--text-main)]">{invoice.patient_phone || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[var(--text-muted)]">Patient Address</p>
                                                        <p className="text-[var(--text-main)]">{invoice.patient_address || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[var(--text-muted)]">Pharmacy License</p>
                                                        <p className="text-[var(--text-main)]">{invoice.pharmacy_license || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="border-t border-[var(--border)] pt-4">
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-[var(--text-muted)]">Subtotal</span>
                                                        <span className="text-[var(--text-main)]">{formatCurrency(invoice.subtotal)}</span>
                                                    </div>
                                                    {invoice.tax_amount > 0 && (
                                                        <div className="flex justify-between text-sm mb-2">
                                                            <span className="text-[var(--text-muted)]">Tax</span>
                                                            <span className="text-[var(--text-main)]">{formatCurrency(invoice.tax_amount)}</span>
                                                        </div>
                                                    )}
                                                    {invoice.discount_amount > 0 && (
                                                        <div className="flex justify-between text-sm mb-2">
                                                            <span className="text-[var(--text-muted)]">Discount</span>
                                                            <span className="text-[var(--text-main)]">-{formatCurrency(invoice.discount_amount)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between font-medium text-lg border-t border-[var(--border)] pt-2">
                                                        <span className="text-[var(--text-main)]">Total</span>
                                                        <span className="text-[var(--text-main)]">{formatCurrency(invoice.total_amount)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    {invoice.status === 'issued' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusChange(invoice.id, 'paid');
                                                            }}
                                                            className="gap-2"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            Mark as Paid
                                                        </Button>
                                                    )}
                                                    {invoice.status === 'paid' && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusChange(invoice.id, 'issued');
                                                            }}
                                                            className="gap-2"
                                                        >
                                                            <CreditCard className="w-4 h-4" />
                                                            Mark as Unpaid
                                                        </Button>
                                                    )}
                                                    {invoice.status !== 'cancelled' && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusChange(invoice.id, 'cancelled');
                                                            }}
                                                            className="gap-2"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Cancel Invoice
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
