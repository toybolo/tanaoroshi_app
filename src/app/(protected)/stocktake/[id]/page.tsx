import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StocktakeCounter } from "@/components/stocktake/StocktakeCounter";
import { completeStocktake, syncNewProducts } from "../actions";
import type { Stocktake, StocktakeItemWithProduct } from "@/lib/types/stocktake";

export default async function StocktakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: stocktake } = await supabase
    .from("stocktakes")
    .select("*")
    .eq("id", id)
    .single();

  if (!stocktake) notFound();

  const { data: items } = await supabase
    .from("stocktake_items")
    .select(
      "id, book_quantity, actual_quantity, counted, difference, products(id, name, management_code, category)",
    )
    .eq("stocktake_id", id)
    .order("id");

  const stocktakeRow = stocktake as Stocktake;

  // 棚卸し開始後に登録され、まだこの棚卸しに含まれていない商品の件数を数える
  let newProductCount = 0;
  if (stocktakeRow.status === "in_progress") {
    const { data: allProducts } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", stocktakeRow.user_id);
    const includedIds = new Set(
      (items ?? []).map(
        (item) =>
          (item as unknown as StocktakeItemWithProduct).products.id,
      ),
    );
    newProductCount = (allProducts ?? []).filter(
      (p) => !includedIds.has(p.id),
    ).length;
  }

  const boundComplete = async () => {
    "use server";
    await completeStocktake(id);
  };

  const boundSync = async () => {
    "use server";
    await syncNewProducts(id);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{stocktakeRow.name}</h1>
          <p className="text-xs text-gray-500">
            {stocktakeRow.status === "completed" ? "完了済み" : "実施中"} ・ 開始:{" "}
            {new Date(stocktakeRow.started_at).toLocaleString("ja-JP")}
            {stocktakeRow.completed_at
              ? ` ・ 完了: ${new Date(stocktakeRow.completed_at).toLocaleString("ja-JP")}`
              : ""}
          </p>
        </div>
        {stocktakeRow.status === "in_progress" && (
          <form action={boundComplete}>
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              棚卸しを完了する
            </button>
          </form>
        )}
      </div>

      {stocktakeRow.status === "in_progress" && newProductCount > 0 && (
        <form
          action={boundSync}
          className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded border border-blue-200 bg-blue-50 px-4 py-3"
        >
          <p className="text-sm text-blue-800">
            この棚卸しを開始した後に登録された商品が {newProductCount} 件あります。
          </p>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            新しく登録した商品を取り込む
          </button>
        </form>
      )}

      {(items?.length ?? 0) === 0 ? (
        <p className="text-sm text-gray-500">
          対象商品がありません（商品登録がない状態で開始された棚卸しです）。
        </p>
      ) : (
        <StocktakeCounter
          key={(items ?? []).map((item) => item.id).join(",")}
          stocktakeId={id}
          readOnly={stocktakeRow.status === "completed"}
          items={(items as unknown as StocktakeItemWithProduct[]).map((item) => ({
            id: item.id,
            productId: item.products.id,
            name: item.products.name,
            managementCode: item.products.management_code,
            category: item.products.category,
            bookQuantity: item.book_quantity,
            actualQuantity: item.actual_quantity,
            counted: item.counted,
            difference: item.difference,
          }))}
        />
      )}
    </div>
  );
}
