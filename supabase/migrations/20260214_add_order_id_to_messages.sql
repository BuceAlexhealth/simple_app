-- Add order_id to messages for better traceability and indexing
-- This allows linking messages directly to orders without parsing content strings

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create index for faster order-related message lookups
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON public.messages(order_id);

-- Comment for documentation
COMMENT ON COLUMN public.messages.order_id IS 'Direct reference to the order associated with this message';
