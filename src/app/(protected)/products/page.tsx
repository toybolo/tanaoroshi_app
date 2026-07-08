import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "./actions";
import type { Product } from "@/lib/types/database";

const SORT_OPTIONS = {
  newest: "登録が新しい順",
  name: "商品名順",
  stock_asc: "在庫が少ない順",
  stock_desc: "在庫が多い順",
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

function isSortKey(value: string): value is SortKey {
  return value in SORT_OPTIONS;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    imported?: string;
    failedRows?: string;
  }>;
}) {
  const { q, category, sort, imported, failedRows } = await searchParams;
  const sortKey: SortKey = sort && isSortKey(sort) ? sort : "newest";

  const supabase = await createClient();

  let query = supabase.from("products").select("*");

  const keyword = q?.trim().replace(/[,()%]/g, "");
  if (keyword) {
    query = query.or(
      `name.ilike.%${keyword}%,management_code.ilike.%${keyword}%`,
    );
  }

  if (category) {
    query = query.eq("category", category);
  }

  switch (sortKey) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "stock_asc":
      query = query.order("stock_quantity", { ascending: true });
      break;
    case "stock_desc":
      query = query.order("stock_quantity", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const [{ data: products, error }, { data: categoryRows }] = await Promise.all([
    query,
    supabase.from("products").select("category"),
  ]);

  const categories = Array.from(
    new Set(
      (categoryRows ?? [])
        .map((row) => row.category?.trim())
        .filter((value): value is string => !!value),
    ),
  ).sort();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-900">商品一覧</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products/export"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            CSVエクスポート
          </Link>
          <Link
            href="/products/import"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            CSVインポート
          </Link>
          <Link
            href="/products/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + 新規登録
          </Link>
        </div>
      </div>

      {imported !== undefined && (
        <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          {imported}件の商品をインポートしました。
          {failedRows && (
            <>
              （{failedRows.split(",").length}
              行は形式が不正なためスキップしました: {failedRows}行目）
            </>
          )}
        </p>
      )}

      <form
        key={`${q ?? ""}|${category ?? ""}|${sortKey}`}
        method="GET"
        className="mb-4 flex flex-wrap items-end gap-3 rounded border border-gray-200 bg-white p-4"
      >
        <div className="min-w-[10rem] flex-1">
          <label htmlFor="q" className="block text-xs font-medium text-gray-500">
            検索（商品名・管理番号）
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-xs font-medium text-gray-500">
            カテゴリ
          </label>
          <select
            id="category"
            name="category"
            defaultValue={category ?? ""}
            className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">すべて</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="block text-xs font-medium text-gray-500">
            並び替え
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sortKey}
            className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          絞り込む
        </button>
        <Link href="/products" className="text-sm text-gray-500 hover:underline">
          条件をクリア
        </Link>
      </form>

      {error && (
        <p className="text-sm text-red-600">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      {!error && (products?.length ?? 0) === 0 && (
        <p className="text-sm text-gray-500">
          条件に一致する商品がありません。
        </p>
      )}

      {!!products?.length && (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2" />
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  商品名
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  管理番号
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  カテゴリ
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">
                  仕入価格
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">
                  販売価格
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">
                  在庫数
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(products as Product[]).map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-2">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-100" />
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {product.management_code ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {product.category ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    ¥{product.purchase_price.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    ¥{product.selling_price.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    {product.stock_quantity}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      編集
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteProduct(product.id);
                      }}
                      className="inline"
                    >
                      <button type="submit" className="text-red-600 hover:underline">
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
