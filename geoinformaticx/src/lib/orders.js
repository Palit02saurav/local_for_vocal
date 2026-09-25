import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const client = axios.create({ baseURL: API_BASE, withCredentials: true });

export const createOrderFromCart = async (items, form) => {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items, ...form }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message, hasProducts: false, hasServices: false };
    }
    return { success: true, hasProducts: data.data?.hasProducts, hasServices: data.data?.hasServices };
  } catch (err) {
    return { success: false, message: "Could not reach the server.", hasProducts: false, hasServices: false };
  }
};

export const cancelOrder = async (orderId) => {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: "PATCH",
      credentials: "include",
    });
    const data = await res.json();
    return { success: res.ok, message: data.message };
  } catch (err) {
    return { success: false, message: "Could not reach the server." };
  }
};

const normalizeOrder = (raw) => ({
  orderId: raw.id,
  groupId: raw.order?.id,
  name: raw.name,
  seller: raw.seller_name,
  image: raw.image_url || "https://placehold.co/100x100?text=No+Image",
  price: Number(raw.price),
  quantity: raw.quantity,
  status: raw.order?.status || "Pending",
  date: raw.order?.created_at || raw.created_at,
});

export const getProductOrders = async () => {
  try {
    const res = await fetch(`${API_BASE}/orders/products`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) return [];
    return (data.data?.orders || []).map(normalizeOrder);
  } catch (err) {
    console.error("getProductOrders error:", err);
    return [];
  }
};

export const getServiceOrders = async () => {
  try {
    const res = await fetch(`${API_BASE}/orders/services`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) return [];
    return (data.data?.orders || []).map(normalizeOrder);
  } catch (err) {
    console.error("getServiceOrders error:", err);
    return [];
  }
};