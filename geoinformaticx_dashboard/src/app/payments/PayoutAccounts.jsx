"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import "../products/products.css";

const pillClass = (s) =>
  s === "Verified" ? "pp-pill-active" : s === "Rejected" ? "pp-pill-out" : "pp-pill-low";

const btn = (color) => ({
  color, fontWeight: 700, fontSize: 12, border: `1px solid ${color}`,
  borderRadius: 6, padding: "5px 10px", background: "white", cursor: "pointer",
});

export default function PayoutAccounts({ sellerType, requestsOnly = false, title, subtitle }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { seller_type: sellerType };
      if (requestsOnly) params.status = "Pending";
      const res = await api.get("/payout-accounts", { params });
      setAccounts(res.data.data?.accounts || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load payout accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerType, requestsOnly]);

  const decide = async (id, action) => {
    setActioningId(id);
    try {
      await api.patch(`/payout-accounts/${id}/${action}`);
      if (requestsOnly) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      } else {
        const status = action === "verify" ? "Verified" : "Rejected";
        setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to ${action}.`);
    }
    setActioningId(null);
  };

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.seller?.store_name?.toLowerCase().includes(q) ||
        a.seller?.full_name?.toLowerCase().includes(q) ||
        a.account_holder_name?.toLowerCase().includes(q) ||
        a.account_number?.includes(q)
    );
  }, [accounts, search]);

  const cols = requestsOnly ? 11 : 10;

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
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
            placeholder="Search by business, name or account number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="pp-table-wrapper">
        <table className="pp-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Owner</th>
              <th>Email / Phone</th>
              <th>Account Holder</th>
              <th>Bank / Branch</th>
              <th>Account Number</th>
              <th>IFSC</th>
              <th>Type</th>
              <th>UPI ID</th>
              <th>Status</th>
              {requestsOnly && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={cols} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : error ? (
              <tr>
                <td colSpan={cols} style={{ textAlign: "center", padding: 24, color: "#e63946" }}>
                  {error} <button className="pp-retry-btn" onClick={load}>Retry</button>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={cols} style={{ textAlign: "center", padding: 24, color: "#888" }}>
                  {requestsOnly ? "No pending payout requests." : "No bank accounts found."}
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td className="pp-product-name">{a.seller?.store_name || "—"}</td>
                  <td>{a.seller?.full_name || "—"}</td>
                  <td>{a.seller?.email}<br />{a.seller?.phone || ""}</td>
                  <td>{a.account_holder_name}</td>
                  <td>{a.bank_name}<br />{a.branch_name || ""}</td>
                  <td>{a.account_number}</td>
                  <td>{a.ifsc_code}</td>
                  <td>{a.account_type}</td>
                  <td>{a.upi_id || "—"}</td>
                  <td><span className={`pp-pill ${pillClass(a.status)}`}>{a.status}</span></td>
                  {requestsOnly && (
                    <td>
                      <div className="pp-action-icons">
                        <button style={btn("#2f8d46")} disabled={actioningId === a.id} onClick={() => decide(a.id, "verify")}>
                          Approve
                        </button>
                        <button style={btn("#e63946")} disabled={actioningId === a.id} onClick={() => decide(a.id, "reject")}>
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}