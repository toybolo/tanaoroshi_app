import { ProductForm } from "@/components/products/ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; management_code?: string }>;
}) {
  const { error, management_code } = await searchParams;

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">商品登録</h1>
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
      />
    </div>
  );
}
