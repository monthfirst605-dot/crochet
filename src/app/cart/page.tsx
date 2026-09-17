import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartView } from "@/components/cart-view";

export const metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="font-display text-4xl">Your cart</h1>
        <CartView />
      </main>
      <SiteFooter />
    </>
  );
}
