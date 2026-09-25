"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import "../../products/products.css";

export default function VendorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vendors/requests");
      setRequests(res.data.data?.vendors || []);
    } catch (err) {
      console.error("Failed to load vendor requests:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (id, action) => {
    setActioningId(id);
    try {
      await api.patch(`/vendors/${id}/${action}`);
      setRequests((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(`Failed to ${action} vendor:`, err);
    }
    setActioningId(null);
  };

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Street Vendor Requests</h1>
          <p>Review and approve new street vendor signup requests.</p>
        </div>
      </div>

      <div className="pp-table-wrapper" style={{ marginTop: 20 }}>
        <table className="pp-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>ID Type</th>
              <th>ID Number</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24 }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#888" }}>No pending vendor requests.</td></tr>
            ) : (
              requests.map((v) => (
                <tr key={v.id}>
                  <td>{v.full_name}</td>
                  <td>{v.phone}</td>
                  <td>{v.address}</td>
                  <td>{v.id_type === "pan" ? "PAN" : "Aadhaar"}</td>
                  <td>{v.id_number}</td>
                  <td>
                    <div className="pp-action-icons">
                      <button
                        onClick={() => handleDecision(v.id, "approve")}
                        disabled={actioningId === v.id}
                        style={{ color: "#2f8d46", fontWeight: 700, fontSize: 12, border: "1px solid #2f8d46", borderRadius: 6, padding: "5px 10px", background: "white", cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(v.id, "reject")}
                        disabled={actioningId === v.id}
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