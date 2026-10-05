"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getServiceOrders, submitReview } from "@/lib/orders";
import "./trackservice.css";

/* ---------- SVG ICONS (Lucide-style, 24x24) ---------- */
const ICONS = {
  file: (<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>),
  calendarClock: (<><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h5" /><path d="M17.5 17.5 16 16.3V14" /><circle cx="16" cy="16" r="6" /></>),
  gear: (<><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>),
  checkCircle: (<><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></>),
  check: (<path d="M20 6 9 17l-5-5" />),
  store: (<><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8" /><path d="M10 20v-5h4v5" /></>),
  pin: (<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>),
  rupee: (<><path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" /></>),
  phone: (<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />),
  message: (<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8" /><path d="M8 13h5" /></>),
  eye: (<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  star: (<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />),
};

function Icon({ name, size = 18, stroke = 1.8 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/* Solid green circle with white tick (Booked badge + confirmed box) */
function CheckBadge({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1b5e3b" />
      <path d="M7 12.5l3.4 3.4L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Solid shield with tick (Trusted Local Services badge) */
function ShieldBadge() {
  return (
    <svg width="34" height="38" viewBox="0 0 24 27" aria-hidden="true">
      <path d="M12 1 2.5 4.6v7.2c0 6 4 10.7 9.5 13 5.5-2.3 9.5-7 9.5-13V4.6L12 1Z" fill="#1b5e3b" />
      <path d="M7.8 13l3 3 5.4-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Green leaves on the banner */
function HeroLeaves() {
  return (
    <svg className="ts-hero-leaves" viewBox="0 0 520 200" preserveAspectRatio="xMaxYMid slice" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tsLeafA" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2f8f5b" stopOpacity="0.15" />
          <stop offset="1" stopColor="#1b5e3b" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="tsLeafB" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#58b583" stopOpacity="0.2" />
          <stop offset="1" stopColor="#2f8f5b" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M0 200C20 120 90 60 200 40C260 30 300 40 330 20C340 90 300 170 210 200Z" fill="url(#tsLeafB)" />
      <path d="M130 200C150 110 230 40 340 10C400 -4 440 6 470 0C470 80 420 170 320 200Z" fill="url(#tsLeafA)" />
      <path d="M210 200C230 130 290 70 380 40" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- Status config ---------- */
const STATUS = {
  Pending: { label: "Pending", box: "Booking Pending", tone: "amber", group: "upcoming" },
  Confirmed: { label: "Booked", box: "Booking Confirmed", tone: "green", group: "upcoming" },
  Processing: { label: "In Progress", box: "Service In Progress", tone: "blue", group: "ongoing" },
  Shipped: { label: "In Progress", box: "Service In Progress", tone: "blue", group: "ongoing" },
  "Out for Delivery": { label: "In Progress", box: "Service In Progress", tone: "blue", group: "ongoing" },
  Delivered: { label: "Completed", box: "Service Completed", tone: "green", group: "completed" },
  Cancelled: { label: "Cancelled", box: "Booking Cancelled", tone: "red", group: "cancelled" },
};

const FALLBACK_IMG = "https://placehold.co/400x300?text=No+Image";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmtTime = (d) =>
  new Date(d)
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    .toUpperCase();

export default function TrackService() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all"); // all | upcoming | ongoing | completed
  const [openId, setOpenId] = useState(null);
  const [ratingId, setRatingId] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const loadOrders = async () => setOrders(await getServiceOrders());

  useEffect(() => {
    loadOrders();
    window.addEventListener("storage", loadOrders);
    return () => window.removeEventListener("storage", loadOrders);
  }, []);

  const closeRating = () => {
    setRatingId(null);
    setRatingValue(0);
    setRatingComment("");
  };

  const handleRateSubmit = async (orderId) => {
    if (ratingValue < 1) return;
    setSubmittingRating(true);
    const result = await submitReview(orderId, ratingValue, ratingComment);
    setSubmittingRating(false);
    if (result.success) {
      closeRating();
      await loadOrders();
    } else {
      alert(result.message || "Could not submit your rating.");
    }
  };

  const groupOf = (o) => (STATUS[o.status] || STATUS.Pending).group;
  const total = orders.length;
  const upcoming = orders.filter((o) => groupOf(o) === "upcoming").length;
  const ongoing = orders.filter((o) => groupOf(o) === "ongoing").length;
  const completed = orders.filter((o) => groupOf(o) === "completed").length;

  const visible = orders.filter((o) => filter === "all" || groupOf(o) === filter);

  return (
    <main className="ts-page">
      {/* ---------- Banner ---------- */}
      <section className="ts-hero">
        <div className="ts-hero-text">
          <div className="ts-breadcrumb">
            <Link href="/">Home</Link> <span>›</span> <span>Track Service</span>
          </div>
          <h1 className="ts-title">
            Track <span>Service</span>
          </h1>
          <p className="ts-subtitle">View and track all your booked services.</p>
        </div>
        <div className="ts-trusted">
          <ShieldBadge />
          <div>
            <strong>Trusted</strong>
            <span>Local Services</span>
          </div>
        </div>
      </section>

      {/* ---------- Stat cards ---------- */}
      <div className="ts-stats">
        <button className={`ts-stat ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          <span className="ts-stat-ico"><Icon name="file" size={24} /></span>
          <span className="ts-stat-body">
            <span className="ts-stat-label">Total Bookings</span>
            <span className="ts-stat-num">{total}</span>
          </span>
        </button>

        <button className={`ts-stat blue ${filter === "upcoming" ? "active" : ""}`} onClick={() => setFilter("upcoming")}>
          <span className="ts-stat-ico"><Icon name="calendarClock" size={24} /></span>
          <span className="ts-stat-body">
            <span className="ts-stat-label">Upcoming</span>
            <span className="ts-stat-num">{upcoming}</span>
          </span>
        </button>

        <button className={`ts-stat orange ${filter === "ongoing" ? "active" : ""}`} onClick={() => setFilter("ongoing")}>
          <span className="ts-stat-ico"><Icon name="gear" size={24} /></span>
          <span className="ts-stat-body">
            <span className="ts-stat-label">Ongoing</span>
            <span className="ts-stat-num">{ongoing}</span>
          </span>
        </button>

        <button className={`ts-stat ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>
          <span className="ts-stat-ico"><Icon name="checkCircle" size={24} /></span>
          <span className="ts-stat-body">
            <span className="ts-stat-label">Completed</span>
            <span className="ts-stat-num">{completed}</span>
          </span>
        </button>
      </div>

      {/* ---------- Bookings ---------- */}
      {orders.length === 0 ? (
        <div className="ts-empty">
          <p className="ts-empty-icon">📋</p>
          <h2>No bookings yet</h2>
          <p>Services you book will show up here.</p>
          <Link href="/services" className="ts-empty-btn">Browse Services</Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="ts-empty">
          <h2>No bookings in this category</h2>
          <p>Try another filter above.</p>
        </div>
      ) : (
        <div className="ts-list">
          {visible.map((order) => {
            const cfg = STATUS[order.status] || STATUS.Pending;
            const isOpen = openId === order.orderId;
            const canRate = ["Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"].includes(order.status);

            return (
              <div key={order.orderId} className="ts-card">
                <div className="ts-card-top">
                  <img
                    src={order.image}
                    alt={order.name}
                    className="ts-card-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                  />

                  <div className="ts-card-main">
                    <h2 className="ts-card-name">{order.name}</h2>
                    <p className="ts-card-seller">
                      <Icon name="store" size={18} />
                      {order.seller}
                    </p>
                    {order.location && (
                      <p className="ts-card-loc">
                        <Icon name="pin" size={18} />
                        {order.location}
                      </p>
                    )}

                    <div className={`ts-confirm ${cfg.tone}`}>
                      {cfg.tone === "green" ? (
                        <CheckBadge size={36} />
                      ) : (
                        <span className="ts-confirm-dot" />
                      )}
                      <div>
                        <strong>{cfg.box}</strong>
                        <span>{fmtDate(order.date)}, {fmtTime(order.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ts-card-side">
                    <span className={`ts-pill ${cfg.tone}`}>
                      {cfg.tone === "green" && <CheckBadge size={20} />}
                      {cfg.label}
                    </span>

                    <div className="ts-facts">
                      <div className="ts-fact">
                        <Icon name="calendar" size={20} />
                        <div><span>Booking ID</span><strong>#{order.groupId}</strong></div>
                      </div>
                      <div className="ts-fact">
                        <Icon name="calendar" size={20} />
                        <div><span>Service Date</span><strong>{fmtDate(order.date)}</strong></div>
                      </div>
                      <div className="ts-fact">
                        <Icon name="calendar" size={20} />
                        <div><span>Quantity</span><strong>{order.quantity}</strong></div>
                      </div>
                      <div className="ts-fact">
                        <Icon name="rupee" size={20} />
                        <div>
                          <span>Total Amount</span>
                          <strong className="ts-amount">₹{(order.price * order.quantity).toLocaleString("en-IN")}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* bottom strip */}
                <div className="ts-bottom">
                  <div className="ts-contact-strip">
                    <div className="ts-contact">
                      <span className="ts-contact-ico"><Icon name="phone" size={20} /></span>
                      <div>
                        <strong>Provider Contact</strong>
                        <span>{order.providerPhone || "Not available"}</span>
                      </div>
                    </div>
                    <span className="ts-contact-sep" />
                    <div className="ts-contact">
                      <span className="ts-contact-ico"><Icon name="pin" size={20} /></span>
                      <div>
                        <strong>Service Address</strong>
                        <span>{order.serviceAddress || "Not available"}</span>
                      </div>
                    </div>
                  </div>

                  {canRate && !order.isRated && (
                    <button
                      className="ts-btn ts-btn-rate"
                      onClick={() => {
                        setRatingId(order.orderId);
                        setRatingValue(0);
                        setRatingComment("");
                      }}
                    >
                      <Icon name="star" size={20} />
                      Rate Now
                    </button>
                  )}

                  {order.providerPhone ? (
                    <a href={`tel:${order.providerPhone}`} className="ts-btn ts-btn-outline">
                      <Icon name="message" size={20} />
                      Contact Provider
                    </a>
                  ) : (
                    <button className="ts-btn ts-btn-outline" disabled>
                      <Icon name="message" size={20} />
                      Contact Provider
                    </button>
                  )}

                  <button
                    className="ts-btn ts-btn-solid"
                    onClick={() => setOpenId(isOpen ? null : order.orderId)}
                  >
                    <Icon name="eye" size={20} />
                    View Details
                  </button>
                </div>

                {isOpen && (
                  <div className="ts-details">
                    <div><span>Service</span><strong>{order.name}</strong></div>
                    <div><span>Unit Price</span><strong>₹{order.price.toLocaleString("en-IN")}</strong></div>
                    <div><span>Booked On</span><strong>{fmtDate(order.date)}, {fmtTime(order.date)}</strong></div>
                    <div><span>Last Updated</span><strong>{fmtDate(order.updatedAt || order.date)}</strong></div>
                  </div>
                )}

                {canRate && ratingId === order.orderId && !order.isRated && (
                  <div className="ts-rate-form">
                    <div className="ts-rate-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`ts-star ${n <= ratingValue ? "filled" : ""}`}
                          onClick={() => setRatingValue(n)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <textarea
                      className="ts-rate-comment"
                      placeholder="Tell us about this service (optional)"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                    />
                    <div className="ts-rate-actions">
                      <button
                        className="ts-rate-submit"
                        disabled={ratingValue < 1 || submittingRating}
                        onClick={() => handleRateSubmit(order.orderId)}
                      >
                        {submittingRating ? "Submitting..." : "Submit Rating"}
                      </button>
                      <button className="ts-rate-cancel" onClick={closeRating}>Cancel</button>
                    </div>
                  </div>
                )}

                {canRate && order.isRated && (
                  <p className="ts-rated-note">✓ You've rated this service.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}