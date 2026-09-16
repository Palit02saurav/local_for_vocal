"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import "../../products/products.css";

export default function BannerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/banners/requests");
      setRequests(res.data.data?.banners || []);
    } catch (err) {
      console.error("Failed to load banner requests:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (id, action) => {
    setActioningId(id);
    try {
      await api.patch(`/banners/${id}/${action}`);
      setRequests((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(`Failed to ${action} banner:`, err);
    }
    setActioningId(null);
  };

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Banner Requests</h1>
          <p>Review and approve banners submitted by sellers.</p>
        </div>
      </div>

      <div className="pp-table-wrapper" style={{ marginTop: 20 }}>
        <table className="pp-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Seller</th>
              <th>Link</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#888" }}>No pending banner requests.</td></tr>
            ) : (
              requests.map((b) => (
                <tr key={b.id}>
                  <td className="pp-product-cell">
                    <img src={b.image_url} alt={b.title} />
                  </td>
                  <td className="pp-product-name">{b.title}</td>
                  <td>{b.seller?.store_name || b.seller?.full_name || "—"}</td>
                  <td>{b.link_url || "—"}</td>
                  <td>
                    <div className="pp-action-icons">
                      <button
                        onClick={() => handleDecision(b.id, "approve")}
                        disabled={actioningId === b.id}
                        style={{ color: "#2f8d46", fontWeight: 700, fontSize: 12, border: "1px solid #2f8d46", borderRadius: 6, padding: "5px 10px", background: "white", cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(b.id, "reject")}
                        disabled={actioningId === b.id}
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