export type Product = {
  id: string;
  user_id: string;
  name: string;
  management_code: string | null;
  category: string | null;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  location: string | null;
  supplier: string | null;
  image_url: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};
