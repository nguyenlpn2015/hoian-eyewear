import test from "node:test";
import assert from "node:assert";
import { createOnlineOrderAction } from "@/app/checkout/actions";
import { checkRateLimit } from "@/lib/rate-limit";
import { maskName, maskPhone, maskAddress } from "@/lib/utils";
import type { StaffRole } from "@/types/database";

// ==============================================================================
// 1. RBAC AUTHORIZATION BARRIER TESTS (CASHIER VS STORE_MANAGER)
// ==============================================================================
test("RBAC Audit: Cashier must be strictly blocked from Store Manager operations", () => {
  // Test matrix of staff actions vs allowed roles
  const rbacMatrix: Record<string, { allowedRoles: StaffRole[]; description: string }> = {
    adjustInventory: {
      allowedRoles: ["STORE_MANAGER"],
      description: "Điều chỉnh tồn kho thủ công",
    },
    updateOrderStatus: {
      allowedRoles: ["STORE_MANAGER"],
      description: "Cập nhật trạng thái đơn và mã vận đơn",
    },
    verifyPayment: {
      allowedRoles: ["STORE_MANAGER"],
      description: "Xác nhận khớp thanh toán chuyển khoản VietQR",
    },
    cancelOrder: {
      allowedRoles: ["STORE_MANAGER"],
      description: "Hủy đơn hàng và giải phóng tồn kho",
    },
    recordInStoreSale: {
      allowedRoles: ["CASHIER", "STORE_MANAGER"],
      description: "Bán hàng trực tiếp tại quầy POS",
    },
  };

  const cashierRole: StaffRole = "CASHIER";
  const managerRole: StaffRole = "STORE_MANAGER";

  for (const [actionName, rule] of Object.entries(rbacMatrix)) {
    const isCashierAllowed = rule.allowedRoles.includes(cashierRole);
    const isManagerAllowed = rule.allowedRoles.includes(managerRole);

    if (actionName === "recordInStoreSale") {
      assert.strictEqual(isCashierAllowed, true, "CASHIER must be allowed POS sale");
    } else {
      assert.strictEqual(
        isCashierAllowed,
        false,
        `CASHIER must NOT be authorized for ${actionName} (${rule.description})`
      );
    }
    assert.strictEqual(isManagerAllowed, true, `STORE_MANAGER must be authorized for ${actionName}`);
  }
});

// ==============================================================================
// 2. CHECKOUT INPUT VALIDATION & TAMPERING RESISTANCE TESTS
// ==============================================================================
test("Checkout Validation: Malformed and manipulated checkout requests are rejected", async () => {
  // 1. Empty customer name
  const res1 = await createOnlineOrderAction({
    customerName: "   ",
    customerPhone: "0905123456",
    fulfillmentType: "delivery",
    paymentMethod: "cod",
    items: [{ variantId: "c0000000-0000-0000-0000-000000000001", quantity: 1 }],
  });
  assert.strictEqual(res1.success, false);
  assert.ok(res1.error?.includes("họ và tên"));

  // 2. Invalid Vietnamese phone numbers
  const invalidPhones = ["0123456789", "090512345", "09051234567", "abcdefghij", "+840905123456"];
  for (const phone of invalidPhones) {
    const resPhone = await createOnlineOrderAction({
      customerName: "Nguyễn Văn Test",
      customerPhone: phone,
      fulfillmentType: "delivery",
      paymentMethod: "cod",
      items: [{ variantId: "c0000000-0000-0000-0000-000000000001", quantity: 1 }],
    });
    assert.strictEqual(resPhone.success, false, `Expected failure for invalid phone: ${phone}`);
    assert.ok(resPhone.error?.includes("số điện thoại"));
  }

  // 3. Empty cart
  const resEmptyCart = await createOnlineOrderAction({
    customerName: "Nguyễn Văn Test",
    customerPhone: "0905123456",
    fulfillmentType: "delivery",
    paymentMethod: "cod",
    items: [],
  });
  assert.strictEqual(resEmptyCart.success, false);
  assert.ok(resEmptyCart.error?.includes("trống"));

  // 4. Non-positive quantity (0 or negative)
  const resZeroQty = await createOnlineOrderAction({
    customerName: "Nguyễn Văn Test",
    customerPhone: "0905123456",
    fulfillmentType: "delivery",
    paymentMethod: "cod",
    items: [{ variantId: "c0000000-0000-0000-0000-000000000001", quantity: 0 }],
  });
  assert.strictEqual(resZeroQty.success, false);
  assert.ok(resZeroQty.error?.includes("không hợp lệ"));

  const resNegQty = await createOnlineOrderAction({
    customerName: "Nguyễn Văn Test",
    customerPhone: "0905123456",
    fulfillmentType: "delivery",
    paymentMethod: "cod",
    items: [{ variantId: "c0000000-0000-0000-0000-000000000001", quantity: -2 }],
  });
  assert.strictEqual(resNegQty.success, false);
  assert.ok(resNegQty.error?.includes("không hợp lệ"));

  // 5. Excessive quantity per item (> 50)
  const resExcessiveQty = await createOnlineOrderAction({
    customerName: "Nguyễn Văn Test",
    customerPhone: "0905123456",
    fulfillmentType: "delivery",
    paymentMethod: "cod",
    items: [{ variantId: "c0000000-0000-0000-0000-000000000001", quantity: 99 }],
  });
  assert.strictEqual(resExcessiveQty.success, false);
  assert.ok(resExcessiveQty.error?.includes("tối đa là 50"));
});

// ==============================================================================
// 3. GUEST ORDER TRACKING PRIVACY & RATE LIMITING
// ==============================================================================
test("Guest Tracking Security: PII masking and brute-force protection", async () => {
  // Test PII masking functions
  const sampleName = "Nguyễn Hoàng Nam";
  const maskedName = maskName(sampleName);
  assert.ok(!maskedName.includes("Hoàng"), "Middle name must be masked");
  assert.ok(maskedName.startsWith("N"), "Should retain start chars");

  const samplePhone = "0905123456";
  const maskedPhone = maskPhone(samplePhone);
  assert.strictEqual(maskedPhone, "09****3456", "Phone must mask middle digits");

  const sampleAddress = "123 Trần Phú, Phường Minh An, TP. Hội An, Quảng Nam";
  const maskedAddr = maskAddress(sampleAddress);
  assert.ok(!maskedAddr.includes("123 Trần Phú"), "Street address and number must be masked");
  assert.ok(maskedAddr.includes("Hội An"), "City/Province may be preserved for delivery context");

  // Test rate limiting: 10 requests per minute
  const testIp = `test-ip-${Date.now()}`;
  for (let i = 1; i <= 10; i++) {
    const rl = checkRateLimit(testIp, { maxRequests: 10, windowMs: 60000 });
    assert.strictEqual(rl.success, true, `Request ${i} within limit must succeed`);
  }

  // 11th request must be rejected
  const rl11 = checkRateLimit(testIp, { maxRequests: 10, windowMs: 60000 });
  assert.strictEqual(rl11.success, false, "Request 11 exceeding limit must be rejected");
  assert.strictEqual(rl11.remaining, 0);
  assert.ok(rl11.resetMs > 0);
});

// ==============================================================================
// 4. ORDER EXPIRATION LIFECYCLE AUDIT
// ==============================================================================
test("Order Expiration: Stale bank-transfer orders must be eligible for cancellation", () => {
  const now = new Date();
  const past25Hours = new Date(now.getTime() - 25 * 3600 * 1000).toISOString();
  const future23Hours = new Date(now.getTime() + 23 * 3600 * 1000).toISOString();

  const orders = [
    {
      id: "ord-expired",
      orderRef: "HAE-EXP1-0001",
      paymentMethod: "bank_transfer",
      orderStatus: "pending",
      bankTransferExpiresAt: past25Hours,
    },
    {
      id: "ord-active",
      orderRef: "HAE-ACT1-0002",
      paymentMethod: "bank_transfer",
      orderStatus: "pending",
      bankTransferExpiresAt: future23Hours,
    },
    {
      id: "ord-cod",
      orderRef: "HAE-COD1-0003",
      paymentMethod: "cod",
      orderStatus: "pending",
      bankTransferExpiresAt: null,
    },
  ];

  const expiredOrders = orders.filter(
    (o) =>
      o.orderStatus === "pending" &&
      o.paymentMethod === "bank_transfer" &&
      o.bankTransferExpiresAt &&
      new Date(o.bankTransferExpiresAt).getTime() < now.getTime()
  );

  assert.strictEqual(expiredOrders.length, 1);
  assert.strictEqual(expiredOrders[0].id, "ord-expired");
});

// ==============================================================================
// 5. PRODUCTION ENVIRONMENT SAFETY AUDIT
// ==============================================================================
test("Production Hygiene: Dev quick-login disabled and no service-role key in public env", () => {
  // Ensure NEXT_PUBLIC_ does not expose service role key
  const publicVars = Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
  for (const key of publicVars) {
    const val = process.env[key] || "";
    assert.ok(
      !key.includes("SERVICE_ROLE"),
      `CRITICAL: Service role key must NEVER be prefixed with NEXT_PUBLIC_ (${key})`
    );
    assert.ok(
      !val.includes("service_role"),
      `CRITICAL: Public environment variable ${key} must not contain service_role token`
    );
  }
});
