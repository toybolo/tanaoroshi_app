"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createStocktake(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(`/stocktake?error=${encodeURIComponent("棚卸し名は必須です")}`);
  }

  const { data: stocktake, error } = await supabase
    .from("stocktakes")
    .insert({ user_id: user.id, name, status: "in_progress" })
    .select()
    .single();

  if (error || !stocktake) {
    redirect(
      `/stocktake?error=${encodeURIComponent(error?.message ?? "作成に失敗しました")}`,
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, stock_quantity")
    .eq("user_id", user.id);

  if (products && products.length > 0) {
    const items = products.map((p) => ({
      stocktake_id: stocktake.id,
      product_id: p.id,
      book_quantity: p.stock_quantity,
      counted: false,
    }));

    const { error: itemsError } = await supabase
      .from("stocktake_items")
      .insert(items);

    if (itemsError) {
      redirect(`/stocktake?error=${encodeURIComponent(itemsError.message)}`);
    }
  }

  revalidatePath("/stocktake");
  redirect(`/stocktake/${stocktake.id}`);
}

export async function updateStocktakeItemCount(
  itemId: string,
  actualQuantity: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("stocktake_items")
    .update({
      actual_quantity: Math.max(0, Math.trunc(actualQuantity)),
      counted: true,
    })
    .eq("id", itemId);
}

export async function completeStocktake(stocktakeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("stocktakes")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", stocktakeId)
    .eq("user_id", user.id);

  revalidatePath(`/stocktake/${stocktakeId}`);
  revalidatePath("/stocktake");
}
