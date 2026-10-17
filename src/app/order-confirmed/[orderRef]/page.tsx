import React from "react";
import { getOrderByRef } from "@/lib/data/orders";
import OrderConfirmedClientView from "@/components/checkout/OrderConfirmedClientView";

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ orderRef: string }>;
}) {
  const { orderRef } = await params;
  const order = await getOrderByRef(orderRef);

  return (
    <OrderConfirmedClientView
      orderRef={orderRef}
      initialOrder={order}
    />
  );
}
