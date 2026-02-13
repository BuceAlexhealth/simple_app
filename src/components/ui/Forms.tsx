"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { CSS_CLASSES } from "@/config/constants";
import { Loader2, Search, X, Plus, Send } from "lucide-react";

// Base form component
interface BaseFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  disabled?: boolean;
}

export function BaseForm({ children, onSubmit, className, disabled, ...props }: BaseFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-4", className)}
      {...props}
    >
      {children}
    </form>
  );
}

// Form field wrapper
interface FieldWrapperProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FieldWrapper({ children, label, error, required, className }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-main)]">
          {label}
          {required && <span className="text-[var(--error)] ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}

// Search form component
interface SearchFormProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  defaultValue?: string;
}

export function SearchForm({ 
  placeholder = "Search...", 
  onSearch, 
  onClear,
  className,
  disabled = false,
  loading = false,
  defaultValue = ""
}: SearchFormProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    onClear?.();
  }, [onClear]);

  return (
    <form onSubmit={handleSubmit} className={cn("relative group", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-light)] group-focus-within:text-[var(--primary)] transition-colors" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={cn(CSS_CLASSES.INPUT.BASE, "pl-10 pr-10")}
        disabled={disabled || loading}
      />
      {(query || loading) && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--primary)] transition-colors"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      )}
    </form>
  );
}

// Message form component
interface MessageFormProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
  className?: string;
  showCharCount?: boolean;
}

export function MessageForm({ 
  onSend, 
  placeholder = "Type a message...", 
  disabled = false,
  loading = false,
  maxLength = 1000,
  className,
  showCharCount = false
}: MessageFormProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !loading) {
      onSend(trimmedMessage);
      setMessage("");
    }
  }, [message, onSend, disabled, loading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  const isOverLimit = message.length > maxLength;
  const remainingChars = maxLength - message.length;

  return (
    <div className={cn("relative", className)}>
      <Textarea
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          CSS_CLASSES.INPUT.BASE,
          "min-h-[44px] max-h-32 resize-none pr-12",
          isOverLimit && CSS_CLASSES.INPUT.ERROR
        )}
        disabled={disabled || loading}
        maxLength={maxLength}
      />
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={!message.trim() || disabled || loading || isOverLimit}
        className="absolute right-2 bottom-2 p-1.5 rounded-md bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
      
      {showCharCount && (
        <div className="absolute -bottom-5 right-0 text-xs text-[var(--text-muted)]">
          {remainingChars} characters remaining
        </div>
      )}
    </div>
  );
}

// Order form component
interface OrderFormData {
  patientId: string;
  pharmacyId: string;
  items: Array<{
    inventoryId: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
  priority?: 'normal' | 'urgent';
}

interface OrderFormProps {
  initialData?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void;
  onCancel?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function OrderForm({ 
  initialData,
  onSubmit,
  onCancel,
  disabled = false,
  loading = false,
  className
}: OrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    patientId: "",
    pharmacyId: "",
    items: [],
    notes: "",
    priority: 'normal',
    ...initialData
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && !loading) {
      onSubmit(formData);
    }
  }, [formData, onSubmit, disabled, loading]);

  const updateField = useCallback((field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { inventoryId: "", quantity: 1, price: 0 }]
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  const updateItem = useCallback((index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, []);

  return (
    <BaseForm onSubmit={handleSubmit} className={cn("max-w-2xl mx-auto", className)}>
      <div className="space-y-6">
        {/* Order Items Section */}
        <FieldWrapper label="Order Items" required>
          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-3 items-center p-3 border border-[var(--border)] rounded-lg">
                <Input
                  placeholder="Inventory ID"
                  value={item.inventoryId}
                  onChange={(e) => updateItem(index, 'inventoryId', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-24"
                  min="1"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  className="w-24"
                  step="0.01"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="text-[var(--error)]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </FieldWrapper>

        {/* Notes Section */}
        <FieldWrapper label="Order Notes">
          <Textarea
            placeholder="Add any special instructions or notes..."
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="min-h-24"
          />
        </FieldWrapper>

        {/* Priority Section */}
        <FieldWrapper label="Priority">
          <div className="flex gap-4">
            {[
              { value: 'normal', label: 'Normal', description: 'Standard processing time' },
              { value: 'urgent', label: 'Urgent', description: 'Expedited processing' }
            ].map((priority) => (
              <label key={priority.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={(e) => updateField('priority', e.target.value)}
                  disabled={disabled}
                />
                <div>
                  <span className="font-medium">{priority.label}</span>
                  <p className="text-sm text-[var(--text-muted)]">{priority.description}</p>
                </div>
              </label>
            ))}
          </div>
        </FieldWrapper>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-[var(--border)]">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={disabled || loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={disabled || loading || formData.items.length === 0}
            isLoading={loading}
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </div>
    </BaseForm>
  );
}

// Inventory form component
interface InventoryFormData {
  name: string;
  brandName?: string;
  form?: string;
  price: number;
  stock: number;
  description?: string;
}

interface InventoryFormProps {
  initialData?: Partial<InventoryFormData>;
  onSubmit: (data: InventoryFormData) => void;
  onCancel?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function InventoryForm({ 
  initialData,
  onSubmit,
  onCancel,
  disabled = false,
  loading = false,
  className
}: InventoryFormProps) {
  const [formData, setFormData] = useState<InventoryFormData>({
    name: "",
    price: 0,
    stock: 0,
    ...initialData
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && !loading) {
      onSubmit(formData);
    }
  }, [formData, onSubmit, disabled, loading]);

  const updateField = useCallback((field: keyof InventoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <BaseForm onSubmit={handleSubmit} className={cn("max-w-lg mx-auto", className)}>
      <div className="space-y-6">
        <FieldWrapper label="Medication Name" required>
          <Input
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            disabled={disabled}
            required
          />
        </FieldWrapper>

        <FieldWrapper label="Brand Name">
          <Input
            value={formData.brandName || ""}
            onChange={(e) => updateField('brandName', e.target.value)}
            disabled={disabled}
          />
        </FieldWrapper>

        <FieldWrapper label="Form">
          <Input
            value={formData.form || ""}
            onChange={(e) => updateField('form', e.target.value)}
            disabled={disabled}
            placeholder="e.g., Tablet, Capsule"
          />
        </FieldWrapper>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Price" required>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
              disabled={disabled}
              step="0.01"
              min="0"
              required
            />
          </FieldWrapper>

          <FieldWrapper label="Stock Quantity" required>
            <Input
              type="number"
              value={formData.stock}
              onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)}
              disabled={disabled}
              min="0"
              required
            />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Description">
          <Textarea
            value={formData.description || ""}
            onChange={(e) => updateField('description', e.target.value)}
            disabled={disabled}
            className="min-h-24"
            placeholder="Optional description of the medication..."
          />
        </FieldWrapper>

        <div className="flex gap-4 pt-6 border-t border-[var(--border)]">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={disabled || loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={disabled || loading}
            isLoading={loading}
          >
            {loading ? 'Saving...' : 'Save Item'}
          </Button>
        </div>
      </div>
    </BaseForm>
  );
}

// Export all form components
export const Forms = {
  Base: BaseForm,
  FieldWrapper,
  Search: SearchForm,
  Message: MessageForm,
  Order: OrderForm,
  Inventory: InventoryForm,
} as const;