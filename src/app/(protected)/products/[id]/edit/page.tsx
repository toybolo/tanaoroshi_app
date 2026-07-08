import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/products/ProductForm";
import { updateProduct } from "../../actions";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const boundUpdate = async (formData: FormData) => {
    "use server";
    await updateProduct(id, formData);
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">商品編集</h1>
      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <ProductForm
        action={boundUpdate}
        defaultValues={product}
        submitLabel="更新する"
      />
    </div>
  );
}
