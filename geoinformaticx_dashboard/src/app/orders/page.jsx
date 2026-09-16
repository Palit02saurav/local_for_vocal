"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import OrdersPage from "./order";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const STATUS_MAP = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function normalizeOrder(o, isSellerRow) {
  if (isSellerRow) {
    // Seller view: o is a raw OrderItem row, not a full Order.
    const order = o.order || {};
    const customer = order.customer || {};
    const created = new Date(order.created_at || o.created_at);

    return {
      orderId: `ORD${order.id ?? o.id}`,
      sellerName: o.seller_name || "—",
      customerName: customer.full_name || order.full_name || "—",
      customerEmail: customer.email || order.email || "—",
      customerPhone: order.phone,
      customerAddress: order.address,
      date: created.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: created.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      itemName: o.name,
      itemImage: o.image_url,
      itemCount: 1,
      items: [{ name: o.name, image: o.image_url, price: o.price }],
      amount: Number(o.price) * o.quantity,
      subtotal: Number(o.price) * o.quantity,
      deliveryCharge: 0,
      packagingCharge: 0,
      payment: order.payment_method,
      txnId: null,
      status: order.status,
      shippingAddress: order.address,
    };
  }

  // Admin view: o is a full Order row with .items[].
  const items = o.items || [];
  const first = items[0] || {};
  const created = new Date(o.created_at);

  return {
    orderId: `ORD${o.id}`,
    sellerName: [...new Set(items.map((i) => i.seller_name).filter(Boolean))].join(", ") || "—",
    customerName: o.customer?.full_name || o.full_name,
    customerEmail: o.customer?.email || o.email,
    customerPhone: o.phone,
    customerAddress: o.address,
    date: created.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: created.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    itemName: first.name,
    itemImage: first.image_url,
    itemCount: items.length,
    items: items.map((i) => ({ name: i.name, image: i.image_url, price: i.price })),
    amount: o.total,
    subtotal: o.total,
    deliveryCharge: 0,
    packagingCharge: 0,
    payment: o.payment_method,
    txnId: null,
    status: o.status,
    shippingAddress: o.address,
  };
}
export default function Page() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const initialStatus = STATUS_MAP[statusParam] || "All Status";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    setLoading(true);
    fetch(`${API_BASE}/orders`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const raw = data.data?.orders || [];
        const isSellerRow = raw.length > 0 && raw[0].item_type !== undefined;
        setOrders(raw.map((o) => normalizeOrder(o, isSellerRow)));
      })
      .catch((err) => console.error("Failed to load orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId, status) => {
    const numericId = orderId.replace(/^ORD/, "");
    try {
      const res = await fetch(`${API_BASE}/orders/${numericId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

return (
    <OrdersPage
      orders={orders}
      loading={loading}
      onUpdateStatus={handleUpdateStatus}
      initialStatus={initialStatus}
    />
  );
}