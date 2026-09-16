"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import "../../products/products.css";

export default function SellerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sellers/requests");
      setRequests(res.data.data?.sellers || []);
    } catch (err) {
      console.error("Failed to load seller requests:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (id, action) => {
    setActioningId(id);
    try {
      await api.patch(`/sellers/${id}/${action}`);
      setRequests((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(`Failed to ${action} seller:`, err);
    }
    setActioningId(null);
  };

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Seller Requests</h1>
          <p>Review and approve new seller signup requests.</p>
        </div>
      </div>

      <div className="pp-table-wrapper" style={{ marginTop: 20 }}>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 24, color: "#888" }}>No pending seller requests.</td></tr>
            ) : (
              requests.map((s) => (
                <tr key={s.id}>
                  <td>{s.store_name}</td>
                  <td>{s.full_name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone}</td>
                  <td>{s.location}</td>
                  <td>
                    <span className={`pp-pill ${s.seller_type === "service" ? "pp-pill-low" : "pp-pill-active"}`}>
                      {s.seller_type === "service" ? "Service" : "Product"}
                    </span>
                  </td>
                  <td>{s.gst_number || "—"}</td>
                  <td>{s.business_registration_number || "—"}</td>
                  <td>{s.pan_number || "—"}</td>
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