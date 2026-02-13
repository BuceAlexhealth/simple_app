-- 1. DATA MIGRATION: Create batches for existing stock
-- This ensures that when we enable the trigger, the stock isn't wiped out.
-- We create a "LEGACY" batch for any item that has stock but no batches.
INSERT INTO public.batches (
    inventory_id,
    pharmacy_id,
    batch_code,
    manufacturing_date,
    expiry_date,
    quantity,
    remaining_qty
)
SELECT
    id as inventory_id,
    pharmacy_id,
    'LEGACY-' || substring(id::text, 1, 8), -- Create a unique batch code
    CURRENT_DATE, -- Set manufacturing date to today
    (CURRENT_DATE + INTERVAL '1 year')::DATE, -- Set default expiry to 1 year from now
    stock,
    stock
FROM public.inventory
WHERE stock > 0
AND NOT EXISTS (
    SELECT 1 FROM public.batches WHERE inventory_id = public.inventory.id
);


-- 2. Trigger to sync inventory.stock with batches
CREATE OR REPLACE FUNCTION public.sync_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.inventory
        SET stock = (
            SELECT COALESCE(SUM(remaining_qty), 0)
            FROM public.batches
            WHERE inventory_id = OLD.inventory_id
        )
        WHERE id = OLD.inventory_id;
        RETURN OLD;
    ELSE
        UPDATE public.inventory
        SET stock = (
            SELECT COALESCE(SUM(remaining_qty), 0)
            FROM public.batches
            WHERE inventory_id = NEW.inventory_id
        )
        WHERE id = NEW.inventory_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_batch_change ON public.batches;
CREATE TRIGGER on_batch_change
AFTER INSERT OR UPDATE OR DELETE ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_stock();


-- 3. RPC to process pharmacy order atomically with FEFO
CREATE OR REPLACE FUNCTION public.process_pharmacy_order(
    p_pharmacy_id UUID,
    p_patient_id UUID,
    p_items JSONB, -- Array of {inventory_id, quantity, price}
    p_total_price NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_inventory_id UUID;
    v_qty_needed INTEGER;
    v_price NUMERIC;
    v_batch RECORD;
    v_qty_to_take INTEGER;
    v_current_stock INTEGER;
BEGIN
    -- Create Order
    INSERT INTO public.orders (
        pharmacy_id,
        patient_id,
        total_price,
        status,
        initiator_type,
        pharmacy_notes
    ) VALUES (
        p_pharmacy_id,
        p_patient_id,
        p_total_price,
        'placed',
        'pharmacy',
        p_notes
    ) RETURNING id INTO v_order_id;

    -- Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_inventory_id := (v_item->>'inventory_id')::UUID;
        v_qty_needed := (v_item->>'quantity')::INTEGER;
        v_price := (v_item->>'price')::NUMERIC;

        -- Check total stock first
        SELECT stock INTO v_current_stock FROM public.inventory WHERE id = v_inventory_id;
        
        IF v_current_stock IS NULL OR v_current_stock < v_qty_needed THEN
             RAISE EXCEPTION 'Insufficient stock for inventory item %', v_inventory_id;
        END IF;

        -- Iterate batches (FEFO)
        FOR v_batch IN 
            SELECT * FROM public.batches 
            WHERE inventory_id = v_inventory_id AND remaining_qty > 0
            ORDER BY expiry_date ASC
        LOOP
            IF v_qty_needed <= 0 THEN
                EXIT;
            END IF;

            v_qty_to_take := LEAST(v_batch.remaining_qty, v_qty_needed);

            -- Deduct from batch
            UPDATE public.batches
            SET remaining_qty = remaining_qty - v_qty_to_take
            WHERE id = v_batch.id;

            -- Create Order Item (linking to specific batch)
            INSERT INTO public.order_items (
                order_id,
                inventory_id,
                batch_id,
                quantity,
                price_at_time
            ) VALUES (
                v_order_id,
                v_inventory_id,
                v_batch.id,
                v_qty_to_take,
                v_price
            );

            -- Log Movement
            INSERT INTO public.batch_movements (
                batch_id,
                movement_type,
                quantity,
                reference_id, -- order_id
                notes,
                created_by
            ) VALUES (
                v_batch.id,
                'OUT',
                v_qty_to_take,
                v_order_id,
                'Order Fulfillment',
                p_pharmacy_id
            );

            v_qty_needed := v_qty_needed - v_qty_to_take;
        END LOOP;

        IF v_qty_needed > 0 THEN
            RAISE EXCEPTION 'Stock mismatch: Database indicated sufficient stock but batches could not fulfill request for item %', v_inventory_id;
        END IF;

    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
