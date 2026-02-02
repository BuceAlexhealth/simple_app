-- Remove order expiry feature completely
-- Migration: 20250203_remove_order_expiry.sql

-- First, update any existing pending pharmacy orders to remove expiry data
UPDATE orders 
SET acceptance_status = NULL, acceptance_deadline = NULL 
WHERE acceptance_status = 'pending' AND initiator_type = 'pharmacy';

-- Drop the index on acceptance_deadline if it exists
DROP INDEX IF EXISTS idx_orders_acceptance_deadline;

-- Remove expiry-related columns from orders table
ALTER TABLE orders 
DROP COLUMN IF EXISTS acceptance_deadline,
DROP COLUMN IF EXISTS acceptance_status;

-- Remove the expiry function if it exists
DROP FUNCTION IF EXISTS cancel_expired_orders();

-- Remove any cron job for expiry if it exists
DROP EVENT IF EXISTS cancel_expired_orders_cron;

-- Note: This migration is irreversible and completely removes the order expiry feature
-- Pharmacy-initiated orders will now remain pending indefinitely until manual action