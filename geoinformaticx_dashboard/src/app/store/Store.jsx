"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import "./store.css";

export default function Store() {
  const [seller, setSeller] = useState(null);
  const [form, setForm] = useState({
    store_name: "",
    full_name: "",
    email: "",
    phone: "",
    location: "",
    business_address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        const s = res.data.data?.user;
        setSeller(s);
        setForm({
          store_name: s.store_name || "",
          full_name: s.full_name || "",
          email: s.email || "",
          phone: s.phone || "",
          location: s.location || "",
          business_address: s.business_address || "",
        });
      } catch (err) {
        console.error("Failed to load store profile:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage("");
    setSaveError("");
    try {
      const res = await api.patch("/sellers/me", {
        store_name: form.store_name,
        full_name: form.full_name,
        phone: form.phone,
        location: form.location,
        business_address: form.business_address,
      });
      const updatedSeller = res.data.data?.seller;
      if (updatedSeller) {
        const mergedUser = { ...getCurrentUser(), ...updatedSeller };
        localStorage.setItem("admin_auth_user", JSON.stringify(mergedUser));
        window.dispatchEvent(new Event("storage"));
        setSeller(mergedUser);
      }
      setSaveMessage("Store details updated successfully.");
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="store-page">
        <p>Loading your store details…</p>
      </div>
    );
  }

  return (
    <div className="store-page">
      <h1 className="store-title">My Store</h1>
      <p className="store-subtitle">Manage your business profile and contact details.</p>

      {saveMessage && <div className="store-success">{saveMessage}</div>}
      {saveError && <div className="store-error">{saveError}</div>}

      <form onSubmit={handleSave}>
        <div className="store-grid">
          <div>
            <div className="store-card">
              <div className="store-card-title">
                <span>🏬</span>
                <h3>Business Information</h3>
              </div>

              <div className="store-field">
                <label>Business Name</label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={(e) => handleChange("store_name", e.target.value)}
                />
              </div>

              <div className="store-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                />
              </div>

              <div className="store-field">
                <label>Email</label>
                <input type="email" value={form.email} disabled className="store-locked-input" />
                <span className="store-hint">Email cannot be changed. Contact support if needed.</span>
              </div>
            </div>
          </div>

          <div>
            <div className="store-card">
              <div className="store-card-title">
                <span>📍</span>
                <h3>Contact & Location</h3>
              </div>

              <div className="store-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>

              <div className="store-field">
                <label>Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                />
              </div>

              <div className="store-field">
                <label>Business Address</label>
                <textarea
                  rows={4}
                  value={form.business_address}
                  onChange={(e) => handleChange("business_address", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="store-actions">
          <button type="submit" className="store-save-btn" disabled={saving}>
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}