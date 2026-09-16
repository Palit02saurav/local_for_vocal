"use client";

import { useState, useMemo, useEffect } from "react";
import "./order.css";

const STATUS_STYLES = {
  Pending: { bg: "#fff4e5", color: "#b9770e" },
  Shipped: { bg: "#e8f1ff", color: "#2563eb" },
  Delivered: { bg: "#e6f7ee", color: "#1e9e5a" },
  Cancelled: { bg: "#fdeaea", color: "#d64545" },
};

const STAT_CONFIG = [
  { key: "all", label: "All Orders", icon: "bag", color: "#2563eb", bg: "#e8f1ff" },
  { key: "Pending", label: "Pending", icon: "clock", color: "#b9770e", bg: "#fff4e5" },
  { key: "Shipped", label: "Shipped", icon: "truck", color: "#2563eb", bg: "#e8f1ff" },
  { key: "Delivered", label: "Delivered", icon: "check", color: "#1e9e5a", bg: "#e6f7ee" },
  { key: "Cancelled", label: "Cancelled", icon: "x", color: "#d64545", bg: "#fdeaea" },
];

function StatIcon({ type }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.8 };
  switch (type) {
    case "bag":
      return (
        <svg {...common} stroke="currentColor">
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common} stroke="currentColor">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "box":
      return (
        <svg {...common} stroke="currentColor">
          <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
          <path d="M3 8l9 5 9-5M12 13v8" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common} stroke="currentColor">
          <path d="M3 7h11v9H3z" />
          <path d="M14 10h4l3 3v3h-7z" />
          <circle cx="7" cy="18" r="1.5" />
          <circle cx="17" cy="18" r="1.5" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} stroke="currentColor">
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      );
    case "x":
      return (
        <svg {...common} stroke="currentColor">
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function OrdersPage({ orders = [], loading = false, onSelectOrder, onUpdateStatus, initialStatus = "All Status" }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);
  const [selected, setSelected] = useState(null);
  const [checkedIds, setCheckedIds] = useState([]);

  const stats = useMemo(() => {
    const total = orders.length;
    return STAT_CONFIG.map((s) => {
      const count = s.key === "all" ? total : orders.filter((o) => o.status === s.key).length;
      const pct = total ? ((count / total) * 100).toFixed(1) : "0.0";
      return { ...s, count, pct };
    });
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "All Status" && o.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hay = `${o.orderId} ${o.customerName} ${o.customerEmail} ${o.itemName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const toggleCheck = (id) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleOpenOrder = (order) => {
    setSelected(order);
    onSelectOrder?.(order);
  };

  return (
    <div className="orders-page">
      <div className="orders-main">
        <div className="orders-header">
          <div>
            <h1>Orders</h1>
            <p>Manage and track all customer orders.</p>
          </div>
          <div className="orders-header-actions">
            <button className="btn btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v13m0 0-4-4m4 4 4-4" />
                <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              Export
            </button>
            <button className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        <div className="orders-stats">
          {stats.map((s) => (
            <div className="stat-card" key={s.key}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <StatIcon type={s.icon} />
              </div>
              <div className="stat-body">
                <span className="stat-label">{s.label}</span>
                <span className="stat-count">{s.count}</span>
                {s.key === "all" ? (
                  <span className="stat-link">View all</span>
                ) : (
                  <span className="stat-pct">{s.pct}%</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="orders-toolbar">
          <div className="orders-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="orders-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            {STAT_CONFIG.filter((s) => s.key !== "all").map((s) => (
              <option key={s.key}>{s.key}</option>
            ))}
          </select>
          <button className="orders-select orders-select-btn">Date Range</button>
          <button className="orders-select orders-select-btn">All Payment Methods</button>
          <button
            className="btn btn-reset"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All Status");
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
            </svg>
            Reset
          </button>
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input type="checkbox" disabled />
                </th>
                <th>Order ID</th>
                <th>Seller</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Item</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="orders-empty">Loading orders…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="orders-empty">No orders found.</td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.orderId}
                    className={selected?.orderId === o.orderId ? "row-active" : ""}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(o.orderId)}
                        onChange={() => toggleCheck(o.orderId)}
                      />
                    </td>
                    <td className="cell-orderid">{o.orderId}</td>
                    <td>{o.sellerName || "—"}</td>
                    <td>
                      <div className="cell-customer">
                        <span className="cell-customer-name">{o.customerName}</span>
                        <span className="cell-customer-email">{o.customerEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-date">
                        <span>{o.date}</span>
                        <span className="cell-date-time">{o.time}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-item">
                        {o.itemImage && <img src={o.itemImage} alt={o.itemName} />}
                        <span>{o.itemCount > 1 ? `${o.itemCount} items` : o.itemName}</span>
                      </div>
                    </td>
                    <td className="cell-amount">₹{Number(o.amount || 0).toLocaleString("en-IN")}</td>
                    <td>{o.payment || "—"}</td>
                    <td>
                      <span
                        className="status-pill"
                        style={{
                          background: STATUS_STYLES[o.status]?.bg,
                          color: STATUS_STYLES[o.status]?.color,
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="col-action">
                      <div className="cell-action-buttons">
                        {o.status !== "Shipped" && o.status !== "Delivered" && o.status !== "Cancelled" && (
                          <button
                            className="action-shipped-btn"
                            onClick={() => onUpdateStatus?.(o.orderId, "Shipped")}
                          >
                            Shipped
                          </button>
                        )}
                        <button className="action-dots" onClick={() => handleOpenOrder(o)}>
                          ⋯
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-pagination">
          <span>Showing {filtered.length} of {orders.length} orders</span>
        </div>
      </div>

      {selected && (
        <aside className="order-detail-panel">
          <div className="detail-header">
            <div>
              <h3>Order #{selected.orderId}</h3>
              <span
                className="status-pill"
                style={{
                  background: STATUS_STYLES[selected.status]?.bg,
                  color: STATUS_STYLES[selected.status]?.color,
                }}
              >
                {selected.status}
              </span>
            </div>
            <button className="detail-close" onClick={() => setSelected(null)}>×</button>
          </div>
          <p className="detail-timestamp">{selected.date} at {selected.time}</p>

          <div className="detail-section">
            <h4>Customer Details</h4>
            <p className="detail-name">{selected.customerName}</p>
            <p>{selected.customerEmail}</p>
            <p>{selected.customerPhone}</p>
            <p>{selected.customerAddress}</p>
          </div>

          <div className="detail-section">
            <h4>Order Items ({selected.items?.length || 0})</h4>
            {(selected.items || []).map((it, idx) => (
              <div className="detail-item-row" key={idx}>
                {it.image && <img src={it.image} alt={it.name} />}
                <span className="detail-item-name">{it.name}</span>
                <span>₹{Number(it.price || 0).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          <div className="detail-section">
            <h4>Pricing Details</h4>
            <div className="detail-price-row">
              <span>Subtotal</span>
              <span>₹{Number(selected.subtotal || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="detail-price-row">
              <span>Delivery Charges</span>
              <span>₹{Number(selected.deliveryCharge || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="detail-price-row">
              <span>Packaging Charges</span>
              <span>₹{Number(selected.packagingCharge || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="detail-price-row detail-total">
              <span>Total Amount</span>
              <span>₹{Number(selected.amount || 0).toLocaleString("en-IN")}</span>
            </div>
            <p className="detail-txn">Paid via {selected.payment} · Txn ID: {selected.txnId || "—"}</p>
          </div>

          <div className="detail-section">
            <h4>Shipping Address</h4>
            <p>{selected.shippingAddress}</p>
          </div>

          <div className="detail-actions">
            {selected.status !== "Shipped" && selected.status !== "Delivered" && selected.status !== "Cancelled" && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  onUpdateStatus?.(selected.orderId, "Shipped");
                  setSelected((prev) => (prev ? { ...prev, status: "Shipped" } : prev));
                }}
              >
                Mark as Shipped
              </button>
            )}
            <button className="btn btn-outline">View Invoice</button>
            <button className="btn btn-outline">Track Order</button>
            <button className="btn btn-danger-outline">Refund Order</button>
          </div>
        </aside>
      )}
    </div>
  );
}