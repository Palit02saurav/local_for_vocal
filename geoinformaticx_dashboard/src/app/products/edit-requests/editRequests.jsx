"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import "../products.css";

const FIELD_LABELS = {
  category: "Category", price: "Price", stock: "Stock",
  image_url: "Image", description: "Description",
};

function formatValue(field, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "price") return `₹${Number(value).toLocaleString("en-IN")}`;
  if (field === "image_url") return "New image";
  return String(value);
}

export default function ProductEditRequests({
  title = "Product Edit Requests",
  subtitle = "Review changes sellers want to make to already-approved products.",
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/edit-requests");
      setRequests(res.data.data?.requests || []);
    } catch (err) {
      console.error("Failed to load product edit requests:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleDecision = async (id, action) => {
    setActioningId(id);
    try {
      await api.patch(`/products/edit-requests/${id}/${action}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(`Failed to ${action} edit request:`, err);
    }
    setActioningId(null);
  };

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div><h1>{title}</h1><p>{subtitle}</p></div>
      </div>

      <div className="pp-table-wrapper" style={{ marginTop: 20 }}>
        <table className="pp-table">
          <thead>
            <tr><th>Product</th><th>Seller</th><th>Requested Changes</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "#888" }}>No pending edit requests.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td className="pp-product-cell">
                    <img src={r.product?.image_url || "https://placehold.co/60x60?text=No+Image"} alt={r.product?.name} />
                    <span className="pp-product-name">{r.product?.name}</span>
                  </td>
                  <td>{r.seller?.store_name || r.seller?.full_name || "—"}</td>
                  <td>
                    {Object.entries(r.changes || {}).map(([field, { old, new: next }]) => (
                      <div key={field} style={{ fontSize: 12.5 }}>
                        <strong>{FIELD_LABELS[field] || field}:</strong>{" "}
                        <span style={{ color: "#999", textDecoration: "line-through" }}>{formatValue(field, old)}</span>{" "}
                        → <span style={{ color: "#2f8d46", fontWeight: 600 }}>{formatValue(field, next)}</span>
                      </div>
                    ))}
                  </td>
                  <td>
                    <div className="pp-action-icons">
                      <button onClick={() => handleDecision(r.id, "approve")} disabled={actioningId === r.id}
                        style={{ color: "#2f8d46", fontWeight: 700, fontSize: 12, border: "1px solid #2f8d46", borderRadius: 6, padding: "5px 10px", background: "white", cursor: "pointer" }}>
                        Approve
                      </button>
                      <button onClick={() => handleDecision(r.id, "reject")} disabled={actioningId === r.id}
                        style={{ color: "#e63946", fontWeight: 700, fontSize: 12, border: "1px solid #e63946", borderRadius: 6, padding: "5px 10px", background: "white", cursor: "pointer" }}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}