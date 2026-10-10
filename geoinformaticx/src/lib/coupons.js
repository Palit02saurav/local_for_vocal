import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const KEY = "appliedCoupon";

export const getSavedCoupon = () => {
  try {
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

export const saveCoupon = (code) => {
  try {
    if (code) sessionStorage.setItem(KEY, code);
    else sessionStorage.removeItem(KEY);
  } catch {}
};

export const validateCoupon = async (code, items) => {
  try {
    const res = await axios.post(
      `${API_BASE}/coupons/validate`,
      { code, items: items.map((i) => ({ id: i.id, type: i.type, quantity: i.quantity })) },
      { withCredentials: true }
    );
    const c = res.data.data?.coupon;
    return { success: true, code: c.code, title: c.title, discount: Number(c.discount) };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Could not reach the server." };
  }
};