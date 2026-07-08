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

export async function syncNewProducts(stocktakeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 対象の棚卸しが本人のもので、かつ実施中であることを確認する
  const { data: stocktake } = await supabase
    .from("stocktakes")
    .select("id, status")
    .eq("id", stocktakeId)
    .eq("user_id", user.id)
    .single();

  if (!stocktake || stocktake.status !== "in_progress") {
    return;
  }

  // この棚卸しにまだ含まれていない商品を洗い出す
  const [{ data: products }, { data: existingItems }] = await Promise.all([
    supabase
      .from("products")
      .select("id, stock_quantity")
      .eq("user_id", user.id),
    supabase
      .from("stocktake_items")
      .select("product_id")
      .eq("stocktake_id", stocktakeId),
  ]);

  const existingProductIds = new Set(
    (existingItems ?? []).map((item) => item.product_id),
  );

  const newItems = (products ?? [])
    .filter((p) => !existingProductIds.has(p.id))
    .map((p) => ({
      stocktake_id: stocktakeId,
      product_id: p.id,
      book_quantity: p.stock_quantity,
      counted: false,
    }));

  if (newItems.length > 0) {
    await supabase.from("stocktake_items").insert(newItems);
  }

  revalidatePath(`/stocktake/${stocktakeId}`);
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
