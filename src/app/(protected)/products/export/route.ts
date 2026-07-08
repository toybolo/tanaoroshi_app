import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";

const CSV_COLUMNS = [
  "name",
  "management_code",
  "category",
  "purchase_price",
  "selling_price",
  "stock_quantity",
  "location",
  "supplier",
  "memo",
] as const;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (products ?? []).map((product: Record<string, unknown>) =>
    Object.fromEntries(
      CSV_COLUMNS.map((column) => [column, product[column] ?? ""]),
    ),
  );

  const csv = Papa.unparse({ fields: [...CSV_COLUMNS], data: rows });
  const bom = "﻿"; // Excelで開いた際の文字化けを防ぐ

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
