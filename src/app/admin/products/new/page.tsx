import Link from "next/link";
import { adminListCategories } from "@/lib/queries";
import { ProductForm } from "@/components/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await adminListCategories();
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-bark hover:text-cocoa">← Products</Link>
      <h1 className="mt-2 font-display text-3xl">Add a product</h1>
      <div className="mt-8">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
