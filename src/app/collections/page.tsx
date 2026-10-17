import React from "react";
import { getProducts, getCategories } from "@/lib/data/catalog";
import CollectionsClientView from "@/components/collections/CollectionsClientView";

export default async function CollectionsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <CollectionsClientView
      initialProducts={products}
      categories={categories}
    />
  );
}
