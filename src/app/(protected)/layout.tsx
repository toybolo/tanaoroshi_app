import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex-1 bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex gap-4 text-sm font-medium text-gray-700">
            <Link href="/dashboard" className="hover:text-blue-600">
              ダッシュボード
            </Link>
            <Link href="/products" className="hover:text-blue-600">
              商品一覧
            </Link>
            <Link href="/stocktake" className="hover:text-blue-600">
              棚卸し
            </Link>
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-red-600"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
