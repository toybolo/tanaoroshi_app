import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "商品名は必須です"),
  management_code: z.string().nullable(),
  category: z.string().nullable(),
  purchase_price: z.number().int("整数で入力してください").min(0),
  selling_price: z.number().int("整数で入力してください").min(0),
  stock_quantity: z.number().int("整数で入力してください").min(0),
  location: z.string().nullable(),
  supplier: z.string().nullable(),
  memo: z.string().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
