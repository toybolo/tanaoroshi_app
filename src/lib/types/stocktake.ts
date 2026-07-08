export type Stocktake = {
  id: string;
  user_id: string;
  name: string;
  status: "in_progress" | "completed";
  started_at: string;
  completed_at: string | null;
};

export type StocktakeItemWithProduct = {
  id: string;
  book_quantity: number;
  actual_quantity: number | null;
  counted: boolean;
  difference: number;
  products: {
    id: string;
    name: string;
    management_code: string | null;
    category: string | null;
  };
};
