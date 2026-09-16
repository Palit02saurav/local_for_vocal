"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import "../products/products.css";

export default function Users() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/customers");
      setCustomers(res.data.data?.customers || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Users / Customers</h1>
          <p>Everyone who signed up on your storefront.</p>
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
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="pp-table-wrapper">
        {loading ? (
          <div className="pp-state-msg">Loading users…</div>
        ) : error ? (
          <div className="pp-state-msg pp-state-error">
            {error} <button className="pp-retry-btn" onClick={loadCustomers}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pp-state-msg">No users found.</div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="pp-product-name">{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || "—"}</td>
                  <td className="pp-date-cell">
                    {new Date(c.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td>
                    <span className={`pp-pill ${c.is_active ? "pp-pill-active" : "pp-pill-out"}`}>
                      {c.is_active ? "Active" : "Inactive"}
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