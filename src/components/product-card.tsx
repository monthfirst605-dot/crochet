import Image from "next/image";
import Link from "next/link";
import { price } from "@/lib/format";
import type { ProductCard as Card } from "@/lib/types";

export function ProductCard({ product, priority = false }: { product: Card; priority?: boolean }) {
  const soldOut = !product.is_made_to_order && product.stock <= 0;

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-pebble bg-linen">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.image_alt ?? product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-taupe">No photo yet</div>
        )}

        {product.is_made_to_order && (
          <span className="absolute left-3 top-3 rounded-full bg-sun px-3 py-1 text-xs font-bold text-cocoa">
            Made to order
          </span>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-cocoa px-3 py-1 text-xs font-bold text-shell">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg leading-snug">{product.name}</h3>
        <p className="shrink-0 text-sm font-semibold">
          {price(product.price_paise)}
          {product.compare_at_paise && (
            <span className="ml-2 font-normal text-taupe line-through">
              {price(product.compare_at_paise)}
            </span>
          )}
        </p>
      </div>
      {product.summary && (
        <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-bark/80">{product.summary}</p>
      )}
    </Link>
  );
}
