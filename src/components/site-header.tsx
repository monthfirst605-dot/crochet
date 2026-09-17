"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-store";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?sort=new", label: "New" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const { count, ready } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-sand/70 bg-shell/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
        <Link href="/" className="font-display text-2xl leading-none tracking-tight">
          Moon
          <span className="mx-1 inline-block h-2 w-2 rounded-full bg-sun align-middle" />
          Thread
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm sm:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                pathname === item.href.split("?")[0]
                  ? "link-sun text-cocoa"
                  : "text-bark hover:text-cocoa"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/cart"
          className="ml-auto flex items-center gap-2 rounded-full border border-bark px-4 py-1.5 text-sm text-cocoa hover:bg-bark hover:text-shell sm:ml-0"
        >
          Cart
          <span
            aria-hidden={!ready}
            className="grid h-5 min-w-5 place-items-center rounded-full bg-sun px-1 text-xs font-bold text-cocoa"
          >
            {ready ? count : 0}
          </span>
          <span className="sr-only">{ready ? `${count} items in cart` : "cart"}</span>
        </Link>
      </div>
    </header>
  );
}
