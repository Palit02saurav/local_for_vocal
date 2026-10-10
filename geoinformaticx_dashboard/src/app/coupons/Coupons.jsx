"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import "../products/products.css";
import "./coupons.css";

const EMPTY_FORM = {
  code: "", title: "", description: "",
  discount_type: "PERCENT", discount_value: "",
  min_order_amount: "", max_discount_amount: "",
  usage_limit: "", start_date: "", end_date: "",
};

const TABS = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admin" },
  { key: "seller", label: "Sellers" },
  { key: "service", label: "Service Providers" },
];

const creatorType = (c) =>
  c.created_by_role === "ADMIN" ? "admin" : c.seller?.seller_type === "service" ? "service" : "seller";

const creatorName = (c) =>
  c.created_by_role === "ADMIN" ? "Admin" : c.seller?.store_name || c.seller?.full_name || "Seller";

const creatorTag = { admin: "Admin", seller: "Seller", service: "Service Provider" };

const discountText = (c) =>
  c.discount_type === "PERCENT" ? `${Number(c.discount_value)}% off` : `₹${Number(c.discount_value)} off`;

const fmtDate = (d) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const validity = (c) =>
  !c.start_date && !c.end_date ? "No expiry" : `${fmtDate(c.start_date)} – ${fmtDate(c.end_date)}`;

const isExpired = (c) => c.end_date && c.end_date < new Date().toLocaleDateString("en-CA");

export default function Coupons() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "SUPER_ADMIN";

  const loadCoupons = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/coupons");
      setCoupons(res.data.data?.coupons || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = getCurrentUser();
    if (u?.role === "VENDOR") {
      router.replace("/");
      return;
    }
    setUser(u);
    loadCoupons();
  }, []);

  const visible = useMemo(
    () => (tab === "all" ? coupons : coupons.filter((c) => creatorType(c) === tab)),
    [coupons, tab]
  );

  const countFor = (key) => (key === "all" ? coupons.length : coupons.filter((c) => creatorType(c) === key).length);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await api.post("/coupons", form);
      setShowForm(false);
      loadCoupons();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c) => {
    try {
      await api.patch(`/coupons/${c.id}/status`, { status: c.status === "Active" ? "Inactive" : "Active" });
      loadCoupons();
    } catch (err) {
      alert(err.message);
    }
  };

  const removeCoupon = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await api.delete(`/coupons/${c.id}`);
      loadCoupons();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Coupons &amp; Offers</h1>
          <p>
            {isAdmin
              ? "Coupons created by you, sellers and service providers."
              : "Create and manage discount coupons for your customers."}
          </p>
        </div>
        <button className="pp-add-btn" onClick={openForm}>+ Create Coupon</button>
      </div>

      {isAdmin && (
        <div className="cp-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`cp-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} <span className="cp-tab-count">{countFor(t.key)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="pp-table-wrapper" style={{ marginTop: 20 }}>
        {loading ? (
          <div className="pp-state-msg">Loading coupons…</div>
        ) : error ? (
          <div className="pp-state-msg pp-state-error">
            {error} <button className="pp-retry-btn" onClick={loadCoupons}>Retry</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="pp-state-msg">No coupons yet.</div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Offer</th>
                <th>Min Order</th>
                <th>Used</th>
                <th>Validity</th>
                {isAdmin && <th>Created By</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const expired = isExpired(c);
                return (
                  <tr key={c.id}>
                    <td><span className="cp-code">{c.code}</span></td>
                    <td>
                      <div className="pp-product-name">{c.title}</div>
                      <div className="cp-sub">
                        {discountText(c)}
                        {c.max_discount_amount ? ` (up to ₹${Number(c.max_discount_amount)})` : ""}
                      </div>
                    </td>
                    <td>{Number(c.min_order_amount) > 0 ? `₹${Number(c.min_order_amount)}` : "—"}</td>
                    <td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                    <td className="pp-date-cell">{validity(c)}</td>
                    {isAdmin && (
                      <td>
                        <div>{creatorName(c)}</div>
                        <span className={`cp-by cp-by-${creatorType(c)}`}>{creatorTag[creatorType(c)]}</span>
                      </td>
                    )}
                    <td>
                      <span
                        className={`pp-pill ${
                          expired ? "pp-pill-out" : c.status === "Active" ? "pp-pill-active" : "pp-pill-low"
                        }`}
                      >
                        {expired ? "Expired" : c.status}
                      </span>
                    </td>
                    <td>
                      <div className="cp-actions">
                        <button onClick={() => toggleStatus(c)}>
                          {c.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        <button className="cp-danger" onClick={() => removeCoupon(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="cp-overlay" onClick={() => setShowForm(false)}>
          <form className="cp-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2>Create Coupon</h2>
            {formError && <div className="cp-form-error">{formError}</div>}

            <div className="cp-grid">
              <label>
                Coupon Code *
                <input value={form.code} onChange={setField("code")} placeholder="WELCOME10" maxLength={30} required />
              </label>
              <label>
                Title *
                <input value={form.title} onChange={setField("title")} placeholder="Welcome offer" maxLength={120} required />
              </label>

              <label className="cp-full">
                Description
                <input value={form.description} onChange={setField("description")} maxLength={255} />
              </label>

              <label>
                Discount Type
                <select value={form.discount_type} onChange={setField("discount_type")}>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat amount (₹)</option>
                </select>
              </label>
              <label>
                Discount Value *
                <input type="number" min="0" step="0.01" value={form.discount_value} onChange={setField("discount_value")} required />
              </label>

              <label>
                Min Order Amount (₹)
                <input type="number" min="0" step="0.01" value={form.min_order_amount} onChange={setField("min_order_amount")} />
              </label>
              {form.discount_type === "PERCENT" && (
                <label>
                  Max Discount (₹)
                  <input type="number" min="0" step="0.01" value={form.max_discount_amount} onChange={setField("max_discount_amount")} />
                </label>
              )}

              <label>
                Usage Limit
                <input type="number" min="1" value={form.usage_limit} onChange={setField("usage_limit")} placeholder="Unlimited" />
              </label>
              <label>
                Start Date
                <input type="date" value={form.start_date} onChange={setField("start_date")} />
              </label>
              <label>
                End Date
                <input type="date" value={form.end_date} onChange={setField("end_date")} />
              </label>
            </div>

            <div className="cp-modal-actions">
              <button type="button" className="cp-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="pp-add-btn" disabled={saving}>
                {saving ? "Saving…" : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}