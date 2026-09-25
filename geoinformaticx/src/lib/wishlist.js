import { showToast } from "./toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const normalizeItem = (raw) => {
  const source = raw.item_type === "service" ? raw.service : raw.product;
  return {
    wishlistItemId: raw.id,
    id: source?.id,
    name: source?.name,
    seller: source?.seller?.store_name,
    verified: source?.verified ?? false,
    price: Number(source?.price || 0),
    stock: Number(source?.stock ?? 0),
    slug: source?.sku,
    img: source?.image_url || "https://placehold.co/300x300?text=No+Image",
    type: raw.item_type,
  };
};

export const getWishlist = async () => {
  try {
    const res = await fetch(`${API_BASE}/wishlist`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) return [];
    return (data.data?.items || []).map(normalizeItem);
  } catch (err) {
    console.error("getWishlist error:", err);
    return [];
  }
};

// item: { productId, type: "product" | "service" }
export const addToWishlist = async (item) => {
  try {
    const res = await fetch(`${API_BASE}/wishlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        item_type: item.type || "product",
        product_id: item.type === "service" ? undefined : item.productId,
        service_id: item.type === "service" ? item.productId : undefined,
      }),
    });
    const data = await res.json();
    if (res.status === 401) return { success: false, requiresLogin: true };
    if (!res.ok) return { success: false, message: data.message };
    window.dispatchEvent(new Event("storage"));
    showToast("Added to wishlist!");
    return { success: true };
  } catch (err) {
    return { success: false, message: "Could not reach the server." };
  }
};

export const removeFromWishlist = async (wishlistItemId) => {
  try {
    const res = await fetch(`${API_BASE}/wishlist/${wishlistItemId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    window.dispatchEvent(new Event("storage"));
    return { success: res.ok, message: data.message };
  } catch (err) {
    return { success: false, message: "Could not reach the server." };
  }
};
export const isWishlisted = (id, list) => Array.isArray(list) && list.some((i) => i.id === id);