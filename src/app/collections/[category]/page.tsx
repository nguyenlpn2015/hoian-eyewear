import React from "react";
import { getProducts, getCategories } from "@/lib/data/catalog";
import CategoryClientView from "@/components/collections/CategoryClientView";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const [products, categories] = await Promise.all([
    getProducts({ categorySlug }),
    getCategories(),
  ]);

  const currentCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <CategoryClientView
      category={currentCategory}
      products={products}
    />
  );
}
