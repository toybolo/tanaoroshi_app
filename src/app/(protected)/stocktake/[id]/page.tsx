import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StocktakeCounter } from "@/components/stocktake/StocktakeCounter";
import { completeStocktake } from "../actions";
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

  const boundComplete = async () => {
    "use server";
    await completeStocktake(id);
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

      {(items?.length ?? 0) === 0 ? (
        <p className="text-sm text-gray-500">
          対象商品がありません（商品登録がない状態で開始された棚卸しです）。
        </p>
      ) : (
        <StocktakeCounter
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
