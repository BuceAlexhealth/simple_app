import { z } from "zod";

export const InventoryItemSchema = z.object({
    name: z.string().min(1, "Product name is required").max(100, "Name too long"),
    brand_name: z.string().max(100, "Brand name too long").optional(),
    form: z.string().min(1, "Form is required"),
    price: z.number().positive("Price must be positive"),
    stock: z.number().int().min(0, "Stock cannot be negative"),
});

export type InventoryItemInput = z.infer<typeof InventoryItemSchema>;
