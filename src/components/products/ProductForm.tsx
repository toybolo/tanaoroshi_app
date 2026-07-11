type ProductFormValues = {
  name?: string;
  management_code?: string | null;
  category?: string | null;
  purchase_price?: number;
  selling_price?: number;
  stock_quantity?: number;
  location?: string | null;
  supplier?: string | null;
  memo?: string | null;
  image_url?: string | null;
};

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: ProductFormValues;
  submitLabel: string;
  hiddenFields?: Record<string, string>;
};

export function ProductForm({
  action,
  defaultValues,
  submitLabel,
  hiddenFields,
}: ProductFormProps) {
  return (
    <form
      action={action}
      className="max-w-xl space-y-4 rounded border border-gray-200 bg-white p-6"
    >
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700">
          商品画像
        </label>
        {defaultValues?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={defaultValues.image_url}
            alt=""
            className="mt-2 h-24 w-24 rounded border border-gray-200 object-cover"
          />
        )}
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="mt-1 w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
        />
      </div>
      <Field label="商品名" name="name" required defaultValue={defaultValues?.name} />
      <Field
        label="管理番号（SKU・JANコード）"
        name="management_code"
        defaultValue={defaultValues?.management_code ?? ""}
      />
      <Field
        label="カテゴリ"
        name="category"
        defaultValue={defaultValues?.category ?? ""}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="仕入価格（円）"
          name="purchase_price"
          type="number"
          min={0}
          defaultValue={defaultValues?.purchase_price ?? 0}
        />
        <Field
          label="販売価格（円）"
          name="selling_price"
          type="number"
          min={0}
          defaultValue={defaultValues?.selling_price ?? 0}
        />
      </div>
      <Field
        label="在庫数"
        name="stock_quantity"
        type="number"
        min={0}
        defaultValue={defaultValues?.stock_quantity ?? 0}
      />
      <Field
        label="保管場所（棚番）"
        name="location"
        defaultValue={defaultValues?.location ?? ""}
      />
      <Field
        label="仕入先"
        name="supplier"
        defaultValue={defaultValues?.supplier ?? ""}
      />
      <div>
        <label htmlFor="memo" className="block text-sm font-medium text-gray-700">
          メモ
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={defaultValues?.memo ?? ""}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto sm:px-6"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  min?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        min={min}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}
