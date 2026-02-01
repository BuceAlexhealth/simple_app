-- Add support for pharmacy-initiated orders
-- Migration: 20240201_pharmacy_initiated_orders.sql

-- Add fields for pharmacy-initiated orders
ALTER TABLE orders 
ADD COLUMN initiator_type TEXT DEFAULT 'patient' CHECK (initiator_type IN ('patient', 'pharmacy')),
ADD COLUMN acceptance_status TEXT DEFAULT 'accepted' CHECK (acceptance_status IN ('pending', 'accepted', 'rejected')),
ADD COLUMN acceptance_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN pharmacy_notes TEXT;

-- Create index for better query performance
CREATE INDEX idx_orders_initiator_type ON orders(initiator_type);
CREATE INDEX idx_orders_acceptance_status ON orders(acceptance_status);
CREATE INDEX idx_orders_acceptance_deadline ON orders(acceptance_deadline);