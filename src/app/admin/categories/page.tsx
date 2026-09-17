import { adminListCategories } from "@/lib/queries";
import { CategoryForm } from "@/components/category-form";
import { deleteCategory } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const categories = await adminListCategories();

  return (
    <div>
      <h1 className="font-display text-3xl">Categories</h1>
      <p className="mt-2 max-w-[60ch] text-bark">
        Categories group products in the shop. Deleting one leaves its products in
        place — they just stop being grouped.
      </p>

      <section className="mt-8 rounded-2xl border border-sand bg-white p-6">
        <h2 className="font-display text-xl">Add a category</h2>
        <div className="mt-5">
          <CategoryForm />
        </div>
      </section>

      <ul className="mt-8 space-y-4">
        {categories.map((category) => (
          <li key={category.id} className="rounded-2xl border border-sand bg-white">
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center gap-4 p-5">
                <span className="font-display text-lg">{category.name}</span>
                <span className="text-sm text-taupe">/{category.slug}</span>
                <span className="text-sm text-bark">{category.product_count} products</span>
                {!category.is_active && (
                  <span className="rounded-full bg-linen px-3 py-0.5 text-xs">Hidden</span>
                )}
                <span className="ml-auto text-sm text-bark">Edit</span>
              </summary>

              <div className="border-t border-sand p-5">
                <CategoryForm category={category} />
                <form action={deleteCategory} className="mt-6 border-t border-sand pt-4">
                  <input type="hidden" name="id" value={category.id} />
                  <button className="text-sm text-bark underline underline-offset-4 hover:text-cocoa">
                    Delete this category
                  </button>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
