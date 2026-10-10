"use client";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, signOut } from "@/lib/auth";
import { getProductOrders } from "@/lib/orders";
import { getWishlist, removeFromWishlist } from "@/lib/wishlist";
import { addToCart } from "@/lib/cart";
import "./profile.css";
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const INDIAN_STATES = [
  // States
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

const sidebarItems = [
  { key: "profile", label: "My Profile", icon: "user" },
  { key: "orders", label: "My Orders", icon: "bag", href: "/trackorder" },
  { key: "wishlist", label: "Wishlist", icon: "heart", href: "/wishlist" },
  { key: "addresses", label: "Addresses", icon: "pin" },
  { key: "reviews", label: "My Reviews", icon: "star" },
];
const icons = {
  user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  bag: <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4M3 6h18M16 10a4 4 0 0 1-8 0" />,
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  pin: <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  card: <path d="M1 4h22v16H1zM1 10h22" />,
  star: <path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />,
  gear: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  mail: <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6" />,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  calendar: <path d="M3 4h18v18H3zM16 2v4M8 2v4M3 10h18" />,
  building: <path d="M3 21h18M5 21V3h9v18M14 9h5v12M9 7h1M9 11h1M9 15h1" />,
  map: <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16" />,
  camera: <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  lock: <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  chevron: <path d="M9 18l6-6-6-6" />,
  crown: <path d="M2 20h20M3 8l5 5 4-7 4 7 5-5-2 12H5z" />,
};

const Icon = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {icons[name]}
  </svg>
);

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ orders: 0, wishlist: 0, reviews: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [o, w, r] = await Promise.all([
          getProductOrders(),
          getWishlist(),
          axios
            .get(`${API_BASE}/reviews/mine`, { withCredentials: true })
            .then((res) => res.data.data?.reviews || [])
            .catch(() => []),
        ]);
        setStats({
          orders: o?.length || 0,
          wishlist: w?.length || 0,
          reviews: r.length,
        });
      } catch {}
    })();
  }, []);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", dob: "",
    address: "", city: "", state: "", pincode: "",
  });

  useEffect(() => {
    const load = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.push("/login?redirect=/profile");
        return;
      }
      try {
        const { data } = await axios.get(`${API_BASE}/customer/auth/me`, { withCredentials: true });
        const u = data.data?.user;
        if (u) {
          setUser(u);
          setForm({
            name: u.name || "",
            email: u.email || "",
            phone: u.phone || "",
            dob: u.dob || "",
            address: u.address || "",
            city: u.city || "",
            state: u.state || "",
            pincode: u.pincode || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setUser(currentUser);
      }
    };
    load();
  }, [router]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const { data } = await axios.patch(`${API_BASE}/customer/auth/me`, {
        name: form.name,
        phone: form.phone,
        dob: form.dob || null,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      }, { withCredentials: true });
      setUser((prev) => ({ ...prev, ...data.data?.user }));
      setEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      setSaveError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };
const handleLogout = async () => {
  await signOut();
  router.replace("/");
};

  const [tab, setTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishItems, setWishItems] = useState([]);
  const [wishLoading, setWishLoading] = useState(false);

  const openOrders = async () => {
    setTab("orders");
    setOrdersLoading(true);
    setOrders(await getProductOrders());
    setOrdersLoading(false);
  };

  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const openReviews = async () => {
    setTab("reviews");
    setReviewsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/reviews/mine`, { withCredentials: true });
      const list = res.data.data?.reviews || [];
      setMyReviews(list);
      setStats((s) => ({ ...s, reviews: list.length }));
    } catch {
      setMyReviews([]);
    }
    setReviewsLoading(false);
  };

  const openWishlist = async () => {
    setTab("wishlist");
    setWishLoading(true);
    const list = await getWishlist();
    setWishItems(list);
    setStats((s) => ({ ...s, wishlist: list.length }));
    setWishLoading(false);
  };

  const handleWishRemove = async (wishlistItemId) => {
    await removeFromWishlist(wishlistItemId);
    const list = await getWishlist();
    setWishItems(list);
    setStats((s) => ({ ...s, wishlist: list.length }));
  };

  const handleWishAddToCart = async (item) => {
    await addToCart({ productId: item.id, type: item.type || "product" });
  };

    const fileRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allows picking the same file again later
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Only JPG, PNG or WEBP images are allowed.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be 5MB or smaller.", "error");
      return;
    }

    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await axios.post(`${API_BASE}/customer/auth/me/avatar`, fd, {
        withCredentials: true,
      });
      setUser((prev) => ({ ...prev, avatar_url: data.data?.avatar_url }));
      showToast("Profile photo updated!");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not upload photo.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");

    if (pwForm.next.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New password and confirm password do not match.");
      return;
    }

    setPwSaving(true);
    try {
      await axios.patch(
        `${API_BASE}/customer/auth/me/password`,
        { current_password: pwForm.current, new_password: pwForm.next },
        { withCredentials: true }
      );
      showToast("Password changed successfully!");
      setPwForm({ current: "", next: "", confirm: "" });
      setShowPwForm(false);
    } catch (err) {
      setPwError(err.response?.data?.message || "Could not change password. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;


  const tabMeta = {
    profile: {
      title: "My Profile",
      sub: "Manage your personal information, addresses, and account settings.",
    },
    orders: {
      title: "My Orders",
      sub: "View and track all the orders you have placed.",
    },
    wishlist: {
      title: "My Wishlist",
      sub: "Products and services you have saved for later.",
    },
    addresses: {
      title: "My Addresses",
      sub: "Your current delivery address.",
    },
    reviews: {
      title: "My Reviews",
      sub: "Ratings and reviews you have given on your orders.",
    },
  };
  const meta = tabMeta[tab] || tabMeta.profile;

  const initial = user.name?.charAt(0).toUpperCase() || "?";

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <main className="prf-page">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={handlePhotoChange}
      />
      <div className="prf-breadcrumb">
        <Link href="/">Home</Link> <span>›</span>{" "}
        <span>{meta.title}</span>
      </div>

      {/* Hero */}
      <div className="prf-hero">
        <div className="prf-hero-text">
          <h1>{meta.title}</h1>
          <p>{meta.sub}</p>
        </div>
      </div>

      <div className="prf-layout">
        {/* Sidebar */}
        <aside className="prf-sidebar">
          <div className="prf-sidebar-user">
            <div className="prf-avatar-wrap">
              <div className="prf-avatar">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : initial}
              </div>
              <button
                type="button"
                className="prf-avatar-cam"
                aria-label="Change photo"
                disabled={uploadingPhoto}
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="camera" size={13} />
              </button>
            </div>
            <p className="prf-user-name">{user.name}</p>
            <p className="prf-user-email">{user.email}</p>
            <span className="prf-verified-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Verified Account
            </span>
          </div>

          <nav className="prf-nav">
            {sidebarItems.map((item) => (
              <Link
                key={item.key}
                href={item.href || "#"}
                className={`prf-nav-item ${item.key === tab ? "active" : ""}`}
                onClick={(e) => {
                  if (item.key === "orders") {
                    e.preventDefault();
                    openOrders();
                  } else if (item.key === "wishlist") {
                    e.preventDefault();
                    openWishlist();
                  } else if (item.key === "addresses") {
                    e.preventDefault();
                    setTab("addresses");
                  } else if (item.key === "reviews") {
                    e.preventDefault();
                    openReviews();
                  } else if (item.key === "profile") {
                    e.preventDefault();
                    setTab("profile");
                  }
                }}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.key === "notifications" && <i className="prf-dot" />}
              </Link>
            ))}
          </nav>

          <button className="prf-nav-item prf-logout-item" onClick={handleLogout}>
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main content */}
        <div className="prf-main">
          {tab === "profile" && (
            <>
              <div className="prf-card">
                <div className="prf-card-header">
                  <div className="prf-card-title">
                    <span className="prf-card-ico"><Icon name="user" size={20} /></span>
                    <div>
                      <h2>Personal Information</h2>
                      <p>Keep your personal details up to date.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="prf-edit-btn"
                    onClick={() => setEditing((e) => !e)}
                  >
                    {editing ? "Cancel" : "✎ Edit Profile"}
                  </button>
                </div>

                <form className="prf-form" onSubmit={handleSave}>
                  <div className="prf-form-row">
                    <div className="prf-field">
                      <label><Icon name="user" size={16} /> Full Name <b>*</b></label>
                      <input
                        type="text"
                        value={form.name}
                        disabled={!editing}
                        onChange={(e) => handleChange("name", e.target.value)}
                      />
                    </div>
                    <div className="prf-field">
                      <label><Icon name="mail" size={16} /> Email Address <b>*</b></label>
                      <input type="email" value={form.email} disabled readOnly />
                    </div>
                  </div>

                  <div className="prf-form-row">
                    <div className="prf-field">
                      <label><Icon name="phone" size={16} /> Phone Number <b>*</b></label>
                      <input
                        type="tel"
                        placeholder="+91 00000 00000"
                        value={form.phone}
                        disabled
                        readOnly
                      />
                    </div>
                    <div className="prf-field">
                      <label><Icon name="calendar" size={16} /> Date of Birth</label>
                      <input
                        type="date"
                        value={form.dob}
                        disabled={!editing}
                        onChange={(e) => handleChange("dob", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="prf-field">
                    <label><Icon name="pin" size={16} /> Address <b>*</b></label>
                    <input
                      type="text"
                      placeholder="Street address"
                      value={form.address}
                      disabled={!editing}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </div>

                  <div className="prf-form-row prf-form-row-3">
                    <div className="prf-field">
                      <label><Icon name="building" size={16} /> City <b>*</b></label>
                      <input
                        type="text"
                        value={form.city}
                        disabled={!editing}
                        onChange={(e) => handleChange("city", e.target.value)}
                      />
                    </div>
                    <div className="prf-field">
                      <label><Icon name="map" size={16} /> State <b>*</b></label>
                      <select
                        value={form.state}
                        disabled={!editing}
                        onChange={(e) => handleChange("state", e.target.value)}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="prf-field">
                      <label><Icon name="pin" size={16} /> Pincode <b>*</b></label>
                      <input
                        type="text"
                        value={form.pincode}
                        disabled={!editing}
                        onChange={(e) => handleChange("pincode", e.target.value)}
                      />
                    </div>
                  </div>

                  {editing && (
                    <>
                      {saveError && <p style={{ color: "#e03131", fontSize: 13, margin: 0 }}>{saveError}</p>}
                      <button type="submit" className="prf-save-btn" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  )}
                </form>
              </div>

              <div className="prf-card prf-security">
                <div className="prf-card-title">
                  <span className="prf-card-ico"><Icon name="shield" size={20} /></span>
                  <div>
                    <h2>Account Security</h2>
                    <p>Manage your password and account security.</p>
                  </div>
                </div>
                <div className="prf-sec-list">
                  <div className="prf-sec-row">
                    <span className="prf-sec-ico"><Icon name="lock" size={20} /></span>
                    <div className="prf-sec-text">
                      <strong>Password</strong>
                      <span>Change your account password regularly.</span>
                    </div>
                    <button
                      type="button"
                      className="prf-outline-btn"
                      onClick={() => {
                        setShowPwForm((v) => !v);
                        setPwError("");
                      }}
                    >
                      {showPwForm ? "Cancel" : <>Change Password <Icon name="chevron" size={14} /></>}
                    </button>
                  </div>

                  {showPwForm && (
                    <form className="prf-pw-form" onSubmit={handleChangePassword}>
                      <div className="prf-field">
                        <label><Icon name="lock" size={16} /> Current Password <b>*</b></label>
                        <input
                          type="password"
                          autoComplete="current-password"
                          value={pwForm.current}
                          onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="prf-form-row">
                        <div className="prf-field">
                          <label><Icon name="lock" size={16} /> New Password <b>*</b></label>
                          <input
                            type="password"
                            autoComplete="new-password"
                            minLength={6}
                            value={pwForm.next}
                            onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="prf-field">
                          <label><Icon name="lock" size={16} /> Confirm New Password <b>*</b></label>
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={pwForm.confirm}
                            onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      {pwError && <p className="prf-pw-error">{pwError}</p>}
                      <button type="submit" className="prf-save-btn" disabled={pwSaving}>
                        {pwSaving ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === "orders" && (
            <div className="prf-card">
              <div className="prf-card-header">
                <div className="prf-card-title">
                  <span className="prf-card-ico"><Icon name="bag" size={20} /></span>
                  <div>
                    <h2>My Orders</h2>
                    <p>View and track all the orders you have placed.</p>
                  </div>
                </div>
                <Link href="/trackorder" className="prf-edit-btn prf-link-btn">
                  Track / Cancel Orders
                </Link>
              </div>

              {ordersLoading ? (
                <p className="prf-orders-state">Loading your orders…</p>
              ) : orders.length === 0 ? (
                <div className="prf-orders-empty">
                  <p className="prf-orders-empty-icon">📦</p>
                  <p>No orders yet.</p>
                  <Link href="/shop" className="prf-orders-shop-link">Start Shopping</Link>
                </div>
              ) : (
                <div className="prf-orders-list">
                  {orders.map((order) => (
                    <div key={order.orderId} className="prf-orders-item">
                      <img src={order.image} alt={order.name} className="prf-orders-item-img" />
                      <div className="prf-orders-item-info">
                        <p className="prf-orders-item-name">{order.name}</p>
                        <p className="prf-orders-item-seller">{order.seller}</p>
                        <p className="prf-orders-item-date">
                          {new Date(order.date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="prf-orders-item-right">
                        <span className={`prf-orders-status prf-orders-status-${order.status.toLowerCase().replace(/\s/g, "-")}`}>
                          {order.status}
                        </span>
                        <p className="prf-orders-item-qty">Qty: {order.quantity}</p>
                        <p className="prf-orders-item-price">
                          ₹{order.payable.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "wishlist" && (
            <div className="prf-card">
              <div className="prf-card-header">
                <div className="prf-card-title">
                  <span className="prf-card-ico"><Icon name="heart" size={20} /></span>
                  <div>
                    <h2>My Wishlist</h2>
                    <p>Products and services you have saved for later.</p>
                  </div>
                </div>
                <Link href="/shop" className="prf-edit-btn prf-link-btn">
                  Continue Shopping
                </Link>
              </div>

              {wishLoading ? (
                <p className="prf-orders-state">Loading your wishlist…</p>
              ) : wishItems.length === 0 ? (
                <div className="prf-orders-empty">
                  <p className="prf-orders-empty-icon">💚</p>
                  <p>Your wishlist is empty.</p>
                  <Link href="/shop" className="prf-orders-shop-link">Start Shopping</Link>
                </div>
              ) : (
                <div className="prf-orders-list">
                  {wishItems.map((item) => (
                    <div key={item.wishlistItemId} className="prf-orders-item">
                      <img src={item.img} alt={item.name} className="prf-orders-item-img" />
                      <div className="prf-orders-item-info">
                        <Link
                          href={item.type === "service" ? `/services/${item.slug}` : `/shop/${item.slug}`}
                          className="prf-orders-item-name prf-wish-name"
                        >
                          {item.name}
                        </Link>
                        <p className="prf-orders-item-seller">{item.seller}</p>
                        <p className="prf-orders-item-price">
                          ₹{item.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="prf-orders-item-right prf-wish-actions">
                        <button
                          type="button"
                          className="prf-wish-cart-btn"
                          onClick={() => handleWishAddToCart(item)}
                        >
                          {item.type === "service" ? "Book Now" : "Add to Cart"}
                        </button>
                        <button
                          type="button"
                          className="prf-wish-remove-btn"
                          onClick={() => handleWishRemove(item.wishlistItemId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "addresses" && (
            <div className="prf-card">
              <div className="prf-card-header">
                <div className="prf-card-title">
                  <span className="prf-card-ico"><Icon name="pin" size={20} /></span>
                  <div>
                    <h2>My Addresses</h2>
                    <p>Your current delivery address.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="prf-edit-btn"
                  onClick={() => {
                    setTab("profile");
                    setEditing(true);
                  }}
                >
                  {user.address ? "Edit Address" : "Add Address"}
                </button>
              </div>

              {user.address || user.city || user.state || user.pincode ? (
                <div className="prf-addr-card">
                  <span className="prf-addr-ico"><Icon name="pin" size={20} /></span>
                  <div className="prf-addr-info">
                    <span className="prf-addr-badge">Current Address</span>
                    <p className="prf-addr-name">{user.name}</p>
                    <p className="prf-addr-line">{user.address}</p>
                    <p className="prf-addr-line">
                      {[user.city, user.state].filter(Boolean).join(", ")}
                      {user.pincode ? ` - ${user.pincode}` : ""}
                    </p>
                    {user.phone && <p className="prf-addr-phone">Phone: {user.phone}</p>}
                  </div>
                </div>
              ) : (
                <div className="prf-orders-empty">
                  <p className="prf-orders-empty-icon">📍</p>
                  <p>You haven't added an address yet.</p>
                </div>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div className="prf-card">
              <div className="prf-card-header">
                <div className="prf-card-title">
                  <span className="prf-card-ico"><Icon name="star" size={20} /></span>
                  <div>
                    <h2>My Reviews</h2>
                    <p>Ratings and reviews you have given on your orders.</p>
                  </div>
                </div>
                <Link href="/trackorder" className="prf-edit-btn prf-link-btn">
                  Rate an Order
                </Link>
              </div>

              {reviewsLoading ? (
                <p className="prf-orders-state">Loading your reviews…</p>
              ) : myReviews.length === 0 ? (
                <div className="prf-orders-empty">
                  <p className="prf-orders-empty-icon">⭐</p>
                  <p>You haven't reviewed anything yet.</p>
                  <Link href="/trackorder" className="prf-orders-shop-link">Go to My Orders</Link>
                </div>
              ) : (
                <div className="prf-orders-list">
                  {myReviews.map((rv) => (
                    <div key={rv.id} className="prf-orders-item prf-rev-item">
                      <img
                        src={rv.product?.image_url || "https://placehold.co/300x300?text=No+Image"}
                        alt={rv.product?.name || "Product"}
                        className="prf-orders-item-img"
                      />
                      <div className="prf-orders-item-info">
                        {rv.product?.sku ? (
                          <Link href={`/shop/${rv.product.sku}`} className="prf-orders-item-name prf-wish-name">
                            {rv.product?.name}
                          </Link>
                        ) : (
                          <p className="prf-orders-item-name">{rv.product?.name || "Product no longer available"}</p>
                        )}
                        <div className="prf-rev-stars" aria-label={`${rv.rating} out of 5`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className={n <= rv.rating ? "on" : ""}>★</span>
                          ))}
                        </div>
                        {rv.comment && <p className="prf-rev-comment">{rv.comment}</p>}
                        <p className="prf-orders-item-date">
                          {new Date(rv.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="prf-right">
          <div className="prf-right-top">
            <div className="prf-avatar-wrap">
              <div className="prf-avatar prf-avatar-lg">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : initial}
              </div>
              <button
                type="button"
                className="prf-avatar-cam"
                aria-label="Change photo"
                disabled={uploadingPhoto}
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="camera" size={13} />
              </button>
            </div>
            <p className="prf-user-name">{user.name}</p>
            <p className="prf-user-email">{user.email}</p>
            <span className="prf-verified-badge">✔ Verified Account</span>
            <button
              type="button"
              className="prf-outline-btn prf-change-photo"
              disabled={uploadingPhoto}
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="camera" size={16} /> {uploadingPhoto ? "Uploading..." : "Change Photo"}
            </button>
          </div>

          <div className="prf-stats">
            <div className="prf-stat">
              <span className="prf-stat-ico" style={{ color: "#e0a800" }}><Icon name="crown" size={22} /></span>
              <div><small>Member Since</small><strong>{memberSince}</strong></div>
            </div>
            <div className="prf-stat">
              <span className="prf-stat-ico"><Icon name="bag" size={22} /></span>
              <div><small>Total Orders</small><strong>{stats.orders}</strong></div>
            </div>
            <div className="prf-stat">
              <span className="prf-stat-ico" style={{ color: "#e03131" }}><Icon name="heart" size={22} /></span>
              <div><small>Wishlist Items</small><strong>{stats.wishlist}</strong></div>
            </div>
            <div className="prf-stat">
              <span className="prf-stat-ico" style={{ color: "#e0a800" }}><Icon name="star" size={22} /></span>
              <div><small>Reviews Given</small><strong>{stats.reviews}</strong></div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}