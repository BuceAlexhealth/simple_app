import { z } from "zod";

export const InventoryItemSchema = z.object({
    name: z.string().min(1, "Product name is required").max(100, "Name too long"),
    brand_name: z.string().max(100, "Brand name too long").optional(),
    form: z.string().min(1, "Form is required"),
    price: z.number().positive("Price must be positive"),
    stock: z.number().int().min(0, "Stock cannot be negative"),
});

export const BatchSchema = z.object({
    batch_code: z.string().min(1, "Batch code is required").max(50, "Batch code too long"),
    manufacturing_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
        message: "Invalid manufacturing date"
    }),
    expiry_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
        message: "Invalid expiry date"
    }),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
}).refine((data) => new Date(data.expiry_date) > new Date(data.manufacturing_date), {
    message: "Expiry date must be after manufacturing date",
    path: ["expiry_date"]
});

export const BatchUpdateSchema = z.object({
    batch_code: z.string().min(1, "Batch code is required").max(50).optional(),
    manufacturing_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
        message: "Invalid manufacturing date"
    }).optional(),
    expiry_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
        message: "Invalid expiry date"
    }).optional(),
    quantity: z.number().int().min(1).optional(),
});

export type InventoryItemInput = z.infer<typeof InventoryItemSchema>;
export type BatchInput = z.infer<typeof BatchSchema>;
export type BatchUpdateInput = z.infer<typeof BatchUpdateSchema>;
