import { createClient } from "@/lib/supabase/server";
import { CategoryValuationChart } from "@/components/dashboard/CategoryValuationChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("category, purchase_price, selling_price, stock_quantity");

  const rows = products ?? [];

  const totalValuation = rows.reduce(
    (sum, p) => sum + p.purchase_price * p.stock_quantity,
    0,
  );
  const totalGrossProfit = rows.reduce(
    (sum, p) => sum + (p.selling_price - p.purchase_price) * p.stock_quantity,
    0,
  );
  const totalProductCount = rows.length;
  const totalStockQuantity = rows.reduce((sum, p) => sum + p.stock_quantity, 0);

  const valuationByCategory = new Map<string, number>();
  for (const p of rows) {
    const key = p.category?.trim() || "未分類";
    valuationByCategory.set(
      key,
      (valuationByCategory.get(key) ?? 0) + p.purchase_price * p.stock_quantity,
    );
  }
  const categoryData = Array.from(valuationByCategory.entries())
    .map(([category, valuation]) => ({ category, valuation }))
    .sort((a, b) => b.valuation - a.valuation);

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">ダッシュボード</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="総在庫評価額" value={`¥${totalValuation.toLocaleString()}`} />
        <SummaryCard label="総想定粗利" value={`¥${totalGrossProfit.toLocaleString()}`} />
        <SummaryCard label="総商品点数" value={`${totalProductCount.toLocaleString()} 点`} />
        <SummaryCard label="総在庫数" value={`${totalStockQuantity.toLocaleString()} 個`} />
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          カテゴリ別在庫評価額
        </h2>
        {categoryData.length === 0 ? (
          <p className="text-sm text-gray-500">商品がまだ登録されていません。</p>
        ) : (
          <CategoryValuationChart data={categoryData} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
