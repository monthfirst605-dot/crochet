import Link from "next/link";
import { currentAdmin } from "@/lib/session";
import { logout } from "./actions";

export const metadata = { robots: { index: false, follow: false } };

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) return <>{children}</>;  // the login page renders bare

  return (
    <div className="min-h-dvh bg-shell">
      <header className="border-b border-sand bg-cocoa text-linen">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <Link href="/admin" className="font-display text-xl text-shell">
            Moon<span className="mx-1 inline-block h-1.5 w-1.5 rounded-full bg-sun align-middle" />Thread
            <span className="ml-2 align-middle text-xs font-sans text-linen/60">admin</span>
          </Link>

          <nav className="flex flex-wrap gap-5 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-linen/80 hover:text-sun">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/" className="text-linen/70 hover:text-sun">View shop</Link>
            <form action={logout}>
              <button className="rounded-full border border-linen/30 px-3 py-1 hover:border-sun hover:text-sun">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
