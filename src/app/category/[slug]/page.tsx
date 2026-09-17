import { notFound, redirect } from "next/navigation";
import { getCategories } from "@/lib/queries";

/** Pretty category URLs resolve into the shop's filtered view. */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  const match = categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  if (!match) notFound();
  redirect(`/shop?category=${match.slug}`);
}
