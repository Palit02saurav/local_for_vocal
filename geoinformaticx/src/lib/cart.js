import axios from "axios";
import { showToast } from "./toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const client = axios.create({ baseURL: API_BASE, withCredentials: true });

const normalizeItem = (raw) => {
  const source = raw.item_type === "service" ? raw.service : raw.product;
  return {
    cartItemId: raw.id,                
    id: source?.id,                  
    name: source?.name,
    seller: source?.seller?.store_name,
    verified: source?.verified ?? false,
    price: Number(source?.price || 0),
    image: source?.image_url || "https://placehold.co/300x300?text=No+Image",
    quantity: raw.quantity,
    type: raw.item_type,

    isFreshDelivery: raw.item_type === "product" && source?.delivery_type === "Fresh",
  };
};

export const getCart = async () => {
  try {
    const res = await client.get("/cart");
    return (res.data.data?.items || []).map(normalizeItem);
  } catch (err) {
    if (err.response?.status !== 401) {
      console.error("getCart error:", err);
    }
    return [];
  }
};

// item: { productId, type: "product" | "service" }
export const addToCart = async (item, quantity = 1) => {
  try {
    await client.post("/cart", {
      item_type: item.type || "product",
      product_id: item.type === "service" ? undefined : item.productId,
      service_id: item.type === "service" ? item.productId : undefined,
      quantity,
    });
    window.dispatchEvent(new Event("storage"));
    showToast("Added to cart!");
    return { success: true };
  } catch (err) {
    if (err.response?.status === 401) return { success: false, requiresLogin: true };
    return { success: false, message: err.response?.data?.message || "Could not reach the server." };
  }
};

export const updateCartQuantity = async (cartItemId, quantity) => {
  try {
    await client.patch(`/cart/${cartItemId}`, { quantity });
    window.dispatchEvent(new Event("storage"));
    return { success: true };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Could not reach the server." };
  }
};

export const removeFromCart = async (cartItemId) => {
  try {
    const res = await client.delete(`/cart/${cartItemId}`);
    window.dispatchEvent(new Event("storage"));
    return { success: true, message: res.data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Could not reach the server." };
  }
};

export const clearCart = async () => {
  try {
    const res = await client.delete("/cart");
    window.dispatchEvent(new Event("storage"));
    return { success: true, message: res.data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Could not reach the server." };
  }
};

export const getCartCount = async () => {
  const items = await getCart();
  return items.reduce((sum, item) => sum + item.quantity, 0);
};