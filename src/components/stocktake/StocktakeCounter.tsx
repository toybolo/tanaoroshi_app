"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { updateStocktakeItemCount } from "@/app/(protected)/stocktake/actions";
import { BarcodeScanner } from "./BarcodeScanner";

export type StocktakeCounterItem = {
  id: string;
  productId: string;
  name: string;
  managementCode: string | null;
  category: string | null;
  bookQuantity: number;
  actualQuantity: number | null;
  counted: boolean;
  difference: number;
};

type FilterKey = "all" | "uncounted" | "diff";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "すべて",
  uncounted: "未カウント",
  diff: "差異あり",
};

export function StocktakeCounter({
  items: initialItems,
  readOnly,
}: {
  stocktakeId: string;
  items: StocktakeCounterItem[];
  readOnly: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error";
    text: string;
    code?: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  function applyLocalUpdate(itemId: string, actualQuantity: number) {
    const safeValue = Math.max(0, Math.trunc(actualQuantity));
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              actualQuantity: safeValue,
              counted: true,
              difference: safeValue - item.bookQuantity,
            }
          : item,
      ),
    );
    startTransition(() => {
      updateStocktakeItemCount(itemId, safeValue);
    });
  }

  function increment(item: StocktakeCounterItem, delta: number) {
    const base = item.actualQuantity ?? item.bookQuantity;
    applyLocalUpdate(item.id, base + delta);
  }

  function handleDetected(code: string) {
    setScannerOpen(false);
    const match = items.find((item) => item.managementCode === code);
    if (match) {
      increment(match, 1);
      setScanMessage({ type: "success", text: `「${match.name}」を +1 しました` });
    } else {
      setScanMessage({
        type: "error",
        text: `管理番号「${code}」の商品が見つかりません。新規登録しますか？`,
        code,
      });
    }
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === "uncounted") return !item.counted;
      if (filter === "diff") return item.counted && item.difference !== 0;
      return true;
    });
  }, [items, filter]);

  const countedCount = items.filter((i) => i.counted).length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-gray-600">
          {countedCount} / {items.length} 件 カウント済み
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              setScanMessage(null);
              setScannerOpen(true);
            }}
            className="rounded bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
          >
            バーコードをスキャン
          </button>
        )}
      </div>

      {scanMessage && (
        <div
          className={`mb-3 rounded px-3 py-2 text-sm ${
            scanMessage.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {scanMessage.text}
          {scanMessage.type === "error" && scanMessage.code && (
            <>
              {" "}
              <Link
                href={`/products/new?management_code=${encodeURIComponent(scanMessage.code)}`}
                className="font-semibold underline"
              >
                商品を新規登録する
              </Link>
            </>
          )}
        </div>
      )}

      <div className="mb-3 flex gap-2">
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded px-3 py-1 text-xs font-medium ${
              filter === key ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <p className="text-sm text-gray-500">該当する商品がありません。</p>
      ) : (
        <ul className="space-y-2">
          {visibleItems.map((item) => (
            <li
              key={item.id}
              className={`rounded border p-3 ${
                item.counted && item.difference !== 0
                  ? "border-red-300 bg-red-50"
                  : item.counted
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.managementCode ?? "管理番号なし"}
                    {item.category ? ` ・ ${item.category}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  帳簿在庫: {item.bookQuantity}
                </div>
              </div>

              {!readOnly ? (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => increment(item, -1)}
                    className="h-9 w-9 rounded bg-gray-200 text-lg font-bold text-gray-700 hover:bg-gray-300"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={item.actualQuantity ?? ""}
                    placeholder={String(item.bookQuantity)}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!Number.isNaN(value)) applyLocalUpdate(item.id, value);
                    }}
                    className="h-9 w-20 rounded border border-gray-300 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => increment(item, 1)}
                    className="h-9 w-9 rounded bg-gray-200 text-lg font-bold text-gray-700 hover:bg-gray-300"
                  >
                    +
                  </button>
                  {item.counted && (
                    <span
                      className={`ml-2 text-sm font-semibold ${
                        item.difference === 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      差異: {item.difference > 0 ? `+${item.difference}` : item.difference}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-sm">
                  実地在庫: {item.counted ? item.actualQuantity : "未カウント"}
                  {item.counted && (
                    <span
                      className={`ml-3 font-semibold ${
                        item.difference === 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      差異: {item.difference > 0 ? `+${item.difference}` : item.difference}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
