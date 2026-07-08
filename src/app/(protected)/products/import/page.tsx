import Link from "next/link";
import { importProducts } from "./actions";

export default async function ImportProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">CSVインポート</h1>

      <div className="mb-4 rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
        <p className="mb-2">
          1行目をヘッダー行として、以下の列名でCSVを作成してください（
          <code className="rounded bg-gray-100 px-1">name</code>
          以外は空欄でも登録できます）。
        </p>
        <code className="block overflow-x-auto rounded bg-gray-100 p-2 text-xs">
          name, management_code, category, purchase_price, selling_price,
          stock_quantity, location, supplier, memo
        </code>
        <p className="mt-2">
          <Link href="/products/export" className="text-blue-600 hover:underline">
            現在の商品一覧をCSVでダウンロード
          </Link>
          すると、同じ列構成のサンプルとして使えます。
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form
        action={importProducts}
        className="max-w-xl space-y-4 rounded border border-gray-200 bg-white p-6"
      >
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            CSVファイル
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-1 w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          インポートする
        </button>
      </form>
    </div>
  );
}
