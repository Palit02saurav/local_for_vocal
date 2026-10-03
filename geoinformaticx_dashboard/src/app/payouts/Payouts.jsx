"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import "./payouts.css";

const EMPTY = {
  account_holder_name: "",
  bank_name: "",
  branch_name: "",
  account_number: "",
  confirm_account_number: "",
  ifsc_code: "",
  account_type: "Savings",
  upi_id: "",
};

const ACCOUNT_MAX = 18;
const onlyDigits = (v) => v.replace(/\D/g, "").slice(0, ACCOUNT_MAX);

export default function Payouts() {
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    setRole(user?.role || null);
    if (user?.role !== "SELLER") {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [profileRes, accountRes] = await Promise.all([
          api.get("/sellers/me"),
          api.get("/payout-accounts/me"),
        ]);
        setProfile(profileRes.data.data?.seller || null);
        const acc = accountRes.data.data?.account;
        if (acc) setSaved(acc);
      } catch (err) {
        setError(err.message || "Failed to load payout details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const locked = saved && saved.status !== "Rejected";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    setMessage("");
    setError("");

    const acct = form.account_number.replace(/\s+/g, "");
    if (!/^\d{9,18}$/.test(acct)) return setError("Account number must be 9 to 18 digits.");
    if (acct !== form.confirm_account_number.replace(/\s+/g, "")) return setError("Account numbers do not match.");
    if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(form.ifsc_code.trim())) return setError("Enter a valid IFSC code (e.g. SBIN0001234).");

    setSaving(true);
    try {
      const res = await api.put("/payout-accounts/me", form);
      setSaved(res.data.data?.account || null);
      setForm((f) => ({ ...f, account_number: "", confirm_account_number: "" }));
      setMessage("Payout details saved. They are pending verification.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="payouts-page"><p>Loading...</p></div>;

  if (role !== "SELLER") {
    return (
      <div className="payouts-page">
        <h1 className="payouts-title">Payouts &amp; Earnings</h1>
        <p className="payouts-subtitle">This section is not available for your account yet.</p>
      </div>
    );
  }

  return (
    <div className="payouts-page">
      <h1 className="payouts-title">Payouts &amp; Earnings</h1>
      <p className="payouts-subtitle">
        {locked
          ? "Your bank details are on file. Earnings will be sent to this account."
          : "Add your bank details so we know where to send your earnings. You can submit them only once, so please double-check."}
      </p>

      {message && <div className="payouts-success">{message}</div>}
      {error && <div className="payouts-error">{error}</div>}

      <div className="payouts-grid">
        <form className="payouts-card" onSubmit={handleSubmit}>
          <div className="payouts-card-head">
            <h2>Bank account details</h2>
            {saved && (
              <span className={`payouts-badge ${saved.status.toLowerCase()}`}>{saved.status}</span>
            )}
          </div>

          {locked ? (
            <>
              <dl className="payouts-readonly">
                <dt>Account holder</dt><dd>{saved.account_holder_name}</dd>
                <dt>Bank</dt><dd>{saved.bank_name}</dd>
                <dt>Branch</dt><dd>{saved.branch_name || "—"}</dd>
                <dt>Account number</dt><dd>{saved.account_number_masked}</dd>
                <dt>IFSC code</dt><dd>{saved.ifsc_code}</dd>
                <dt>Account type</dt><dd>{saved.account_type}</dd>
                <dt>UPI ID</dt><dd>{saved.upi_id || "—"}</dd>
              </dl>
              <p className="payouts-saved-note">
                Your payout details are submitted and locked. To make a change, please contact support.
              </p>
            </>
          ) : (
            <>
          {saved?.status === "Rejected" && (
            <p className="payouts-error">
              Your bank details were rejected. Please check them and submit again.
            </p>
          )}
          <label>Account holder name *
            <input value={form.account_holder_name} onChange={(e) => handleChange("account_holder_name", e.target.value)} required />
          </label>

          <div className="payouts-row">
            <label>Bank name *
              <input value={form.bank_name} onChange={(e) => handleChange("bank_name", e.target.value)} required />
            </label>
            <label>Branch (optional)
              <input value={form.branch_name} onChange={(e) => handleChange("branch_name", e.target.value)} />
            </label>
          </div>

          <div className="payouts-row">
            <label>Account number *
            <input
                inputMode="numeric"
                value={form.account_number}
                onChange={(e) => handleChange("account_number", onlyDigits(e.target.value))}
                placeholder="Enter 9 to 18 digit account number"
                maxLength={ACCOUNT_MAX}
                minLength={9}
                autoComplete="off"
                required
            />
            </label>
            <label>Confirm account number *
            <input
                inputMode="numeric"
                value={form.confirm_account_number}
                onChange={(e) => handleChange("confirm_account_number", onlyDigits(e.target.value))}
                onPaste={(e) => e.preventDefault()}
                placeholder="Re-enter account number"
                maxLength={ACCOUNT_MAX}
                minLength={9}
                autoComplete="off"
                required
            />
            </label>
          </div>

          <div className="payouts-row">
            <label>IFSC code *
              <input value={form.ifsc_code} onChange={(e) => handleChange("ifsc_code", e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" maxLength={11} required />
            </label>
            <label>Account type *
              <select value={form.account_type} onChange={(e) => handleChange("account_type", e.target.value)}>
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </select>
            </label>
          </div>

          <label>UPI ID (optional)
            <input value={form.upi_id} onChange={(e) => handleChange("upi_id", e.target.value)} placeholder="name@bank" />
          </label>

          <button type="submit" className="payouts-save-btn" disabled={saving}>
            {saving ? "Saving..." : "Save payout details"}
          </button>
            </>
          )}
        </form>

        <div className="payouts-card">
          <h2>Business details (from your profile)</h2>
          <dl className="payouts-readonly">
            <dt>Seller / Store</dt><dd>{profile?.store_name || profile?.full_name || "—"}</dd>
            <dt>PAN</dt><dd>{profile?.pan_number || "—"}</dd>
            <dt>GSTIN</dt><dd>{profile?.gst_number || "—"}</dd>
            <dt>Email</dt><dd>{profile?.email || "—"}</dd>
            <dt>Phone</dt><dd>{profile?.phone || "—"}</dd>
          </dl>
          <p className="payouts-hint">To change these, update them in My Store.</p>
        </div>
      </div>
    </div>
  );
}