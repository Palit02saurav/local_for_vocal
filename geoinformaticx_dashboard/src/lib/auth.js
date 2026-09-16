const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const signup = async ({
  fullName, businessName, email, phone, location, latitude, longitude,
  sellerType, gstNumber, businessRegNumber, panNumber,
}) => {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        full_name: fullName,
        store_name: businessName,
        email,
        phone,
        location,
        latitude,
        longitude,
        seller_type: sellerType,
        gst_number: gstNumber,
        business_registration_number: businessRegNumber,
        pan_number: panNumber,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Signup failed." };
    }
    return { success: true, message: data.message, user: data.data?.user };
  } catch (err) {
    return { success: false, error: "Could not reach the server. Is the backend running?" };
  }
};

export const login = async (email, password, role) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Login failed." };
    }
    const user = data.data?.user;
    localStorage.setItem("admin_auth_user", JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
    return { success: true, user };
  } catch (err) {
    return { success: false, error: "Could not reach the server. Is the backend running?" };
  }
};

export const logout = async () => {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
  }
  localStorage.removeItem("admin_auth_user");
  window.dispatchEvent(new Event("storage"));
};

export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("admin_auth_user"));
  } catch {
    return null;
  }
};

export const checkAuth = async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.data?.user;
    localStorage.setItem("admin_auth_user", JSON.stringify(user));
    return user;  
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!getCurrentUser();