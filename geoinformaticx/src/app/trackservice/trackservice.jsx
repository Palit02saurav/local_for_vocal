"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getServiceOrders } from "@/lib/orders";
import "./trackservice.css";

export default function TrackService() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const sync = async () => setOrders(await getServiceOrders());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <main className="track-page">
      <div className="track-breadcrumb">
        <Link href="/">Home</Link> <span>›</span> <span>Track Service</span>
      </div>

      <h1 className="track-title">Track Service</h1>
      <p className="track-subtitle">View and track all your booked services.</p>

      {orders.length === 0 ? (
        <div className="track-empty">
          <p className="track-empty-icon">📋</p>
          <h2>No bookings yet</h2>
          <p>Services you book will show up here.</p>
          <Link href="/services" className="track-empty-btn">Browse Services</Link>
        </div>
      ) : (
        <div className="track-list">
          {orders.map((order) => (
            <div key={order.orderId} className="track-card">
              <img src={order.image} alt={order.name} className="track-card-img" />
              <div className="track-card-info">
                <p className="track-card-name">{order.name}</p>
                <p className="track-card-seller">{order.seller}</p>
                <p className="track-card-id">Booking ID: {order.groupId}</p>
                <p className="track-card-date">
                  {new Date(order.date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              <div className="track-card-right">
                <span className={`track-status track-status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
                <p className="track-card-qty">Qty: {order.quantity}</p>
                <p className="track-card-price">
                  ₹{(order.price * order.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}