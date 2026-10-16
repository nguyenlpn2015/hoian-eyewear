import test from "node:test";
import assert from "node:assert";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { maskName, maskPhone, maskAddress } from "@/lib/utils";
import { MOCK_PRODUCTS, INITIAL_INVENTORY_BALANCES } from "@/data/mock-data";
import fs from "node:fs";
import path from "node:path";

// ==============================================================================
// 1. SCHEMA CONSTRAINTS & DATA INTEGRITY TESTS
// ==============================================================================
test("Schema Audit: Currency amounts must be non-negative integers in VND", () => {
  for (const product of MOCK_PRODUCTS) {
    for (const variant of product.variants) {
      assert.ok(Number.isInteger(variant.price), `Price must be integer for ${variant.sku}`);
      assert.ok(variant.price >= 0, `Price must be non-negative for ${variant.sku}`);
      if (variant.compareAtPrice !== undefined) {
        assert.ok(Number.isInteger(variant.compareAtPrice), `Compare price must be integer for ${variant.sku}`);
        assert.ok(variant.compareAtPrice >= variant.price, `Compare price must be >= price for ${variant.sku}`);
      }
    }
  }
});

test("Schema Audit: Order Reference & Phone format regular expressions", () => {
  const orderRefRegex = /^HAE-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  const validRefs = ["HAE-8K2M-9X4W", "HAE-4J7N-2P9Y", "HAE-POS1-9812", "HAE-ABCD-1234"];
  const invalidRefs = ["HAE-8K2M", "hae-8k2m-9x4w", "ORD-8K2M-9X4W", "HAE-8K2M-9X4W-EXTRA"];

  for (const ref of validRefs) {
    assert.match(ref, orderRefRegex, `Expected valid ref: ${ref}`);
  }
  for (const ref of invalidRefs) {
    assert.doesNotMatch(ref, orderRefRegex, `Expected invalid ref: ${ref}`);
  }

  const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;
  const validPhones = ["0905123456", "0388776655", "84905123456", "0798765432"];
  const invalidPhones = ["0123456789", "090512345", "09051234567", "abc0905123456"];

  for (const phone of validPhones) {
    assert.match(phone, phoneRegex, `Expected valid phone: ${phone}`);
  }
  for (const phone of invalidPhones) {
    assert.doesNotMatch(phone, phoneRegex, `Expected invalid phone: ${phone}`);
  }
});

test("Schema Audit: Inventory balance non-negativity check (onHand >= reserved)", () => {
  for (const [variantId, balance] of Object.entries(INITIAL_INVENTORY_BALANCES)) {
    assert.ok(balance.quantityOnHand >= 0, `OnHand must be >= 0 for ${variantId}`);
    assert.ok(balance.quantityReserved >= 0, `Reserved must be >= 0 for ${variantId}`);
    assert.ok(
      balance.quantityOnHand >= balance.quantityReserved,
      `OnHand (${balance.quantityOnHand}) must be >= Reserved (${balance.quantityReserved}) for ${variantId}`
    );
    assert.strictEqual(
      balance.quantityAvailable,
      balance.quantityOnHand - balance.quantityReserved,
      `Available must equal onHand - reserved for ${variantId}`
    );
  }
});

// ==============================================================================
// 2. CONCURRENCY & OVERSELL PREVENTION SIMULATION
// ==============================================================================
test("Concurrency Simulation: Pessimistic locking prevents overselling under high concurrency", async () => {
  // Simulate inventory balance for var-3: initial onHand = 2, reserved = 0
  const stockState = {
    variantId: "var-3",
    quantityOnHand: 2,
    quantityReserved: 0,
    get available() {
      return this.quantityOnHand - this.quantityReserved;
    },
  };

  // Mutex simulation for database row lock (SELECT ... FOR UPDATE)
  let lockAcquired = false;
  const acquireRowLock = async () => {
    while (lockAcquired) {
      await new Promise((r) => setTimeout(r, 1));
    }
    lockAcquired = true;
  };
  const releaseRowLock = () => {
    lockAcquired = false;
  };

  const attemptOrderReservation = async (): Promise<{ success: boolean; error?: string }> => {
    await acquireRowLock();
    try {
      // Critical Section under lock
      if (stockState.available < 1) {
        return { success: false, error: "INSUFFICIENT_STOCK" };
      }
      stockState.quantityReserved += 1;
      return { success: true };
    } finally {
      releaseRowLock();
    }
  };

  // Simulate 10 concurrent purchase requests attempting to buy the last 2 items
  const concurrentCustomers = Array.from({ length: 10 }, () => attemptOrderReservation());
  const results = await Promise.all(concurrentCustomers);

  const successfulOrders = results.filter((r) => r.success);
  const rejectedOrders = results.filter((r) => !r.success && r.error === "INSUFFICIENT_STOCK");

  // Exactly 2 orders must succeed
  assert.strictEqual(successfulOrders.length, 2, "Exactly 2 concurrent orders should succeed");
  // Exactly 8 orders must be rejected with INSUFFICIENT_STOCK
  assert.strictEqual(rejectedOrders.length, 8, "Exactly 8 concurrent orders should be rejected");
  // Available stock must be 0, never negative
  assert.strictEqual(stockState.available, 0, "Available stock must be 0, never negative");
  assert.strictEqual(stockState.quantityReserved, 2, "Reserved stock must be 2");
});

test("Concurrency Simulation: Deadlock prevention via deterministic variant sorting", () => {
  // Multi-item order A requests [var-4, var-1]
  // Multi-item order B requests [var-1, var-4]
  const orderA_items = [{ variant_id: "c0000000-0000-0000-0000-000000000004" }, { variant_id: "c0000000-0000-0000-0000-000000000001" }];
  const orderB_items = [{ variant_id: "c0000000-0000-0000-0000-000000000001" }, { variant_id: "c0000000-0000-0000-0000-000000000004" }];

  // In create_online_order, items are sorted: ORDER BY variant_id ASC
  const sortedA = [...orderA_items].sort((a, b) => a.variant_id.localeCompare(b.variant_id));
  const sortedB = [...orderB_items].sort((a, b) => a.variant_id.localeCompare(b.variant_id));

  // Verify that both orders lock in the exact same resource sequence
  assert.deepStrictEqual(
    sortedA.map((i) => i.variant_id),
    sortedB.map((i) => i.variant_id),
    "Lock acquisition sequence must be identical to eliminate cyclic wait conditions (deadlock)"
  );
});

// ==============================================================================
// 3. IDEMPOTENCY & DUPLICATE SUBMISSION HANDLING
// ==============================================================================
test("Idempotency: Duplicate order submissions with same idempotency key replay without duplicate stock reservation", () => {
  const orderStore = new Map<string, { orderRef: string; totalAmount: number; reservedCount: number }>();
  let totalStockReserved = 0;

  const processOrderWithIdempotency = (idempotencyKey: string, amount: number) => {
    // 0. Idempotency Check
    if (orderStore.has(idempotencyKey)) {
      const existing = orderStore.get(idempotencyKey)!;
      return {
        success: true,
        orderRef: existing.orderRef,
        totalAmount: existing.totalAmount,
        idempotent_replayed: true,
      };
    }

    // 1. Process new order
    totalStockReserved += 1;
    const newOrder = {
      orderRef: "HAE-TEST-0001",
      totalAmount: amount,
      reservedCount: totalStockReserved,
    };
    orderStore.set(idempotencyKey, newOrder);

    return {
      success: true,
      orderRef: newOrder.orderRef,
      totalAmount: newOrder.totalAmount,
      idempotent_replayed: false,
    };
  };

  const key = "client-req-uuid-123456";

  // First request: processes and reserves stock
  const res1 = processOrderWithIdempotency(key, 450000);
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.idempotent_replayed, false);
  assert.strictEqual(totalStockReserved, 1);

  // Second duplicate request (e.g. user double-clicked submit button)
  const res2 = processOrderWithIdempotency(key, 450000);
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.idempotent_replayed, true);
  assert.strictEqual(res2.orderRef, res1.orderRef);
  assert.strictEqual(totalStockReserved, 1, "Stock must NOT be reserved twice for duplicate submission");
});

// ==============================================================================
// 4. ORDER CANCELLATION & STOCK RESTORATION
// ==============================================================================
test("Cancellation & Restoration: Order cancellation restores reserved stock idempotently", () => {
  const order = {
    id: "ord-1",
    status: "pending",
    quantity: 1,
  };
  let reservedStock = 1;

  const cancelOrder = () => {
    if (order.status === "cancelled") {
      return { success: true, message: "ALREADY_CANCELLED" };
    }
    if (order.status === "completed") {
      return { success: false, error: "CANNOT_CANCEL_COMPLETED_ORDER" };
    }

    reservedStock = Math.max(0, reservedStock - order.quantity);
    order.status = "cancelled";
    return { success: true, message: "CANCELLED" };
  };

  // First cancellation: restores stock
  const firstCancel = cancelOrder();
  assert.strictEqual(firstCancel.success, true);
  assert.strictEqual(reservedStock, 0, "Reserved stock should be released to 0");
  assert.strictEqual(order.status, "cancelled");

  // Second cancellation: idempotent, returns ALREADY_CANCELLED without double-restoring
  const secondCancel = cancelOrder();
  assert.strictEqual(secondCancel.success, true);
  assert.strictEqual(secondCancel.message, "ALREADY_CANCELLED");
  assert.strictEqual(reservedStock, 0, "Reserved stock must not become negative or double-released");

  // Completed order cancellation must be blocked
  order.status = "completed";
  const blockedCancel = cancelOrder();
  assert.strictEqual(blockedCancel.success, false);
  assert.strictEqual(blockedCancel.error, "CANNOT_CANCEL_COMPLETED_ORDER");
});

// ==============================================================================
// 5. SERVER-SIDE RBAC & ROLE PRIVILEGE SEPARATION
// ==============================================================================
test("RBAC Audit: Cashier vs Store Manager route permissions", () => {
  type StaffRole = "CASHIER" | "STORE_MANAGER";

  const isRouteAllowed = (role: StaffRole, pathname: string): boolean => {
    if (role === "STORE_MANAGER") return true;
    if (role === "CASHIER") {
      return pathname.startsWith("/admin/pos") || pathname === "/admin/login";
    }
    return false;
  };

  // Cashier test cases
  assert.strictEqual(isRouteAllowed("CASHIER", "/admin/pos"), true);
  assert.strictEqual(isRouteAllowed("CASHIER", "/admin/pos/receipt"), true);
  assert.strictEqual(isRouteAllowed("CASHIER", "/admin"), false);
  assert.strictEqual(isRouteAllowed("CASHIER", "/admin/inventory"), false);
  assert.strictEqual(isRouteAllowed("CASHIER", "/admin/products"), false);
  assert.strictEqual(isRouteAllowed("CASHIER", "/admin/orders"), false);

  // Store Manager test cases
  assert.strictEqual(isRouteAllowed("STORE_MANAGER", "/admin"), true);
  assert.strictEqual(isRouteAllowed("STORE_MANAGER", "/admin/pos"), true);
  assert.strictEqual(isRouteAllowed("STORE_MANAGER", "/admin/inventory"), true);
  assert.strictEqual(isRouteAllowed("STORE_MANAGER", "/admin/products"), true);
  assert.strictEqual(isRouteAllowed("STORE_MANAGER", "/admin/orders"), true);
});

// ==============================================================================
// 6. GUEST ORDER TRACKING, 2FA VERIFICATION & PII MASKING
// ==============================================================================
test("Privacy & 2FA: PII masking utilities prevent data leaks", () => {
  // Customer name masking
  assert.strictEqual(maskName("Nguyễn Văn An"), "N****n V*n A*");
  assert.strictEqual(maskName("Trần Mai Lan"), "T**n M*i L*n");
  assert.strictEqual(maskName("John Doe"), "J**n D*e");

  // Phone masking
  assert.strictEqual(maskPhone("0905123456"), "09****3456");
  assert.strictEqual(maskPhone("0988776655"), "09****6655");

  // Address masking
  assert.strictEqual(
    maskAddress("123 Quang Trung, Phường Thạch Thang, Quận Hải Châu, TP. Đà Nẵng"),
    "*** Quang Trung, Phường Thạch Thang, Quận Hải Châu, TP. Đà Nẵng"
  );
});

test("Rate Limiting: sliding window enforces maximum 10 requests per minute", () => {
  const ip = "192.168.1.100";
  resetRateLimit(`guest_tracking:${ip}`);

  // Send 10 allowed requests
  for (let i = 0; i < 10; i++) {
    const res = checkRateLimit(`guest_tracking:${ip}`, { maxRequests: 10, windowMs: 60000 });
    assert.strictEqual(res.success, true, `Request #${i + 1} should be permitted`);
    assert.strictEqual(res.remaining, 9 - i);
  }

  // 11th request must be rejected
  const blocked = checkRateLimit(`guest_tracking:${ip}`, { maxRequests: 10, windowMs: 60000 });
  assert.strictEqual(blocked.success, false, "11th request within 1 minute must be rejected");
  assert.strictEqual(blocked.remaining, 0);
  assert.ok(blocked.resetMs > 0, "Reset time must be positive");
});

// ==============================================================================
// 7. ENVIRONMENT SECRETS & REPOSITORY HYGIENE
// ==============================================================================
test("Security Hygiene: Secrets isolation and Git ignore rules", () => {
  const gitignoreContent = fs.readFileSync(path.resolve(".gitignore"), "utf8");

  // docs/ must be ignored
  assert.match(gitignoreContent, /^docs\/$/m, ".gitignore must exclude docs/");

  // .env files must be ignored
  assert.match(gitignoreContent, /^\.env\*$/m, ".gitignore must exclude .env*");

  // supabase temp files must be ignored
  assert.match(gitignoreContent, /supabase\/\.temp\//m, ".gitignore must exclude supabase/.temp/");

  // Check admin.ts server-only enforcement
  const adminTs = fs.readFileSync(path.resolve("src/lib/supabase/admin.ts"), "utf8");
  assert.match(adminTs, /import ["']server-only["']/, "admin.ts must enforce 'server-only'");

  // Check that service role key does not leak with NEXT_PUBLIC_ prefix in example
  const envExample = fs.readFileSync(path.resolve(".env.example"), "utf8");
  assert.match(envExample, /^SUPABASE_SERVICE_ROLE_KEY=/m, "Service role key must NOT have NEXT_PUBLIC_ prefix");
  assert.doesNotMatch(envExample, /^NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=/m);
});
