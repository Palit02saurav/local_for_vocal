"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProductOrders, cancelOrder, submitReview, createReturnRequest } from "@/lib/orders";
import "./trackorder.css";

/* ---------- SVG ICONS (Lucide-style, 24x24) ---------- */
const ICONS = {
  search: (<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>),
  box: (<><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>),
  bag: (<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>),
  truck: (<><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></>),
  store: (<><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8" /><path d="M10 20v-5h4v5" /></>),
  pin: (<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>),
  file: (<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>),
  check: (<path d="M20 6 9 17l-5-5" />),
  chevron: (<path d="m9 18 6-6-6-6" />),
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

/* ---------- Top-right decorative illustration ---------- */
function HeroArt() {
  return (
    <svg className="track-hero-art" viewBox="0 0 420 150" fill="none" aria-hidden="true">
      <path d="M120 0H420V105C360 150 300 125 250 100C200 78 160 55 120 0Z" fill="#e8f4ec" />
      <path d="M150 92C148 44 188 22 214 30C220 72 190 102 150 92Z" fill="#cfe7d8" opacity=".75" />
      <path d="M382 104C360 64 380 22 412 14C428 52 412 92 382 104Z" fill="#cfe7d8" opacity=".75" />
      <ellipse cx="300" cy="132" rx="44" ry="7" fill="#1b5e3b" opacity=".08" />
      <polygon points="262,72 300,88 300,132 262,114" fill="#e6bd7f" />
      <polygon points="300,88 338,72 338,114 300,132" fill="#c98f4a" />
      <polygon points="262,72 300,56 338,72 300,88" fill="#f2d5a4" />
      <polygon points="288,62 308,54 324,62 304,70" fill="#f8ecd6" opacity=".9" />
      <path d="M300 6c-11 0-19 8-19 19 0 14 19 31 19 31s19-17 19-31c0-11-8-19-19-19Z" fill="#1b5e3b" />
      <circle cx="300" cy="25" r="7" fill="#fff" />
    </svg>
  );
}

/* ---------- Stages ---------- */
const ALL_STAGES = [
  { label: "Order Placed", icon: "box" },
  { label: "Confirmed", icon: "check" },
  { label: "Shipped", icon: "truck" },
  { label: "Out for Delivery", icon: "truck" },
  { label: "Delivered", icon: "check" },
];

// Fresh delivery has no "Shipped" step
const getStages = (isFresh) =>
  isFresh ? ALL_STAGES.filter((s) => s.label !== "Shipped") : ALL_STAGES;

const STATUS_TO_STAGE = {
  Pending: "Order Placed",
  Confirmed: "Confirmed",
  Processing: "Confirmed",
  Shipped: "Shipped",
  "Out for Delivery": "Out for Delivery",
  Delivered: "Delivered",
};

const FALLBACK_IMG = "https://placehold.co/200x150?text=No+Image";

const RETURN_STAGES = [
  { label: "Return Requested", status: "Requested", icon: "box" },
  { label: "Return Initiated", status: "Initiated", icon: "check" },
  { label: "Shipped", status: "Shipped", icon: "truck" },
  { label: "Out for Delivery", status: "Out for Delivery", icon: "truck" },
  { label: "Delivered", status: "Delivered", icon: "check" },
];

const RETURN_TYPES = [
  { value: "return", label: "Return" },
  { value: "replace", label: "Replace" },
  { value: "refund", label: "Refund" },
];

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function TrackOrder() {
  const searchParams = useSearchParams();
  const isMixed = searchParams.get("mixed") === "1";
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [ratingId, setRatingId] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | transit | delivered

    const [returnTarget, setReturnTarget] = useState(null);
  const [returnType, setReturnType] = useState("return");
  const [returnReason, setReturnReason] = useState("");
  const [returnError, setReturnError] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const openReturn = (order) => {
    setReturnTarget(order);
    setReturnType("return");
    setReturnReason("");
    setReturnError("");
  };

  const handleReturnSubmit = async () => {
    if (returnReason.trim().length < 10) {
      setReturnError("Please describe the issue (at least 10 characters).");
      return;
    }
    setSubmittingReturn(true);
    const result = await createReturnRequest(returnTarget.orderId, returnType, returnReason.trim());
    setSubmittingReturn(false);
    if (result.success) {
      setReturnTarget(null);
      await loadOrders();
    } else {
      setReturnError(result.message || "Could not submit your request.");
    }
  };

  const loadOrders = async () => setOrders(await getProductOrders());

  useEffect(() => {
    loadOrders();
    window.addEventListener("storage", loadOrders);
    const poll = setInterval(loadOrders, 15000); // refresh every 15s
    return () => {
      window.removeEventListener("storage", loadOrders);
      clearInterval(poll);
    };
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

  const handleRateSubmit = async (orderId) => {
    if (ratingValue < 1) return;
    setSubmittingRating(true);
    const result = await submitReview(orderId, ratingValue, ratingComment);
    setSubmittingRating(false);
    if (result.success) {
      setRatingId(null);
      setRatingValue(0);
      setRatingComment("");
      await loadOrders();
    } else {
      alert(result.message || "Could not submit your rating.");
    }
  };

  const runSearch = () => setAppliedQuery(query.trim());

  /* counts */
  const isTransit = (o) => o.status === "Shipped" || o.status === "Out for Delivery";
  const totalCount = orders.length;
  const transitCount = orders.filter(isTransit).length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  /* filtered list */
  const visible = orders.filter((o) => {
    if (filter === "transit" && !isTransit(o)) return false;
    if (filter === "delivered" && o.status !== "Delivered") return false;
    if (appliedQuery) {
      const q = appliedQuery.toLowerCase().replace(/^#/, "");
      const matchesId = String(o.groupId).includes(q);
      const matchesName = (o.name || "").toLowerCase().includes(q);
      const matchesSeller = (o.seller || "").toLowerCase().includes(q);
      if (!matchesId && !matchesName && !matchesSeller) return false;
    }
    return true;
  });

  return (
    <main className="track-page">
      {/* ---------- Header ---------- */}
      <div className="track-hero">
        <HeroArt />
        <div className="track-breadcrumb">
          <Link href="/">Home</Link> <span>›</span> <span>Track Order</span>
        </div>
        <h1 className="track-title">
          Track <span>Order</span>
        </h1>
        <p className="track-subtitle">View and track all your product orders in one place.</p>
      </div>

      {isMixed && (
        <div className="track-mixed-banner">
          🎉 Your order also included services —{" "}
          <Link href="/trackservice">check Track Services</Link> to see those too.
        </div>
      )}

      {/* ---------- Track by order ID ---------- */}
      <div className="track-search">
        <div className="track-search-icon">
          <Icon name="box" size={22} />
        </div>
        <div className="track-search-text">
          <h3>Track Your Order</h3>
          <p>Search by order ID or product name to track the latest status</p>
        </div>
        <div className="track-search-input">
          <Icon name="search" size={18} />
          <input
            type="text"
            placeholder="Enter Order ID or Product Name (e.g. #12345, Hair Dryer)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim() === "") setAppliedQuery("");
            }}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
        </div>
        <button className="track-search-btn" onClick={runSearch}>
          Track Order
        </button>
      </div>

      {/* ---------- Stat cards ---------- */}
      <div className="track-stats">
        <button
          className={`track-stat ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <span className="track-stat-ico"><Icon name="bag" size={22} /></span>
          <span className="track-stat-body">
            <span className="track-stat-label">Total Orders</span>
            <span className="track-stat-num">{totalCount}</span>
          </span>
        </button>

        <button
          className={`track-stat blue ${filter === "transit" ? "active" : ""}`}
          onClick={() => setFilter("transit")}
        >
          <span className="track-stat-ico"><Icon name="truck" size={22} /></span>
          <span className="track-stat-body">
            <span className="track-stat-label">In Transit</span>
            <span className="track-stat-num">{transitCount}</span>
          </span>
        </button>

        <button
          className={`track-stat ${filter === "delivered" ? "active" : ""}`}
          onClick={() => setFilter("delivered")}
        >
          <span className="track-stat-ico"><Icon name="box" size={22} /></span>
          <span className="track-stat-body">
            <span className="track-stat-label">Delivered</span>
            <span className="track-stat-num">{deliveredCount}</span>
          </span>
        </button>
      </div>

      {/* ---------- Orders ---------- */}
      {orders.length === 0 ? (
        <div className="track-empty">
          <p className="track-empty-icon">📦</p>
          <h2>No orders yet</h2>
          <p>Products you order will show up here.</p>
          <Link href="/shop" className="track-empty-btn">Start Shopping</Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="track-empty">
          <h2>No matching orders</h2>
          <p>Try a different order ID or filter.</p>
        </div>
      ) : (
        <div className="track-list">
          {visible.map((order) => {
            const isExpanded = expandedId === order.orderId;
            const stages = getStages(order.isFreshDelivery);
            const idx = stages.findIndex((s) => s.label === STATUS_TO_STAGE[order.status]);
            const isCancelled = order.status === "Cancelled";
            const canCancel = !isCancelled && idx >= 0 && idx <= 1; // only before Shipped
            const statusClass = order.status.toLowerCase().replace(/\s/g, "-");
            const statusIcon = order.status === "Delivered" ? "check" : "truck";
            const deliveredOn = order.updatedAt ? new Date(order.updatedAt) : null;
            const canReturn =
              order.status === "Delivered" &&
              order.returnAccepted &&
              deliveredOn &&
              Date.now() - deliveredOn.getTime() <= (order.returnDays || 7) * 24 * 60 * 60 * 1000;

            return (
              <div key={order.orderId} className="track-card">
                {/* top row */}
                <div className="track-card-top">
                  <img
                    src={order.image}
                    alt={order.name}
                    className="track-card-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                  />

                  <div className="track-card-main">
                    <p className="track-card-name">
                      {order.name}
                      <span className="track-card-name-arrow"><Icon name="chevron" size={12} stroke={2.4} /></span>
                    </p>
                    <p className="track-card-seller">
                      <Icon name="store" size={16} />
                      {order.seller}
                    </p>
                  </div>

                  <div className="track-meta">
                    <div className="track-meta-item">
                      <span>Order ID</span>
                      <strong>{order.groupId}</strong>
                    </div>
                    <div className="track-meta-item">
                      <span>Order Date</span>
                      <strong>{fmt(order.date)}</strong>
                    </div>
                    <div className="track-meta-item">
                      <span>Quantity</span>
                      <strong>{order.quantity}</strong>
                    </div>
                    <div className="track-meta-item">
                      <span>Total Amount</span>
                      <strong>₹{order.payable.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <span className={`track-status track-status-${statusClass}`}>
                    <Icon name={statusIcon} size={15} />
                    {order.status}
                  </span>
                </div>

                {/* timeline – shown only after clicking "View Details" */}
                {isCancelled ? (
                  <p className="track-cancelled-note">This order was cancelled.</p>
                ) : isExpanded && (
                  <div className="track-timeline">
                    {stages.map((stage, i) => {
                      const isDone = i <= idx;
                      const isCurrent = i === idx && idx !== stages.length - 1;
                      const date = i === 0 ? order.date : isDone ? order.updatedAt || order.date : null;
                      return (
                        <div
                          key={stage.label}
                          className={`track-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}
                        >
                          <span className="track-step-circle">
                            <Icon
                              name={isDone && !isCurrent ? "check" : stage.icon}
                              size={14}
                              stroke={2.4}
                            />
                          </span>
                          <span className="track-step-label">{stage.label}</span>
                          <span className="track-step-date">{date ? fmt(date) : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* return / replace / refund progress – shown only after "View Details" */}
                {isExpanded && order.returnRequest && (() => {
                  const rr = order.returnRequest;
                  const rIdx = RETURN_STAGES.findIndex((s) => s.status === rr.status);
                  return (
                    <div className="track-return">
                      <p className="track-return-title">
                        {RETURN_TYPES.find((t) => t.value === rr.type)?.label} request
                      </p>
                      {rr.status === "Rejected" ? (
                        <p className="track-cancelled-note">This request was rejected by the seller.</p>
                      ) : (
                        <div className="track-timeline">
                          {RETURN_STAGES.map((stage, i) => {
                            const isDone = i <= rIdx;
                            const isCurrent = i === rIdx && rIdx !== RETURN_STAGES.length - 1;
                            const date = i === 0 ? rr.createdAt : isDone ? rr.updatedAt : null;
                            return (
                              <div
                                key={stage.label}
                                className={`track-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}
                              >
                                <span className="track-step-circle">
                                  <Icon name={isDone && !isCurrent ? "check" : stage.icon} size={14} stroke={2.4} />
                                </span>
                                <span className="track-step-label">{stage.label}</span>
                                <span className="track-step-date">{date ? fmt(date) : ""}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* footer buttons */}  
                <div className="track-card-footer">
                  {order.status === "Delivered" && !order.isRated && (
                    <button
                      className="track-btn track-btn-rate"
                      onClick={() => {
                        setExpandedId(order.orderId); 
                        setRatingId(order.orderId);   
                        setRatingValue(0);
                        setRatingComment("");
                      }}
                    >
                      <Icon name="star" size={16} />
                      Rate Now
                    </button>
                  )}
                  {canReturn && (
                    order.returnRequest && order.returnRequest.status !== "Rejected" ? (
                      <button
                        className="track-btn track-btn-return"
                        disabled
                        style={{ opacity: 0.6, cursor: "not-allowed" }}
                      >
                        <Icon name="box" size={16} />
                        {`${RETURN_TYPES.find((t) => t.value === order.returnRequest.type)?.label} Initiated`}
                      </button>
                    ) : (
                      <button className="track-btn track-btn-return" onClick={() => openReturn(order)}>
                        <Icon name="box" size={16} />
                        {order.returnRequest ? "Request Again" : "Return / Replace"}
                      </button>
                    )
                  )}
                  <button
                    className="track-btn track-btn-outline"
                    onClick={() => setExpandedId(isExpanded ? null : order.orderId)}
                  >
                    <Icon name="file" size={16} />
                    {isExpanded ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    className="track-btn track-btn-solid"
                    onClick={() => setExpandedId(isExpanded ? null : order.orderId)}
                  >
                    <Icon name="pin" size={16} />
                    Track Shipment
                  </button>
                </div>

                {/* details panel (cancel + rate live here) */}
                {isExpanded && (
                  <div className="track-expand-panel">
                    <div className="track-detail-grid">
                      <div><span>Seller</span><strong>{order.seller}</strong></div>
                      <div><span>Last Updated</span><strong>{fmt(order.updatedAt || order.date)}</strong></div>
                  </div>

                    {canCancel && (
                      <button
                        className="track-cancel-btn"
                        disabled={cancellingId === order.groupId}
                        onClick={() => handleCancel(order.groupId)}
                      >
                        {cancellingId === order.groupId ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}

                    {order.status === "Delivered" && !order.isRated && (
                      ratingId === order.orderId ? (
                        <div className="track-rate-form">
                          <div className="track-rate-stars">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span
                                key={n}
                                className={`track-star ${n <= ratingValue ? "filled" : ""}`}
                                onClick={() => setRatingValue(n)}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <textarea
                            className="track-rate-comment"
                            placeholder="Say something about this product (optional)"
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                          />
                          <div className="track-rate-actions">
                            <button
                              className="track-rate-submit-btn"
                              disabled={ratingValue < 1 || submittingRating}
                              onClick={() => handleRateSubmit(order.orderId)}
                            >
                              {submittingRating ? "Submitting..." : "Submit Rating"}
                            </button>
                            <button
                              className="track-rate-cancel-btn"
                              onClick={() => { setRatingId(null); setRatingValue(0); setRatingComment(""); }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="track-rate-btn" onClick={() => setRatingId(order.orderId)}>
                          Rate This Product
                        </button>
                      )
                    )}

                    {order.status === "Delivered" && order.isRated && (
                      <p className="track-rated-note">✓ You've rated this product.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- Return / Replace modal ---------- */}
      {returnTarget && (
        <div className="track-modal-backdrop" onClick={() => !submittingReturn && setReturnTarget(null)}>
          <div className="track-modal" onClick={(e) => e.stopPropagation()}>
            <div className="track-modal-head">
              <h3>Return / Replace</h3>
              <button className="track-modal-close" onClick={() => setReturnTarget(null)}>×</button>
            </div>

            <div className="track-modal-product">
              <img
                src={returnTarget.image}
                alt={returnTarget.name}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
              />
              <div>
                <p className="track-modal-product-name">{returnTarget.name}</p>
                <p className="track-modal-product-sub">
                  Order #{returnTarget.groupId} · ₹{returnTarget.payable.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <p className="track-modal-label">What would you like?</p>
            <div className="track-modal-types">
              {RETURN_TYPES.map((t) => (
                <label key={t.value} className={`track-modal-type ${returnType === t.value ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="returnType"
                    value={t.value}
                    checked={returnType === t.value}
                    onChange={() => setReturnType(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>

            <p className="track-modal-label">What is the issue?</p>
            <textarea
              className="track-modal-text"
              rows={4}
              maxLength={1000}
              placeholder="Tell us what went wrong with this product"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />
            {returnError && <p className="track-modal-error">{returnError}</p>}

            <div className="track-modal-actions">
              <button className="track-rate-cancel-btn" onClick={() => setReturnTarget(null)} disabled={submittingReturn}>
                Cancel
              </button>
              <button className="track-rate-submit-btn" onClick={handleReturnSubmit} disabled={submittingReturn}>
                {submittingReturn ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}