"use client";

import { useState } from "react";
import { X, Plus, Package, Calendar, AlertTriangle, Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BatchInput, BatchUpdateInput } from "@/lib/validations/inventory";
import { useBatches } from "@/hooks/useBatches";
import { AnimatePresence, motion } from "framer-motion";
import { BatchSchema } from "@/lib/validations/inventory";

interface BatchManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string;
  productName: string;
}

export function BatchManagementModal({ 
  isOpen, 
  onClose, 
  inventoryId, 
  productName 
}: BatchManagementModalProps) {
  const { 
    batches, 
    loadingBatches, 
    refetchBatches,
    addBatch, 
    addStockToBatch, 
    updateBatch, 
    deleteBatch,
    isExpired,
    isExpiringSoon,
    addBatchLoading,
    addStockLoading,
    deleteBatchLoading
  } = useBatches(inventoryId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [showAddStockModal, setShowAddStockModal] = useState<string | null>(null);
  const [selectedBatchForHistory, setSelectedBatchForHistory] = useState<string | null>(null);
  
  const [newBatch, setNewBatch] = useState<Partial<BatchInput>>({
    batch_code: "",
    manufacturing_date: "",
    expiry_date: "",
    quantity: 0,
  });
  
  const [batchErrors, setBatchErrors] = useState<Partial<Record<keyof BatchInput, string>>>({});
  const [stockToAdd, setStockToAdd] = useState<number>(0);

  const resetForm = () => {
    setNewBatch({
      batch_code: "",
      manufacturing_date: "",
      expiry_date: "",
      quantity: 0,
    });
    setBatchErrors({});
    setShowAddForm(false);
  };

  const validateBatch = (): boolean => {
    try {
      const data: BatchInput = {
        batch_code: newBatch.batch_code || "",
        manufacturing_date: newBatch.manufacturing_date || "",
        expiry_date: newBatch.expiry_date || "",
        quantity: newBatch.quantity || 0,
      };
      BatchSchema.parse(data);
      setBatchErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof BatchInput, string>> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof BatchInput] = err.message;
          }
        });
        setBatchErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleAddBatch = () => {
    if (!validateBatch()) {
      toast.error("Please fix validation errors");
      return;
    }

    addBatch({
      batch_code: newBatch.batch_code!,
      manufacturing_date: newBatch.manufacturing_date!,
      expiry_date: newBatch.expiry_date!,
      quantity: newBatch.quantity!,
    } as BatchInput & { quantity: number });

    resetForm();
  };

  const handleDeleteBatch = (batchId: string) => {
    if (confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
      deleteBatch(batchId);
    }
  };

  const handleAddStock = (batchId: string) => {
    if (stockToAdd <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    addStockToBatch(batchId, stockToAdd);
    setShowAddStockModal(null);
    setStockToAdd(0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBatchStatus = (batch: { expiry_date: string; remaining_qty: number }) => {
    if (batch.remaining_qty === 0) return 'depleted';
    if (isExpired(batch.expiry_date)) return 'expired';
    if (isExpiringSoon(batch.expiry_date)) return 'expiring-soon';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'expiring-soon':
        return <Badge variant="warning">Expiring Soon</Badge>;
      case 'depleted':
        return <Badge variant="secondary">Depleted</Badge>;
      default:
        return <Badge variant="success">Active</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl max-h-[90vh] bg-[var(--surface-bg)] rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-main)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">Manage Batches</h2>
            <p className="text-sm text-[var(--text-muted)]">{productName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add Batch Button / Form */}
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add New Batch
            </Button>
          ) : (
            <Card className="border-[var(--primary)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add New Batch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Batch Code *</label>
                    <Input
                      placeholder="e.g., BAT-2026-001"
                      value={newBatch.batch_code}
                      onChange={(e) => setNewBatch({ ...newBatch, batch_code: e.target.value })}
                      className={batchErrors.batch_code ? 'border-[var(--error)]' : ''}
                    />
                    {batchErrors.batch_code && <p className="text-xs text-[var(--error)]">{batchErrors.batch_code}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Quantity *</label>
                    <Input
                      type="number"
                      min="1"
                      value={newBatch.quantity || ''}
                      onChange={(e) => setNewBatch({ ...newBatch, quantity: parseInt(e.target.value) || 0 })}
                      className={batchErrors.quantity ? 'border-[var(--error)]' : ''}
                    />
                    {batchErrors.quantity && <p className="text-xs text-[var(--error)]">{batchErrors.quantity}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Manufacturing Date *</label>
                    <Input
                      type="date"
                      value={newBatch.manufacturing_date}
                      onChange={(e) => setNewBatch({ ...newBatch, manufacturing_date: e.target.value })}
                      className={batchErrors.manufacturing_date ? 'border-[var(--error)]' : ''}
                    />
                    {batchErrors.manufacturing_date && <p className="text-xs text-[var(--error)]">{batchErrors.manufacturing_date}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Expiry Date *</label>
                    <Input
                      type="date"
                      value={newBatch.expiry_date}
                      onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                      className={batchErrors.expiry_date ? 'border-[var(--error)]' : ''}
                    />
                    {batchErrors.expiry_date && <p className="text-xs text-[var(--error)]">{batchErrors.expiry_date}</p>}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddBatch} disabled={addBatchLoading} className="flex-1">
                    {addBatchLoading ? 'Adding...' : 'Add Batch'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Batches List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">
              Batches ({batches.length}) - Total: {batches.reduce((s, b) => s + b.remaining_qty, 0)} units
            </h3>
            
            {loadingBatches ? (
              <div className="text-center py-8 text-[var(--text-muted)]">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No batches added yet</p>
              </div>
            ) : (
              batches.map((batch) => {
                const status = getBatchStatus(batch);
                return (
                  <Card key={batch.id} className={status === 'expired' ? 'border-[var(--error)] bg-[var(--error-bg)]' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-[var(--text-main)]">{batch.batch_code}</span>
                            {getStatusBadge(status)}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Mfg: {formatDate(batch.manufacturing_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Exp: {formatDate(batch.expiry_date)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[var(--text-main)]">
                            {batch.remaining_qty} / {batch.quantity}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">remaining</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowAddStockModal(batch.id)}
                            disabled={status === 'expired'}
                            title="Add stock"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBatch(batch.id)}
                            disabled={deleteBatchLoading}
                            title="Delete batch"
                            className="hover:text-[var(--error)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Add Stock Modal */}
                      <AnimatePresence>
                        {showAddStockModal === batch.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 pt-3 border-t border-[var(--border)]"
                          >
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="1"
                                placeholder="Quantity to add"
                                value={stockToAdd || ''}
                                onChange={(e) => setStockToAdd(parseInt(e.target.value) || 0)}
                                className="flex-1"
                              />
                              <Button 
                                onClick={() => handleAddStock(batch.id)}
                                disabled={addStockLoading}
                                size="sm"
                              >
                                {addStockLoading ? 'Adding...' : 'Add'}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setShowAddStockModal(null);
                                  setStockToAdd(0);
                                }}
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Expiry Warning */}
          {batches.some(b => isExpiringSoon(b.expiry_date)) && (
            <div className="flex items-center gap-2 p-3 bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg text-[var(--warning-600)] text-sm">
              <AlertTriangle className="w-4 h-4" />
              Some batches are expiring within 30 days
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
