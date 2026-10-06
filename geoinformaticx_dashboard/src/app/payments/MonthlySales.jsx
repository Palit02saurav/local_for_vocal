"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import "../products/products.css";

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const pillClass = (s) =>
  s === "Verified" ? "pp-pill-active" : s === "Rejected" ? "pp-pill-out" : "pp-pill-low";

const cardStyle = {
  flex: "1 1 220px",
  background: "white",
  border: "1px solid #e8e8e8",
  borderRadius: 12,
  padding: "16px 20px",
};
const cardLabel = { fontSize: 13, color: "#777", marginBottom: 6 };
const cardValue = { fontSize: 22, fontWeight: 700 };

export default function MonthlySales() {
  const [month, setMonth] = useState(currentMonth());
  const [type, setType] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/payout-accounts/earnings", {
        params: { month, seller_type: type || undefined },
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load earnings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, type]);

  const rows = data?.rows || [];
  const s = data?.summary;
  const rate = data?.commission_rate ?? 10;

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Monthly Sales &amp; Commission</h1>
          <p>
            Completed product sales and confirmed service bookings per seller, the {rate}% commission we keep, and the amount payable to the seller.
          </p>
        </div>
      </div>

      <div className="pp-toolbar" style={{ gap: 12, flexWrap: "wrap" }}>
        <input
          type="month"
          value={month}
          max={currentMonth()}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 14 }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 14 }}
        >
          <option value="">Sellers &amp; Service Providers</option>
          <option value="product">Sellers only</option>
          <option value="service">Service Providers only</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
        <div style={cardStyle}>
          <div style={cardLabel}>Total sales</div>
          <div style={cardValue}>{inr(s?.gross_sales)}</div>
        </div>
        <div style={{ ...cardStyle, borderColor: "#2f8d46" }}>
          <div style={cardLabel}>Our commission ({rate}%)</div>
          <div style={{ ...cardValue, color: "#2f8d46" }}>{inr(s?.commission)}</div>
        </div>
        <div style={cardStyle}>
          <div style={cardLabel}>Payable to sellers</div>
          <div style={cardValue}>{inr(s?.seller_amount)}</div>
        </div>
      </div>

      <div className="pp-table-wrapper">
        <table className="pp-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Type</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Total Sales</th>
              <th>Commission ({rate}%)</th>
              <th>Seller Amount</th>
              <th>Bank Account</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : error ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#e63946" }}>
                  {error} <button className="pp-retry-btn" onClick={load}>Retry</button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#888" }}>
                  No sales for this month.
                </td>
              </tr>
            ) : (
              <>
                {rows.map((r) => (
                  <tr key={r.seller_id}>
                    <td className="pp-product-name">{r.store_name || r.full_name}</td>
                    <td>{r.seller_type === "service" ? "Service Provider" : "Seller"}</td>
                    <td>{r.email}</td>
                    <td>{r.orders}</td>
                    <td>{inr(r.gross_sales)}</td>
                    <td style={{ color: "#2f8d46", fontWeight: 600 }}>{inr(r.commission)}</td>
                    <td style={{ fontWeight: 700 }}>{inr(r.seller_amount)}</td>
                    <td>
                      <span className={`pp-pill ${r.bank_status ? pillClass(r.bank_status) : "pp-pill-out"}`}>
                        {r.bank_status || "Not added"}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700, background: "#fafafa" }}>
                  <td colSpan={3}>Total</td>
                  <td>{s.orders}</td>
                  <td>{inr(s.gross_sales)}</td>
                  <td style={{ color: "#2f8d46" }}>{inr(s.commission)}</td>
                  <td>{inr(s.seller_amount)}</td>
                  <td></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}