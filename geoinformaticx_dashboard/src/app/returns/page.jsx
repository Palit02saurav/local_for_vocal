"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "../orders/order.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const TITLES = { return: "Returns", refund: "Refunds", replace: "Replaced" };

const PILL = {
  Requested: { bg: "#fff4e5", color: "#b9770e" },
  Initiated: { bg: "#e8f1ff", color: "#2563eb" },
  Shipped: { bg: "#e8f1ff", color: "#2563eb" },
  "Out for Delivery": { bg: "#e8f1ff", color: "#2563eb" },
  Delivered: { bg: "#e6f7ee", color: "#1e9e5a" },
  Rejected: { bg: "#fdeaea", color: "#d64545" },
};

const NEXT_ACTION = {
  Requested: { label: "Initiate", status: "Initiated" },
  Initiated: { label: "Mark Shipped", status: "Shipped" },
  Shipped: { label: "Out for Delivery", status: "Out for Delivery" },
  "Out for Delivery": { label: "Mark Delivered", status: "Delivered" },
};

export default function ReturnsPage() {
  const type = useSearchParams().get("type") || "return";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const selected = rows.find((r) => r.id === selectedId) || null;

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/returns?type=${type}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setRows(data.data?.requests || []))
      .catch((err) => console.error("Failed to load requests:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelectedId(null);
    load();
  }, [type]);

  const update = async (id, status) => {
    const res = await fetch(`${API_BASE}/returns/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Could not update this request.");
    }
  };

  return (
    <div className="orders-page">
      <div className="orders-main">
        <div className="orders-header">
          <div>
            <h1>{TITLES[type] || "Returns"}</h1>
            <p>Manage customer {type} requests.</p>
          </div>
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Item</th>
                <th>Type</th>
                <th>Issue</th>
                <th>Date</th>
                <th>Status</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="orders-empty">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="orders-empty">No requests found.</td></tr>
              ) : (
                rows.map((r) => {
                  const next = NEXT_ACTION[r.status];
                  return (
                    <tr key={r.id}>
                      <td className="cell-orderid">RET{r.id}</td>
                      <td>ORD{r.order_id}</td>
                      <td>
                        <div className="cell-customer">
                          <span className="cell-customer-name">{r.customer?.name || "—"}</span>
                          <span className="cell-customer-email">{r.customer?.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-item">
                          {r.orderItem?.image_url && <img src={r.orderItem.image_url} alt={r.orderItem.name} />}
                          <span>{r.orderItem?.name}</span>
                        </div>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{r.type}</td>
                      <td style={{ maxWidth: 240, whiteSpace: "normal" }}>{r.reason}</td>
                      <td>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td>
                        <span className="status-pill" style={{ background: PILL[r.status]?.bg, color: PILL[r.status]?.color }}>
                          {r.status}
                        </span>
                      </td>
                      <td className="col-action">
                        <div className="cell-action-buttons">
                          {next && (
                            <button className="action-shipped-btn" onClick={() => update(r.id, next.status)}>
                              {next.label}
                            </button>
                          )}
                          {r.status === "Requested" && (
                            <button className="action-shipped-btn" style={{ background: "#d64545" }} onClick={() => update(r.id, "Rejected")}>
                              Reject
                            </button>
                          )}
                          <button className="action-dots" onClick={() => setSelectedId(r.id)}>
                            ⋯
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="orders-pagination">
          <span>Showing {rows.length} requests</span>
        </div>
      </div>

      {selected && (() => {
        const next = NEXT_ACTION[selected.status];
        const created = new Date(selected.created_at);
        const item = selected.orderItem || {};
        const qty = item.quantity || 1;
        return (
          <aside className="order-detail-panel">
            <div className="detail-header">
              <div>
                <h3>Request #RET{selected.id}</h3>
                <span
                  className="status-pill"
                  style={{ background: PILL[selected.status]?.bg, color: PILL[selected.status]?.color }}
                >
                  {selected.status}
                </span>
              </div>
              <button className="detail-close" onClick={() => setSelectedId(null)}>×</button>
            </div>
            <p className="detail-timestamp">
              {created.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at{" "}
              {created.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>

            <div className="detail-section">
              <h4>Request Details</h4>
              <p className="detail-name" style={{ textTransform: "capitalize" }}>{selected.type}</p>
              <p>{selected.reason}</p>
            </div>

            <div className="detail-section">
              <h4>Customer Details</h4>
              <p className="detail-name">{selected.customer?.name || "—"}</p>
              <p>{selected.customer?.email}</p>
              <p>{selected.order?.phone}</p>
              <p>{selected.order?.address}</p>
            </div>

            <div className="detail-section">
              <h4>Item</h4>
              <div className="detail-item-row">
                {item.image_url && <img src={item.image_url} alt={item.name} />}
                <span className="detail-item-name">
                  {item.name}{qty > 1 ? ` × ${qty}` : ""}
                </span>
                <span>₹{Number(item.price || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Order</h4>
              <div className="detail-price-row">
                <span>Order ID</span>
                <span>ORD{selected.order_id}</span>
              </div>
              <div className="detail-price-row">
                <span>Payment</span>
                <span>{selected.order?.payment_method || "—"}</span>
              </div>
            </div>

            <div className="detail-actions">
              {next && (
                <button className="btn btn-primary" onClick={() => update(selected.id, next.status)}>
                  {next.label}
                </button>
              )}
              {selected.status === "Requested" && (
                <button
                  className="btn btn-primary"
                  style={{ background: "#d64545" }}
                  onClick={() => update(selected.id, "Rejected")}
                >
                  Reject
                </button>
              )}
              {!next && selected.status !== "Requested" && (
                <p style={{ color: "#888", fontSize: 13 }}>No further actions for this request.</p>
              )}
            </div>
          </aside>
        );
      })()}
    </div>
  );
}