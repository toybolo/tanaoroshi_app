import { ProductForm } from "@/components/products/ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    management_code?: string;
    stocktake?: string;
  }>;
}) {
  const { error, management_code, stocktake } = await searchParams;

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">商品登録</h1>
      {stocktake && (
        <p className="mb-4 rounded bg-blue-50 px-3 py-2 text-sm text-blue-800">
          登録するとこの商品は実施中の棚卸しにも追加され、棚卸し画面に戻ります。
        </p>
      )}
      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <ProductForm
        action={createProduct}
        submitLabel="登録する"
        defaultValues={
          management_code ? { management_code } : undefined
        }
        hiddenFields={stocktake ? { stocktake_id: stocktake } : undefined}
      />
    </div>
  );
}
