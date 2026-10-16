"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Language,
  CartItem,
  Product,
  ProductVariant,
  InventoryBalance,
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/types";
import {
  INITIAL_INVENTORY_BALANCES,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
} from "@/data/mock-data";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (vi: string, en: string) => string;

  // Cart
  cart: CartItem[];
  addToCart: (variant: ProductVariant, product: Product, quantity?: number) => boolean;
  updateCartQty: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;

  // Inventory
  inventory: Record<string, InventoryBalance>;
  getAvailableStock: (variantId: string) => number;
  adjustInventory: (variantId: string, delta: number, reason: string) => void;

  // Orders
  orders: Order[];
  createOnlineOrder: (orderData: Partial<Order>) => { success: boolean; orderRef?: string; error?: string };
  recordInStoreSale: (variantId: string, qty: number, paymentMethod: string) => { success: boolean; orderRef?: string; error?: string };
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, newStatus: PaymentStatus) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [inventory, setInventory] = useState<Record<string, InventoryBalance>>(
    INITIAL_INVENTORY_BALANCES
  );
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  // Load language and cart from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("hae_lang") as Language;
      if (savedLang && (savedLang === "vi" || savedLang === "en")) {
        setLanguage(savedLang);
      }
      const savedCart = localStorage.getItem("hae_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch {
      // LocalStorage error ignore
    }
  }, []);

  // Save language changes
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem("hae_lang", lang);
    } catch {}
  };

  // Helper for quick translation
  const t = (vi: string, en: string) => (language === "vi" ? vi : en);

  // Cart helper save
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("hae_cart", JSON.stringify(newCart));
    } catch {}
  };

  const getAvailableStock = (variantId: string): number => {
    const balance = inventory[variantId];
    if (!balance) return 0;
    return Math.max(0, balance.quantityOnHand - balance.quantityReserved);
  };

  const addToCart = (
    variant: ProductVariant,
    product: Product,
    quantity = 1
  ): boolean => {
    const available = getAvailableStock(variant.id);
    const existingIndex = cart.findIndex((item) => item.variantId === variant.id);
    const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;

    if (currentQtyInCart + quantity > available) {
      alert(
        language === "vi"
          ? `Rất tiếc! Chỉ còn ${available} sản phẩm trong kho.`
          : `Sorry! Only ${available} units available in stock.`
      );
      return false;
    }

    let updatedCart: CartItem[];
    if (existingIndex >= 0) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [
        ...cart,
        {
          variantId: variant.id,
          productId: product.id,
          productName_vi: product.name_vi,
          productName_en: product.name_en,
          sku: variant.sku,
          colorName_vi: variant.colorName_vi,
          colorName_en: variant.colorName_en,
          colorHex: variant.colorHex,
          sizeLabel: variant.sizeLabel,
          lensType_vi: variant.lensType_vi,
          lensType_en: variant.lensType_en,
          price: variant.price,
          quantity: quantity,
          imageUrl: variant.imageUrl,
        },
      ];
    }

    saveCart(updatedCart);
    setCartDrawerOpen(true);
    return true;
  };

  const updateCartQty = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    const available = getAvailableStock(variantId);
    if (quantity > available) {
      alert(
        language === "vi"
          ? `Chỉ còn ${available} sản phẩm trong kho.`
          : `Only ${available} items available in stock.`
      );
      return;
    }
    const updated = cart.map((item) =>
      item.variantId === variantId ? { ...item, quantity } : item
    );
    saveCart(updated);
  };

  const removeFromCart = (variantId: string) => {
    const updated = cart.filter((item) => item.variantId !== variantId);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Concurrency & Stock mutations (simulated in state)
  const adjustInventory = (variantId: string, delta: number, reason: string) => {
    setInventory((prev) => {
      const current = prev[variantId] || {
        variantId,
        locationId: "HOI_AN_MAIN",
        quantityOnHand: 0,
        quantityReserved: 0,
        quantityAvailable: 0,
        updatedAt: new Date().toISOString(),
      };
      const newOnHand = Math.max(0, current.quantityOnHand + delta);
      return {
        ...prev,
        [variantId]: {
          ...current,
          quantityOnHand: newOnHand,
          quantityAvailable: Math.max(0, newOnHand - current.quantityReserved),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Atomic POS Sale
  const recordInStoreSale = (
    variantId: string,
    qty: number,
    paymentMethod: string
  ) => {
    const available = getAvailableStock(variantId);
    if (available < qty) {
      return {
        success: false,
        error:
          language === "vi"
            ? `Không đủ số lượng trong kho! Khả dụng: ${available}`
            : `Insufficient stock! Available: ${available}`,
      };
    }

    // Atomic decrement
    setInventory((prev) => {
      const cur = prev[variantId];
      const newOnHand = cur.quantityOnHand - qty;
      return {
        ...prev,
        [variantId]: {
          ...cur,
          quantityOnHand: newOnHand,
          quantityAvailable: newOnHand - cur.quantityReserved,
          updatedAt: new Date().toISOString(),
        },
      };
    });

    const orderRef = `HAE-POS-${Math.floor(1000 + Math.random() * 9000)}`;
    const product = MOCK_PRODUCTS.find((p) =>
      p.variants.some((v) => v.id === variantId)
    );
    const variant = product?.variants.find((v) => v.id === variantId);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderRef,
      channel: "in_store",
      fulfillmentType: "pickup",
      orderStatus: "completed",
      paymentMethod: paymentMethod === "vietqr" ? "bank_transfer" : "cod",
      paymentStatus: "paid",
      customerName: "Khách Mua Tại Quầy",
      customerPhone: "0900000000",
      subtotal: (variant?.price || 0) * qty,
      shippingFee: 0,
      totalAmount: (variant?.price || 0) * qty,
      items: [
        {
          id: `item-${Date.now()}`,
          variantId,
          sku: variant?.sku || "SKU-UNKNOWN",
          productName: product?.name_vi || "Kính Mát",
          variantDescription: `${variant?.colorName_vi} / ${variant?.lensType_vi}`,
          unitPrice: variant?.price || 0,
          quantity: qty,
          totalPrice: (variant?.price || 0) * qty,
          imageUrl: variant?.imageUrl || "",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return { success: true, orderRef };
  };

  // Online Checkout Order Creation
  const createOnlineOrder = (orderData: Partial<Order>) => {
    // Check available stock for each item in cart
    for (const item of cart) {
      const avail = getAvailableStock(item.variantId);
      if (avail < item.quantity) {
        return {
          success: false,
          error:
            language === "vi"
              ? `Rất tiếc! Mẫu kính ${item.productName_vi} vừa hết hàng.`
              : `Sorry! ${item.productName_en} just sold out.`,
        };
      }
    }

    // Reserve stock atomically
    setInventory((prev) => {
      const nextInv = { ...prev };
      for (const item of cart) {
        const cur = nextInv[item.variantId];
        if (cur) {
          const newReserved = cur.quantityReserved + item.quantity;
          nextInv[item.variantId] = {
            ...cur,
            quantityReserved: newReserved,
            quantityAvailable: Math.max(0, cur.quantityOnHand - newReserved),
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return nextInv;
    });

    // Generate random 8-character Base32 order ref
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let randCode = "";
    for (let i = 0; i < 8; i++) {
      randCode += chars[Math.floor(Math.random() * chars.length)];
    }
    const orderRef = `HAE-${randCode.slice(0, 4)}-${randCode.slice(4)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderRef,
      channel: "online",
      fulfillmentType: orderData.fulfillmentType || "delivery",
      orderStatus: "pending",
      paymentMethod: orderData.paymentMethod || "cod",
      paymentStatus: "pending",
      customerName: orderData.customerName || "Khách Hàng",
      customerPhone: orderData.customerPhone || "",
      customerEmail: orderData.customerEmail,
      shippingAddress: orderData.shippingAddress,
      subtotal: cartTotal,
      shippingFee: orderData.shippingFee || 0,
      totalAmount: cartTotal + (orderData.shippingFee || 0),
      customerNotes: orderData.customerNotes,
      bankTransferExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      items: cart.map((item) => ({
        id: `item-${Date.now()}-${item.variantId}`,
        variantId: item.variantId,
        sku: item.sku,
        productName: language === "vi" ? item.productName_vi : item.productName_en,
        variantDescription: `${language === "vi" ? item.colorName_vi : item.colorName_en} / ${language === "vi" ? item.lensType_vi : item.lensType_en}`,
        unitPrice: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        imageUrl: item.imageUrl,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return { success: true, orderRef };
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? { ...ord, orderStatus: newStatus, updatedAt: new Date().toISOString() }
          : ord
      )
    );
  };

  const updatePaymentStatus = (orderId: string, newStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              paymentStatus: newStatus,
              orderStatus: newStatus === "verified" || newStatus === "paid" ? "confirmed" : ord.orderStatus,
              updatedAt: new Date().toISOString(),
            }
          : ord
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        cartDrawerOpen,
        setCartDrawerOpen,
        inventory,
        getAvailableStock,
        adjustInventory,
        orders,
        createOnlineOrder,
        recordInStoreSale,
        updateOrderStatus,
        updatePaymentStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

