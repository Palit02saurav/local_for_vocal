"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProductOrders, cancelOrder } from "@/lib/orders";
import "./trackorder.css";

const STAGES = ["Ordered", "Shipped", "Out for Delivery", "Delivered"];

function stageIndex(status) {
  if (status === "Pending" || status === "Confirmed" || status === "Processing") return 0;
  if (status === "Shipped") return 1;
  if (status === "Out for Delivery") return 2;
  if (status === "Delivered") return 3;
  return -1; // Cancelled or unknown
}

export default function TrackOrder() {
  const searchParams = useSearchParams();
  const isMixed = searchParams.get("mixed") === "1";
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = async () => setOrders(await getProductOrders());

  useEffect(() => {
    loadOrders();
    window.addEventListener("storage", loadOrders);
    return () => window.removeEventListener("storage", loadOrders);
  }, []);

  const handleCancel = async (groupId) => {
    setCancellingId(groupId);
    const result = await cancelOrder(groupId);
    setCancellingId(null);
    if (result.success) {
      await loadOrders();
    } else {
      alert(result.message || "Could not cancel this order.");
    }
  };

  return (
    <main className="track-page">
      <div className="track-breadcrumb">
        <Link href="/">Home</Link> <span>›</span> <span>Track Order</span>
      </div>

      <h1 className="track-title">Track Order</h1>
      <p className="track-subtitle">View and track all your product orders.</p>

      {isMixed && (
        <div className="track-mixed-banner">
          🎉 Your order also included services —{" "}
          <Link href="/trackservice">check Track Services</Link> to see those too.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="track-empty">
          <p className="track-empty-icon">📦</p>
          <h2>No orders yet</h2>
          <p>Products you order will show up here.</p>
          <Link href="/shop" className="track-empty-btn">Start Shopping</Link>
        </div>
      ) : (
        <div className="track-list">
          {orders.map((order) => {
            const isExpanded = expandedId === order.orderId;
            const idx = stageIndex(order.status);
            const isCancelled = order.status === "Cancelled";
            const canCancel = !isCancelled && idx < 1; // only before Shipped

            return (
              <div key={order.orderId} className="track-card-wrapper">
                <div
                  className="track-card"
                  onClick={() => setExpandedId(isExpanded ? null : order.orderId)}
                  style={{ cursor: "pointer" }}
                >
                  <img src={order.image} alt={order.name} className="track-card-img" />
                  <div className="track-card-info">
                    <p className="track-card-name">{order.name}</p>
                    <p className="track-card-seller">{order.seller}</p>
                    <p className="track-card-id">Order ID: {order.groupId}</p>
                    <p className="track-card-date">
                      {new Date(order.date).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="track-card-right">
                    <span className={`track-status track-status-${order.status.toLowerCase().replace(/\s/g, "-")}`}>
                      {order.status}
                    </span>
                    <p className="track-card-qty">Qty: {order.quantity}</p>
                    <p className="track-card-price">
                      ₹{(order.price * order.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="track-expand-panel">
                    {isCancelled ? (
                      <p className="track-cancelled-note">This order was cancelled.</p>
                    ) : (
                      <div className="track-stepper">
                        {STAGES.map((stage, i) => (
                          <div key={stage} className={`track-step ${i <= idx ? "done" : ""}`}>
                            <span className="track-step-dot" />
                            <span className="track-step-label">{stage}</span>
                            {i < STAGES.length - 1 && <span className={`track-step-line ${i < idx ? "done" : ""}`} />}
                          </div>
                        ))}
                      </div>
                    )}

                    {canCancel && (
                      <button
                        className="track-cancel-btn"
                        disabled={cancellingId === order.groupId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(order.groupId);
                        }}
                      >
                        {cancellingId === order.groupId ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}