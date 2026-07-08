import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createStocktake } from "./actions";
import type { Stocktake } from "@/lib/types/stocktake";

export default async function StocktakePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: stocktakes } = await supabase
    .from("stocktakes")
    .select("*")
    .order("started_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">棚卸し</h1>

      <form
        action={createStocktake}
        className="mb-6 flex flex-wrap items-end gap-3 rounded border border-gray-200 bg-white p-4"
      >
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="name" className="block text-xs font-medium text-gray-500">
            棚卸し名
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="例: 2026年8月 棚卸し"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          新規棚卸しを開始
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {(stocktakes?.length ?? 0) === 0 ? (
        <p className="text-sm text-gray-500">
          棚卸しセッションがまだありません。
        </p>
      ) : (
        <ul className="space-y-2">
          {(stocktakes as Stocktake[]).map((st) => (
            <li key={st.id}>
              <Link
                href={`/stocktake/${st.id}`}
                className="flex items-center justify-between rounded border border-gray-200 bg-white p-4 hover:border-blue-300"
              >
                <div>
                  <p className="font-medium text-gray-900">{st.name}</p>
                  <p className="text-xs text-gray-500">
                    開始: {new Date(st.started_at).toLocaleString("ja-JP")}
                    {st.completed_at
                      ? ` ・ 完了: ${new Date(st.completed_at).toLocaleString("ja-JP")}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold ${
                    st.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {st.status === "completed" ? "完了" : "実施中"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
