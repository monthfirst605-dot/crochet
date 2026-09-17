"use client";

import { useActionState } from "react";
import { saveCategory, type FormState } from "@/app/admin/actions";
import type { Category } from "@/lib/types";

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategory, {});

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div>
        <label className="label">Name</label>
        <input name="name" required className="field" defaultValue={category?.name ?? ""} />
      </div>
      <div>
        <label className="label">Web address</label>
        <input name="slug" className="field" defaultValue={category?.slug ?? ""}
               placeholder="left blank, made from the name" />
      </div>

      <div className="sm:col-span-2">
        <label className="label">Description</label>
        <input name="description" className="field" defaultValue={category?.description ?? ""} />
      </div>

      <div>
        <label className="label">Cover photo</label>
        <input name="image" type="file" accept="image/*"
               className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-cocoa file:px-3 file:py-1.5 file:text-shell" />
        <input type="hidden" name="image_url" value={category?.image_url ?? ""} />
      </div>
      <div>
        <label className="label">Sort order</label>
        <input name="position" type="number" className="field" defaultValue={category?.position ?? 0} />
      </div>

      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} />
        Show in the shop
      </label>

      {state.error && (
        <p role="alert" className="rounded-lg bg-cocoa px-4 py-2 text-sm text-shell sm:col-span-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-sun px-4 py-2 text-sm font-medium text-cocoa sm:col-span-2">
          {state.ok}
        </p>
      )}

      <div className="sm:col-span-2">
        <button disabled={pending}
                className="rounded-full bg-sun px-6 py-2.5 font-semibold text-cocoa shadow-[0_2px_0_var(--color-sun-deep)] disabled:opacity-60">
          {pending ? "Saving…" : category ? "Save category" : "Add category"}
        </button>
      </div>
    </form>
  );
}
