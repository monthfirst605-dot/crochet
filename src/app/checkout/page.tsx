import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="font-display text-4xl">Where should it go?</h1>
        <CheckoutForm
          shippingPaise={Number(process.env.SHIPPING_FLAT_PAISE ?? 9900)}
          freeOverPaise={Number(process.env.FREE_SHIPPING_OVER_PAISE ?? 200000)}
        />
      </main>
      <SiteFooter />
    </>
  );
}
