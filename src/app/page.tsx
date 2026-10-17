import React from "react";
import { getFeaturedProducts, getCategories } from "@/lib/data/catalog";
import HomeClientView from "@/components/home/HomeClientView";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <HomeClientView
      initialFeaturedProducts={featuredProducts}
      initialCategories={categories}
    />
  );
}
