"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation/product";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function parseProductFields(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  return productSchema.safeParse({
    name: get("name"),
    management_code: get("management_code") || null,
    category: get("category") || null,
    purchase_price: Number(get("purchase_price") || "0"),
    selling_price: Number(get("selling_price") || "0"),
    stock_quantity: Number(get("stock_quantity") || "0"),
    location: get("location") || null,
    supplier: get("supplier") || null,
    memo: get("memo") || null,
  });
}

async function uploadProductImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
): Promise<{ imageUrl?: string; error?: string }> {
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return {};
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { error: "画像サイズは5MB以下にしてください" };
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: `画像のアップロードに失敗しました: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  return { imageUrl: publicUrl };
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stocktakeId = String(formData.get("stocktake_id") ?? "").trim();
  const newPageWithError = (message: string) => {
    const params = new URLSearchParams();
    if (stocktakeId) params.set("stocktake", stocktakeId);
    params.set("error", message);
    return `/products/new?${params.toString()}`;
  };

  const parsed = parseProductFields(formData);

  if (!parsed.success) {
    redirect(newPageWithError(parsed.error.issues[0].message));
  }

  const { imageUrl, error: imageError } = await uploadProductImage(
    supabase,
    user.id,
    formData,
  );

  if (imageError) {
    redirect(newPageWithError(imageError));
  }

  const { data: created, error } = await supabase
    .from("products")
    .insert({ ...parsed.data, image_url: imageUrl ?? null, user_id: user.id })
    .select("id")
    .single();

  if (error || !created) {
    redirect(newPageWithError(error?.message ?? "登録に失敗しました"));
  }

  // 棚卸し画面から登録された場合は、その実施中の棚卸しにも追加する
  if (stocktakeId) {
    const { data: stocktake } = await supabase
      .from("stocktakes")
      .select("id, status")
      .eq("id", stocktakeId)
      .eq("user_id", user.id)
      .single();

    if (stocktake && stocktake.status === "in_progress") {
      await supabase.from("stocktake_items").insert({
        stocktake_id: stocktakeId,
        product_id: created.id,
        book_quantity: parsed.data.stock_quantity,
        counted: false,
      });
      revalidatePath("/products");
      revalidatePath(`/stocktake/${stocktakeId}`);
      redirect(`/stocktake/${stocktakeId}`);
    }
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = parseProductFields(formData);

  if (!parsed.success) {
    redirect(
      `/products/${productId}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const { imageUrl, error: imageError } = await uploadProductImage(
    supabase,
    user.id,
    formData,
  );

  if (imageError) {
    redirect(`/products/${productId}/edit?error=${encodeURIComponent(imageError)}`);
  }

  const { error } = await supabase
    .from("products")
    .update({ ...parsed.data, ...(imageUrl ? { image_url: imageUrl } : {}) })
    .eq("id", productId)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/products/${productId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("user_id", user.id);

  revalidatePath("/products");
}
