"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import "./store.css";

export default function Store() {
  const [seller, setSeller] = useState(null);
  const [form, setForm] = useState({
    store_name: "",
    full_name: "",
    email: "",
    phone: "",
    location: "",
    seller_type: "",
    gst_number: "",
    business_registration_number: "",
    pan_number: "",
    business_address: "",
    profile_image_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
          seller_type: s.seller_type || "",
          gst_number: s.gst_number || "",
          business_registration_number: s.business_registration_number || "",
          pan_number: s.pan_number || "",
          business_address: s.business_address || "",
          profile_image_url: s.profile_image_url || "",
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

  const persist = async (payload, successMessage) => {
    try {
      const res = await api.patch("/sellers/me", payload);
      const updatedSeller = res.data.data?.seller;
      if (updatedSeller) {
        const mergedUser = { ...getCurrentUser(), ...updatedSeller };
        localStorage.setItem("admin_auth_user", JSON.stringify(mergedUser));
        window.dispatchEvent(new Event("storage"));
        setSeller(mergedUser);
      }
      setSaveMessage(successMessage);
      setSaveError("");
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || "Failed to save changes.");
      setSaveMessage("");
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setSaveMessage("");
    setSaveError("");
    try {
      const url = await uploadImage(file);
      handleChange("profile_image_url", url);
      await persist({ profile_image_url: url }, "Business picture updated.");
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || "Failed to upload picture.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await persist(
      { business_address: form.business_address },
      "Store details updated successfully."
    );
    setSaving(false);
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

      <div className="store-card store-profile-card">
        <div className="store-card-title">
          <span>🖼️</span>
          <h3>Profile</h3>
        </div>
        <div className="store-profile-row">
          <div className="store-avatar">
            {form.profile_image_url ? (
              <img src={form.profile_image_url} alt="Business" />
            ) : (
              <span className="store-avatar-placeholder">
                {(form.store_name || "S").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <label className="store-upload-btn">
              {uploadingPhoto ? "Uploading…" : "Upload Business Picture"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
              />
            </label>
            <p className="store-hint">Shown on your store profile and listings.</p>
          </div>
        </div>
      </div>

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
                <input type="text" value={form.store_name} disabled className="store-locked-input" />
              </div>

              <div className="store-field">
                <label>Full Name</label>
                <input type="text" value={form.full_name} disabled className="store-locked-input" />
              </div>

              <div className="store-field">
                <label>Email</label>
                <input type="email" value={form.email} disabled className="store-locked-input" />
              </div>

              <div className="store-field">
                <label>Seller Type</label>
                <input
                  type="text"
                  value={form.seller_type === "service" ? "Service Seller" : "Product Seller"}
                  disabled
                  className="store-locked-input"
                />
              </div>

              <span className="store-hint">
                These details were set during signup and cannot be edited here. Contact support if
                any of them need to change.
              </span>
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
                <input type="tel" value={form.phone} disabled className="store-locked-input" />
              </div>

              <div className="store-field">
                <label>Location</label>
                <input type="text" value={form.location} disabled className="store-locked-input" />
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

            <div className="store-card">
              <div className="store-card-title">
                <span>🧾</span>
                <h3>Registration Details</h3>
              </div>

              <div className="store-field">
                <label>GST Number</label>
                <input
                  type="text"
                  value={form.gst_number || "—"}
                  disabled
                  className="store-locked-input"
                />
              </div>

              <div className="store-field">
                <label>Business Registration Number</label>
                <input
                  type="text"
                  value={form.business_registration_number || "—"}
                  disabled
                  className="store-locked-input"
                />
              </div>

              <div className="store-field">
                <label>PAN Number</label>
                <input
                  type="text"
                  value={form.pan_number || "—"}
                  disabled
                  className="store-locked-input"
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