"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import "../products/products.css"

function statusPillClass(status) {
  if (status === "Approved") return "pp-pill-active";
  if (status === "Rejected") return "pp-pill-out";
  return "pp-pill-low"; // Pending
}

export default function Sellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadSellers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/sellers");
      setSellers(res.data.data?.sellers || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return sellers;
    const q = searchQuery.toLowerCase();
    return sellers.filter(
      (s) =>
        s.store_name?.toLowerCase().includes(q) ||
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [sellers, searchQuery]);

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>All Sellers</h1>
          <p>Every seller registered on your marketplace.</p>
        </div>
      </div>

      <div className="pp-toolbar">
        <div className="pp-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by business, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="pp-table-wrapper">
        {loading ? (
          <div className="pp-state-msg">Loading sellers…</div>
        ) : error ? (
          <div className="pp-state-msg pp-state-error">
            {error} <button className="pp-retry-btn" onClick={loadSellers}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pp-state-msg">No sellers found.</div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Type</th>
                <th>GST Number</th>
                <th>Reg. Number</th>
                <th>PAN Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="pp-product-name">{s.store_name || "—"}</td>
                  <td>{s.full_name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone || "—"}</td>
                  <td>{s.location || "—"}</td>
                  <td>
                    <span className={`pp-pill ${s.seller_type === "service" ? "pp-pill-low" : "pp-pill-active"}`}>
                      {s.seller_type === "service" ? "Service" : "Product"}
                    </span>
                  </td>
                  <td>{s.gst_number || "—"}</td>
                  <td>{s.business_registration_number || "—"}</td>
                  <td>{s.pan_number || "—"}</td>
                  <td>
                    <span className={`pp-pill ${statusPillClass(s.approval_status)}`}>
                      {s.approval_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}