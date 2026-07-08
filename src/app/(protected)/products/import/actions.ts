"use server";

import Papa from "papaparse";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation/product";

type ImportRow = {
  name?: string;
  management_code?: string;
  category?: string;
  purchase_price?: string;
  selling_price?: string;
  stock_quantity?: string;
  location?: string;
  supplier?: string;
  memo?: string;
};

export async function importProducts(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/products/import?error=${encodeURIComponent("CSVファイルを選択してください")}`,
    );
  }

  const text = await file.text();
  const parsed = Papa.parse<ImportRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.data.length === 0) {
    redirect(
      `/products/import?error=${encodeURIComponent("読み込める行がありませんでした")}`,
    );
  }

  const rowsToInsert: Record<string, unknown>[] = [];
  const failedRows: number[] = [];

  parsed.data.forEach((row, index) => {
    const trim = (value: string | undefined) => (value ?? "").trim();
    const result = productSchema.safeParse({
      name: trim(row.name),
      management_code: trim(row.management_code) || null,
      category: trim(row.category) || null,
      purchase_price: Number(trim(row.purchase_price) || "0"),
      selling_price: Number(trim(row.selling_price) || "0"),
      stock_quantity: Number(trim(row.stock_quantity) || "0"),
      location: trim(row.location) || null,
      supplier: trim(row.supplier) || null,
      memo: trim(row.memo) || null,
    });

    if (result.success) {
      rowsToInsert.push({ ...result.data, user_id: user.id });
    } else {
      failedRows.push(index + 2); // ヘッダー行 + 1始まりの行番号
    }
  });

  let importedCount = 0;
  if (rowsToInsert.length > 0) {
    const { error, count } = await supabase
      .from("products")
      .insert(rowsToInsert, { count: "exact" });

    if (error) {
      redirect(`/products/import?error=${encodeURIComponent(error.message)}`);
    }
    importedCount = count ?? rowsToInsert.length;
  }

  const params = new URLSearchParams();
  params.set("imported", String(importedCount));
  if (failedRows.length > 0) {
    params.set("failedRows", failedRows.join(","));
  }

  redirect(`/products?${params.toString()}`);
}
