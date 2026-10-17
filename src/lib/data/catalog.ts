import { createPublicClient } from "@/lib/supabase/server";
import { Category, Product, ProductVariant } from "@/types";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/data/mock-data";

/**
 * Checks whether live Supabase credentials are configured in environment
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;
  if (url.includes("mock-hoian-eyewear.supabase.co") || anonKey === "placeholder-anon-key") {
    return false;
  }
  return true;
}

interface DbCategoryRow {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  image_url: string | null;
  display_order: number;
}

interface DbVariantRow {
  id: string;
  sku: string;
  color_name_vi: string;
  color_name_en: string;
  color_hex: string;
  size_label: string;
  lens_type_vi: string;
  lens_type_en: string;
  is_polarized: boolean;
  price_vnd: number;
  compare_at_price_vnd: number | null;
  image_url: string | null;
  is_active: boolean | null;
}

interface DbImageRow {
  image_url: string;
  display_order: number | null;
}

interface DbProductRow {
  id: string;
  slug: string;
  category_id: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  frame_material_vi: string | null;
  frame_material_en: string | null;
  lens_width_mm: number | null;
  bridge_width_mm: number | null;
  temple_length_mm: number | null;
  is_featured: boolean | null;
  tag_vi: string | null;
  tag_en: string | null;
  product_variants?: DbVariantRow[];
  product_images?: DbImageRow[];
}

/**
 * Maps raw database category row to frontend Category type
 */
function mapCategoryRow(row: DbCategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name_vi: row.name_vi,
    name_en: row.name_en,
    description_vi: row.description_vi || "",
    description_en: row.description_en || "",
    image: row.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
  };
}

/**
 * Maps raw database product with variants & images to frontend Product type
 */
function mapProductRow(row: DbProductRow): Product {
  const variants: ProductVariant[] = (row.product_variants || [])
    .filter((v: DbVariantRow) => v.is_active !== false)
    .map((v: DbVariantRow) => ({
      id: v.id,
      productId: row.id,
      sku: v.sku,
      colorName_vi: v.color_name_vi,
      colorName_en: v.color_name_en,
      colorHex: v.color_hex,
      sizeLabel: v.size_label,
      lensType_vi: v.lens_type_vi,
      lensType_en: v.lens_type_en,
      isPolarized: v.is_polarized,
      price: v.price_vnd,
      compareAtPrice: v.compare_at_price_vnd ?? undefined,
      imageUrl: v.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
      isActive: v.is_active ?? true,
    }));

  const images: string[] = (row.product_images || [])
    .sort((a: DbImageRow, b: DbImageRow) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((img: DbImageRow) => img.image_url);

  // If no separate images, collect from variants
  if (images.length === 0 && variants.length > 0) {
    images.push(...variants.map((v) => v.imageUrl));
  }

  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.category_id,
    name_vi: row.name_vi,
    name_en: row.name_en,
    description_vi: row.description_vi || "",
    description_en: row.description_en || "",
    frameMaterial_vi: row.frame_material_vi || "",
    frameMaterial_en: row.frame_material_en || "",
    dimensions: {
      lensWidth: row.lens_width_mm ?? 58,
      bridgeWidth: row.bridge_width_mm ?? 14,
      templeLength: row.temple_length_mm ?? 140,
    },
    featured: row.is_featured ?? false,
    tag_vi: row.tag_vi ?? undefined,
    tag_en: row.tag_en ?? undefined,
    images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80"],
    variants,
  };
}

/**
 * Fetch all active categories ordered by display_order
 */
export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Catalog Service] Supabase configuration required in production.");
    }
    return MOCK_CATEGORIES;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`[Catalog Service] Database error fetching categories: ${error.message}`);
      }
      console.warn("[Catalog Service] Using dev fallback categories:", error.message);
      return MOCK_CATEGORIES;
    }

    if (!data || data.length === 0) {
      return process.env.NODE_ENV === "production" ? [] : MOCK_CATEGORIES;
    }

    return (data as unknown as DbCategoryRow[]).map(mapCategoryRow);
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn("[Catalog Service] Connection error fetching categories, using dev fallback:", err);
    return MOCK_CATEGORIES;
  }
}

/**
 * Fetch products with optional filtering by category slug or featured status
 */
export async function getProducts(options?: {
  categorySlug?: string;
  featuredOnly?: boolean;
}): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Catalog Service] Supabase configuration required in production.");
    }
    let result = [...MOCK_PRODUCTS];
    if (options?.categorySlug && options.categorySlug !== "all") {
      const cat = MOCK_CATEGORIES.find((c) => c.slug === options.categorySlug);
      if (cat) {
        result = result.filter((p) => p.categoryId === cat.id);
      }
    }
    if (options?.featuredOnly) {
      result = result.filter((p) => p.featured);
    }
    return result;
  }

  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("products")
      .select(`
        *,
        categories!inner(slug),
        product_variants(*),
        product_images(*)
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (options?.featuredOnly) {
      query = query.eq("is_featured", true);
    }

    if (options?.categorySlug && options.categorySlug !== "all") {
      query = query.eq("categories.slug", options.categorySlug);
    }

    const { data, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`[Catalog Service] Database error fetching products: ${error.message}`);
      }
      console.warn("[Catalog Service] Using dev fallback products:", error.message);
      return MOCK_PRODUCTS;
    }

    if (!data || data.length === 0) {
      return process.env.NODE_ENV === "production" ? [] : MOCK_PRODUCTS;
    }

    return (data as unknown as DbProductRow[]).map(mapProductRow);
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn("[Catalog Service] Connection error fetching products, using dev fallback:", err);
    return MOCK_PRODUCTS;
  }
}

/**
 * Fetch a single product by its slug, including all variants and images
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Catalog Service] Supabase configuration required in production.");
    }
    const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
    return found || null;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants(*),
        product_images(*)
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      if (process.env.NODE_ENV === "production") {
        return null;
      }
      const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
      return found || null;
    }

    return mapProductRow(data as unknown as DbProductRow);
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn("[Catalog Service] Error fetching product by slug, using dev fallback:", err);
    const found = MOCK_PRODUCTS.find((p) => p.slug === slug);
    return found || null;
  }
}

/**
 * Fetch featured products for homepage showcase
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  return getProducts({ featuredOnly: true });
}

