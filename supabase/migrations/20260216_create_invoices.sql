-- Invoices System
-- Auto-generated when orders are marked as complete

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    pharmacy_id UUID REFERENCES profiles(id) NOT NULL,
    patient_id UUID REFERENCES profiles(id) NOT NULL,
    
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    patient_address TEXT,
    
    pharmacy_name TEXT NOT NULL,
    pharmacy_address TEXT,
    pharmacy_phone TEXT,
    pharmacy_license TEXT,
    
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'cancelled')),
    
    invoice_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add invoice_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX idx_invoices_pharmacy ON invoices(pharmacy_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

COMMENT ON TABLE invoices IS 'Auto-generated invoices for completed orders';
