"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import "../../products/products.css"; // reuse existing table styling

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/services/requests");
      setRequests(res.data.data?.services || []);
    } catch (err) {
      console.error("Failed to load service requests:", err);
    }
    setLoading(false);  
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (id, action) => {
    setActioningId(id);
    try {
      await api.patch(`/services/${id}/${action}`);
      setRequests((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(`Failed to ${action} service:`, err);
    }
    setActioningId(null);
  };

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Service Requests</h1>
          <p>Review and approve services submitted by sellers.</p>
        </div>
      </div>

      <div className="pp-table-wrapper" style={{ marginTop: 20 }}>
        <table className="pp-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#888" }}>No pending service requests.</td></tr>
            ) : (
              requests.map((s) => (
                <tr key={s.id}>
                  <td className="pp-product-cell">
                    <img src={s.image_url || "https://placehold.co/60x60?text=No+Image"} alt={s.name} />
                    <span className="pp-product-name">{s.name}</span>
                  </td>
                  <td>{s.seller?.store_name || s.seller?.full_name || "—"}</td>
                  <td>{s.category || "—"}</td>
                  <td>₹{Number(s.price).toLocaleString("en-IN")}</td>
                  <td>
                    <div className="pp-action-icons">
                      <button
                        onClick={() => handleDecision(s.id, "approve")}
                        disabled={actioningId === s.id}
                        style={{ color: "#2f8d46", fontWeight: 700, fontSize: 12, border: "1px solid #2f8d46", borderRadius: 6, padding: "5px 10px", background: "white", cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(s.id, "reject")}
                        disabled={actioningId === s.id}
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