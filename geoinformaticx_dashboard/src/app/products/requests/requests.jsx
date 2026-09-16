"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import "../products.css"; // reuse existing Products page styling

export default function ProductRequests({
  productType = null,
  title = "Product Requests",
  subtitle = "Review and approve products submitted by sellers.",
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/requests", { params: productType ? { productType } : {} });
      setRequests(res.data.data?.products || []);
    } catch (err) {
      console.error("Failed to load product requests:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [productType]);

  const handleDecision = async (id, action) => {
    setActioningId(id);
    try {
      await api.patch(`/products/${id}/${action}`);
      setRequests((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(`Failed to ${action} product:`, err);
    }
    setActioningId(null);
  };

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="pp-table-wrapper" style={{ marginTop: 20 }}>
        <table className="pp-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#888" }}>No pending product requests.</td></tr>
            ) : (
              requests.map((p) => (
                <tr key={p.id}>
                  <td className="pp-product-cell">
                    <img src={p.image_url} alt={p.name} />
                    <span className="pp-product-name">{p.name}</span>
                  </td>
                  <td>{p.seller?.store_name || p.seller?.full_name || "—"}</td>
                  <td>{p.category}</td>
                  <td>₹{Number(p.price).toLocaleString("en-IN")}</td>
                  <td>{p.stock}</td>
                  <td>
                    <div className="pp-action-icons">
                      <button
                        onClick={() => handleDecision(p.id, "approve")}
                        disabled={actioningId === p.id}
                        style={{ color: "#2f8d46", fontWeight: 700, fontSize: 12, border: "1px solid #2f8d46", borderRadius: 6, padding: "5px 10px", background: "white", cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(p.id, "reject")}
                        disabled={actioningId === p.id}
                        style={{ color: "#e63946", fontWeight: 700, fontSize: 12, border: "1px solid #e63946", borderRadius: 6, padding: "5px 10px", background: "white", cursor: "pointer" }}
                      >
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