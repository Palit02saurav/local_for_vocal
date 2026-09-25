"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, signOut } from "@/lib/auth";
import { getProductOrders } from "@/lib/orders";
import "./profile.css";
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const sidebarItems = [
  { key: "profile", label: "My Profile", icon: "user" },
  { key: "orders", label: "My Orders", icon: "bag", href: "/trackorder" },
  { key: "wishlist", label: "Wishlist", icon: "heart", href: "/wishlist" },
  { key: "addresses", label: "Addresses", icon: "pin" },
  { key: "payment", label: "Payment Methods", icon: "card" },
  { key: "reviews", label: "My Reviews", icon: "star" },
  { key: "notifications", label: "Notifications", icon: "bell" },
  { key: "settings", label: "Account Settings", icon: "gear" },
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
        dob: form.dob,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      }, { withCredentials: true });
      setUser(data.data?.user);
      setEditing(false);
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

  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const openOrdersModal = async () => {
    setShowOrdersModal(true);
    setOrdersLoading(true);
    setOrders(await getProductOrders());
    setOrdersLoading(false);
  };

  const closeOrdersModal = () => setShowOrdersModal(false);

  useEffect(() => {
    document.body.style.overflow = showOrdersModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showOrdersModal]);

  if (!user) return null;

  const initial = user.name?.charAt(0).toUpperCase() || "?";

  return (
    <main className="prf-page">
      <div className="prf-breadcrumb">
        <Link href="/">Home</Link> <span>›</span> <span>My Profile</span>
      </div>

      {/* Hero */}
      <div className="prf-hero">
        <h1>My Profile</h1>
        <div className="prf-hero-images">
          <div className="prf-hero-panel">
            <img
              src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=500&q=80"
              alt="Pottery craft"
            />
          </div>
          <div className="prf-hero-panel">
            <img
              src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80"
              alt="Handicraft decor"
            />
          </div>
        </div>
      </div>

      <div className="prf-layout">
        {/* Sidebar */}
        <aside className="prf-sidebar">
          <div className="prf-sidebar-user">
            <div className="prf-avatar">{initial}</div>
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
            {sidebarItems.map((item, i) => (
              <Link
                key={item.key}
                href={item.href || "#"}
                className={`prf-nav-item ${i === 0 ? "active" : ""}`}
                onClick={(e) => {
                  if (item.key === "orders") {
                    e.preventDefault();
                    openOrdersModal();
                  }
                }}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
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
          <div className="prf-card">
            <div className="prf-card-header">
              <h2>Personal Information</h2>
              <button
                type="button"
                className="prf-edit-btn"
                onClick={() => setEditing((e) => !e)}
              >
                ✎ {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <form className="prf-form" onSubmit={handleSave}>
              <div className="prf-form-row">
                <div className="prf-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    disabled={!editing}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="prf-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled={!editing}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="prf-form-row">
                <div className="prf-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={form.phone}
                    disabled={!editing}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div className="prf-field">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    disabled={!editing}
                    onChange={(e) => handleChange("dob", e.target.value)}
                  />
                </div>
              </div>

              <div className="prf-field">
                <label>Address</label>
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
                  <label>City</label>
                  <input
                    type="text"
                    value={form.city}
                    disabled={!editing}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="prf-field">
                  <label>State</label>
                  <select
                    value={form.state}
                    disabled={!editing}
                    onChange={(e) => handleChange("state", e.target.value)}
                  >
                    <option value="">Select state</option>
                    <option>West Bengal</option>
                    <option>Tamil Nadu</option>
                    <option>Maharashtra</option>
                    <option>Karnataka</option>
                    <option>Delhi</option>
                  </select>
                </div>
                <div className="prf-field">
                  <label>Pincode</label>
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
        </div>
      </div>

      {showOrdersModal && typeof document !== "undefined" &&
        createPortal(
          <div className="prf-orders-overlay" onClick={closeOrdersModal}>
            <div className="prf-orders-modal" onClick={(e) => e.stopPropagation()}>
              <div className="prf-orders-modal-header">
                <h3>My Orders</h3>
                <button className="prf-orders-close" onClick={closeOrdersModal} aria-label="Close">✕</button>
              </div>

              {ordersLoading ? (
                <p className="prf-orders-state">Loading your orders…</p>
              ) : orders.length === 0 ? (
                <div className="prf-orders-empty">
                  <p className="prf-orders-empty-icon">📦</p>
                  <p>No orders yet.</p>
                  <Link href="/shop" className="prf-orders-shop-link" onClick={closeOrdersModal}>
                    Start Shopping
                  </Link>
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
                          ₹{(order.price * order.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="prf-orders-modal-footer">
                <Link href="/trackorder" className="prf-orders-track-link" onClick={closeOrdersModal}>
                  Full order tracking & cancellation →
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
} 