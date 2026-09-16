import axios from "axios";
import { showToast } from "./toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const client = axios.create({ baseURL: API_BASE, withCredentials: true });
const CURRENT_USER_KEY = "currentUser";

export const signUp = async ({ name, email, phone, password }) => {
  try {
    const res = await client.post("/customer/auth/signup", { name, email, phone, password });
    const data = res.data;
    
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Could not reach the server. Is the backend running?" };
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const res = await fetch(`${API_BASE}/customer/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || "Invalid OTP." };
    }
    const user = data.data?.user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
    showToast(`Welcome, ${user.name}!`);
    return { success: true };
  } catch (err) {
    return { success: false, message: "Could not reach the server. Is the backend running?" };
  }
};

export const resendOtp = async (email) => {
  try {
    const res = await fetch(`${API_BASE}/customer/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return { success: res.ok, message: data.message };
  } catch (err) {
    return { success: false, message: "Could not reach the server. Is the backend running?" };
  }
};

export const signIn = async ({ email, password }) => {
  try {
    const res = await fetch(`${API_BASE}/customer/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || "Invalid email or password." };
    }
    const user = data.data?.user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
    showToast(`Welcome back, ${user.name}!`);
    return { success: true };
  } catch (err) {
    return { success: false, message: "Could not reach the server. Is the backend running?" };
  }
};

export const signOut = async () => {
  try {
    await fetch(`${API_BASE}/customer/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
  }
  localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event("storage"));
};

export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
  } catch {
    return null;
  }
};

export const checkAuth = async () => {
  try {
    const res = await fetch(`${API_BASE}/customer/auth/me`, { credentials: "include" });
    if (!res.ok) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    const data = await res.json();
    const user = data.data?.user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!getCurrentUser();