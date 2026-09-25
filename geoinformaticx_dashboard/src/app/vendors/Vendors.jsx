"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import "../products/products.css";

function statusPillClass(status) {
  if (status === "Approved") return "pp-pill-active";
  if (status === "Rejected") return "pp-pill-out";
  return "pp-pill-low";
}

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadVendors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/vendors");
      setVendors(res.data.data?.vendors || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter(
      (v) =>
        v.full_name?.toLowerCase().includes(q) ||
        v.phone?.toLowerCase().includes(q)
    );
  }, [vendors, searchQuery]);

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>All Street Vendors</h1>
          <p>Every street vendor registered on your marketplace.</p>
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
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="pp-table-wrapper">
        {loading ? (
          <div className="pp-state-msg">Loading vendors…</div>
        ) : error ? (
          <div className="pp-state-msg pp-state-error">
            {error} <button className="pp-retry-btn" onClick={loadVendors}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pp-state-msg">No street vendors found.</div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>ID Type</th>
                <th>ID Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td className="pp-product-name">{v.full_name}</td>
                  <td>{v.phone}</td>
                  <td>{v.address || "—"}</td>
                  <td>{v.id_type === "pan" ? "PAN" : "Aadhaar"}</td>
                  <td>{v.id_number}</td>
                  <td>
                    <span className={`pp-pill ${statusPillClass(v.approval_status)}`}>
                      {v.approval_status}
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