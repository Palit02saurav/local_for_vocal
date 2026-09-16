"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import "./profileModal.css";

export default function ProfileModal({ onClose }) {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/sellers/me");
        setSeller(res.data.data?.seller);
      } catch (err) {
        setLoadError(err.message || "Could not load profile.");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!newPassword || newPassword.length < 4) {
      setPwError("New password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      await api.patch("/sellers/me/password", { newPassword });
      setPwSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err.message || "Failed to update password.");
    }
    setPwLoading(false);
  };

  const businessFields = seller
    ? [
        { label: "Store Name", value: seller.store_name },
        { label: "Email", value: seller.email },
        { label: "Phone", value: seller.phone },
        { label: "Location", value: seller.location },
        { label: "Business Address", value: seller.business_address },
        { label: "Seller Type", value: seller.seller_type },
        { label: "GST Number", value: seller.gst_number },
        { label: "Business Reg. Number", value: seller.business_registration_number },
        { label: "PAN Number", value: seller.pan_number },
        { label: "Approval Status", value: seller.approval_status },
      ].filter((f) => f.value)
    : [];

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>My Profile</h2>
          <button className="profile-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="profile-modal-loading">Loading...</div>
        ) : loadError ? (
          <div className="profile-modal-error">{loadError}</div>
        ) : (
          <div className="profile-modal-body">
            <div className="profile-modal-name-row">
              <div className="profile-modal-avatar">
                {seller?.full_name ? seller.full_name.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <div className="profile-modal-name">{seller?.full_name}</div>
                <div className="profile-modal-subtitle">Seller</div>
              </div>
            </div>

            <div className="profile-modal-section">
              <h3>Business Details</h3>
              <div className="profile-modal-details-grid">
                {businessFields.map((f) => (
                  <div key={f.label} className="profile-modal-detail-item">
                    <span className="profile-modal-detail-label">{f.label}</span>
                    <span className="profile-modal-detail-value">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-modal-section">
              <h3>Password</h3>
              <p className="profile-modal-default-pw-note">
                Your current default password is <strong>0000</strong>. Set a new password below to
                replace it.
              </p>

              <form className="profile-modal-pw-form" onSubmit={handleChangePassword}>
                <label>
                  New Password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </label>
                <label>
                  Confirm New Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </label>

                {pwError && <div className="profile-modal-pw-error">{pwError}</div>}
                {pwSuccess && <div className="profile-modal-pw-success">{pwSuccess}</div>}

                <button type="submit" className="profile-modal-pw-submit" disabled={pwLoading}>
                  {pwLoading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}