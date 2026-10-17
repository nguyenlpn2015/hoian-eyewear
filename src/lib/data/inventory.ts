import { createPublicClient } from "@/lib/supabase/server";
import { InventoryBalance } from "@/types";
import { INITIAL_INVENTORY_BALANCES } from "@/data/mock-data";
import { isSupabaseConfigured } from "./catalog";

/**
 * Fetch all inventory balances, keyed by variantId
 */
export async function getInventoryBalances(
  locationId: string = "HOI_AN_MAIN"
): Promise<Record<string, InventoryBalance>> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Inventory Service] Supabase configuration required in production.");
    }
    return INITIAL_INVENTORY_BALANCES;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("inventory_balances")
      .select("*")
      .eq("location_id", locationId);

    if (error) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`[Inventory Service] Database error fetching balances: ${error.message}`);
      }
      console.warn("[Inventory Service] Using dev fallback balances:", error.message);
      return INITIAL_INVENTORY_BALANCES;
    }

    if (!data || data.length === 0) {
      return {};
    }

    const balances: Record<string, InventoryBalance> = {};
    for (const row of data) {
      balances[row.variant_id] = {
        variantId: row.variant_id,
        locationId: row.location_id,
        quantityOnHand: row.quantity_on_hand,
        quantityReserved: row.quantity_reserved,
        quantityAvailable: Math.max(0, row.quantity_on_hand - row.quantity_reserved),
        updatedAt: row.updated_at,
      };
    }

    return balances;
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn("[Inventory Service] Connection error fetching balances, using dev fallback:", err);
    return INITIAL_INVENTORY_BALANCES;
  }
}

/**
 * Get available stock for a specific variant
 */
export async function getVariantStock(
  variantId: string,
  locationId: string = "HOI_AN_MAIN"
): Promise<{ onHand: number; reserved: number; available: number }> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Inventory Service] Supabase configuration required in production.");
    }
    const balance = INITIAL_INVENTORY_BALANCES[variantId];
    if (!balance) return { onHand: 0, reserved: 0, available: 0 };
    return {
      onHand: balance.quantityOnHand,
      reserved: balance.quantityReserved,
      available: Math.max(0, balance.quantityOnHand - balance.quantityReserved),
    };
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("inventory_balances")
      .select("quantity_on_hand, quantity_reserved")
      .eq("variant_id", variantId)
      .eq("location_id", locationId)
      .single();

    if (error || !data) {
      if (process.env.NODE_ENV === "production") {
        return { onHand: 0, reserved: 0, available: 0 };
      }
      const fallback = INITIAL_INVENTORY_BALANCES[variantId];
      if (fallback) {
        return {
          onHand: fallback.quantityOnHand,
          reserved: fallback.quantityReserved,
          available: Math.max(0, fallback.quantityOnHand - fallback.quantityReserved),
        };
      }
      return { onHand: 0, reserved: 0, available: 0 };
    }

    const onHand = data.quantity_on_hand;
    const reserved = data.quantity_reserved;
    return {
      onHand,
      reserved,
      available: Math.max(0, onHand - reserved),
    };
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn("[Inventory Service] Error querying variant stock, using dev fallback:", err);
    const fallback = INITIAL_INVENTORY_BALANCES[variantId];
    if (fallback) {
      return {
        onHand: fallback.quantityOnHand,
        reserved: fallback.quantityReserved,
        available: Math.max(0, fallback.quantityOnHand - fallback.quantityReserved),
      };
    }
    return { onHand: 0, reserved: 0, available: 0 };
  }
}
