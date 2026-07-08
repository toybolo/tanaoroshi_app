export function Loading({ label = "読み込み中…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
