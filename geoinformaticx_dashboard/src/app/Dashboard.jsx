"use client";

import { useState, useRef, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import { findDistrictSpecialty } from "@/lib/districtSpecialties";
import "./Dashboard.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatDate(date) {
  if (!date) return "";
  return `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
}

function isSameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function computeGrowth(items) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const recentCount = items.filter((i) => {
    const created = new Date(i.createdAt || i.created_at).getTime();
    return !Number.isNaN(created) && now - created <= weekMs;
  }).length;
  const priorCount = items.length - recentCount;

  if (priorCount <= 0) {
    return recentCount > 0 ? "New" : "0%";
  }
  const pct = (recentCount / priorCount) * 100;
  return `+${pct.toFixed(1)}%`;
}

function countRecent(items) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return items.filter((i) => {
    const created = new Date(i.createdAt || i.created_at).getTime();
    return !Number.isNaN(created) && now - created <= weekMs;
  }).length;
}

const ORDER_STATUS_COLORS = {
  Pending: "#f5a623",
  Confirmed: "#2f8d46",
  Processing: "#4a90d9",
  Shipped: "#8e44ad",
  "Out for Delivery": "#c97a2e",
  Delivered: "#2ec4c6",
  Cancelled: "#e63946",
};
const ORDER_STATUS_SEQUENCE = ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

// Groups real orders (or, for sellers, order-items scoped to their own products/services) by status.
function buildOrderStatusBreakdown(rawOrders, isSellerRow) {
  const statusByOrderId = new Map();
  rawOrders.forEach((raw) => {
    const orderId = isSellerRow ? raw.order_id ?? raw.order?.id ?? raw.id : raw.id;
    const status = (isSellerRow ? raw.order?.status : raw.status) || "Pending";
    if (!statusByOrderId.has(orderId)) statusByOrderId.set(orderId, status);
  });

  const counts = {};
  statusByOrderId.forEach((status) => {
    counts[status] = (counts[status] || 0) + 1;
  });

  const total = statusByOrderId.size;
  return ORDER_STATUS_SEQUENCE.filter((s) => counts[s]).map((s) => ({
    label: s,
    value: counts[s],
    pct: total > 0 ? Number(((counts[s] / total) * 100).toFixed(1)) : 0,
    color: ORDER_STATUS_COLORS[s] || "#999",
  }));
}

// Buckets real order revenue into the last 7 calendar days (today included).
function buildSalesSeries(rawOrders, isSellerRow) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  const totals = days.map(() => 0);

  rawOrders.forEach((raw) => {
    const dateStr = isSellerRow ? raw.order?.created_at || raw.created_at : raw.created_at;
    const amount = isSellerRow ? Number(raw.price) * raw.quantity : Number(raw.total);
    if (!dateStr) return;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const idx = days.findIndex((day) => day.getTime() === d.getTime());
    if (idx !== -1) totals[idx] += amount;
  });

  return {
    labels: days.map((d) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`),
    data: totals,
  };
}

function formatShortINR(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `₹${Math.round(n)}`;
}

function niceMax(value) {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  let niceResidual;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;
  return niceResidual * magnitude;
}

function DateRangePicker({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const cells = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const handleDayClick = (day) => {
    const clicked = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (!startDate || (startDate && endDate)) {
      onChange(clicked, null);
    } else if (clicked < startDate) {
      onChange(clicked, startDate);
    } else {
      onChange(startDate, clicked);
    }
  };

  const isInRange = (day) => {
    if (!startDate || !endDate) return false;
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    return d > startDate && d < endDate;
  };

  const isEndpoint = (day) => {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    return isSameDay(d, startDate) || isSameDay(d, endDate);
  };

  return (
    <div className="dash-daterange-wrapper" ref={wrapperRef}>
      <button className="dash-date-btn" onClick={() => setOpen((o) => !o)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {formatDate(startDate)}{endDate ? ` - ${formatDate(endDate)}` : ""}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="dash-calendar-dropdown">
          <div className="dash-calendar-header">
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}>‹</button>
            <span>{MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="dash-calendar-weekdays">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="dash-calendar-grid">
            {cells.map((day, i) =>
              day === null ? (
                <span key={i} className="dash-calendar-cell empty" />
              ) : (
                <button
                  key={i}
                  className={`dash-calendar-cell ${isEndpoint(day) ? "selected" : ""} ${isInRange(day) ? "in-range" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  {day}
                </button>
              )
            )}
          </div>
          <div className="dash-calendar-footer">
            <button className="dash-calendar-done" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
const buildStatCards = (productCount, sellerCount, serviceCount, orderCount, orderRevenue, isSeller, productGrowth, sellerGrowth, serviceGrowth) => [
  {
    label: "Total Orders",
    value: orderCount.toLocaleString("en-IN"),
    change: "",
    sub: "All-time",
    color: "#2f8d46",
    bg: "#e6f4ea",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2f8d46" strokeWidth="1.8">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: "Total Revenue",
    value: `₹${orderRevenue.toLocaleString("en-IN")}`,
    change: "",
    sub: "All-time",
    color: "#2f8d46",
    bg: "#e6f4ea",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2f8d46" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Total Products",
    value: productCount.toLocaleString("en-IN"),
    change: productGrowth,
    sub: "in your marketplace",
    color: "#7b5fc4",
    bg: "#f0ecfa",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7b5fc4" strokeWidth="1.8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: "Total Services",
    value: serviceCount.toLocaleString("en-IN"),
    change: serviceGrowth,
    sub: "in your marketplace",
    color: "#2ec4c6",
    bg: "#e3f8f8",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ec4c6" strokeWidth="1.8">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    label: "Total Sellers",
    value: sellerCount.toLocaleString("en-IN"),
    change: sellerGrowth,
    sub: "in your marketplace",
    color: "#e07b2a",
    bg: "#fdeee0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e07b2a" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const salesData = [0, 0, 0, 0, 0, 0, 0]; 
const salesLabels = ["May 18", "May 19", "May 20", "May 21", "May 22", "May 23", "May 24"];

// const orderStatus = [
//   { label: "Pending", value: 215, pct: 17.2, color: "#f5a623" },
//   { label: "Confirmed", value: 320, pct: 25.6, color: "#2f8d46" },
//   { label: "Processing", value: 280, pct: 22.4, color: "#4a90d9" },
//   { label: "Shipped", value: 310, pct: 24.8, color: "#8e44ad" },
//   { label: "Delivered", value: 123, pct: 9.8, color: "#2ec4c6" },
// ];

const recentOrders = [
  { id: "#ORD12548", name: "Terracotta Pot", buyer: "Priya Sharma", price: "₹850", status: "Delivered", time: "2 min ago", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=100&q=80" },
  { id: "#ORD12547", name: "Organic Honey", buyer: "Rahul Verma", price: "₹650", status: "Processing", time: "15 min ago", img: "https://www.dineshflourmills.com/cdn/shop/files/OrganicHoney_1.jpg?v=1770623215" },
  { id: "#ORD12546", name: "Handwoven Bag", buyer: "Ananya Das", price: "₹1,250", status: "Shipped", time: "1 hr ago", img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&q=80" },
  { id: "#ORD12545", name: "Wooden Coaster Set", buyer: "Kolkata, WB", price: "₹450", status: "Confirmed", time: "2 hr ago", img: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=100&q=80" },
  { id: "#ORD12544", name: "Macrame Hanging", buyer: "Sneha Iyer", price: "₹950", status: "Pending", time: "3 hr ago", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&q=80" },
];

const bestSellers = [
  { name: "Hand Painted Terracotta Pot", seller: "Earthy Hands Pottery", sold: 156, revenue: "₹1,32,600", stock: 45, img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=100&q=80" },
  { name: "Organic Wild Honey", seller: "Pure & Natural", sold: 142, revenue: "₹92,300", stock: 32, img: "https://www.dineshflourmills.com/cdn/shop/files/OrganicHoney_1.jpg?v=1770623215" },
  { name: "Handwoven Tribal Bag", seller: "Weave Magic", sold: 98, revenue: "₹1,22,500", stock: 20, img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&q=80" },
  { name: "Macrame Wall Hanging", seller: "Home Decor Kolkata", sold: 87, revenue: "₹82,650", stock: 15, img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&q=80" },
  { name: "Wooden Coaster Set", seller: "Artisan Woodcraft", sold: 76, revenue: "₹34,200", stock: 28, img: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=100&q=80" },
];

const bestSellingServices = [
  { name: "Home Cleaning", seller: "SparkleClean Services", sold: 132, revenue: "₹1,18,800", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&q=80" },
  { name: "AC Repair & Servicing", seller: "CoolFix Technicians", sold: 104, revenue: "₹93,600", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=100&q=80" },
  { name: "Plumbing Visit", seller: "QuickFix Plumbers", sold: 89, revenue: "₹53,400", img: "https://images.unsplash.com/photo-1607472829322-4d3ae4a6b3ea?w=100&q=80" },
  { name: "Full Home Painting", seller: "Colorworks Painters", sold: 61, revenue: "₹2,74,500", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=100&q=80" },
  { name: "Pest Control", seller: "SafeHome Pest Control", sold: 54, revenue: "₹32,400", img: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=100&q=80" },
];

// const lowStock = [
//   { name: "Handwoven Tribal Bag", stock: 20, low: 25, img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&q=80" },
//   { name: "Macrame Wall Hanging", stock: 15, low: 20, img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&q=80" },
//   { name: "Organic Wild Honey", stock: 32, low: 35, img: "https://www.dineshflourmills.com/cdn/shop/files/OrganicHoney_1.jpg?v=1770623215" },
//   { name: "Terracotta Pot (Large)", stock: 18, low: 20, img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=100&q=80" },
// ];

const stripIcons = {
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  "user-plus": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="17" y1="11" x2="23" y2="11" />
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  store: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
      <path d="M3 9 5 3h14l2 6" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  trend: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
};

function buildBottomStats(customerCount, customerGrowth, newUsersCount, sellerCount, sellerGrowth) {
  return [
    { label: "Total Users", value: customerCount.toLocaleString("en-IN"), change: customerGrowth, color: "#2f8d46", bg: "#e6f4ea", icon: "users" },
    { label: "New Users", value: newUsersCount.toLocaleString("en-IN"), change: customerGrowth, color: "#7b5fc4", bg: "#f0ecfa", icon: "user-plus" },
    { label: "Total Reviews", value: "1,245", change: "+9.7%", color: "#4a90d9", bg: "#e8f1fb", icon: "star" },
    { label: "Active Sellers", value: sellerCount.toLocaleString("en-IN"), change: sellerGrowth, color: "#e07b2a", bg: "#fdeee0", icon: "store" },
    { label: "Conversion Rate", value: "3.42%", change: "+6.1%", color: "#2ec4c6", bg: "#e3f8f8", icon: "trend" },
  ];
}

// const bottomStats = [
//   { label: "Total Users", value: "5,892", change: "+11.3%", color: "#2f8d46", bg: "#e6f4ea", icon: "users" },
//   { label: "New Users", value: "356", change: "+8.6%", color: "#7b5fc4", bg: "#f0ecfa", icon: "user-plus" },
//   { label: "Total Reviews", value: "1,245", change: "+9.7%", color: "#4a90d9", bg: "#e8f1fb", icon: "star" },
//   { label: "Active Sellers", value: "342", change: "+10.2%", color: "#e07b2a", bg: "#fdeee0", icon: "store" },
//   { label: "Conversion Rate", value: "3.42%", change: "+6.1%", color: "#2ec4c6", bg: "#e3f8f8", icon: "trend" },
// ];

// const axisTicks = [
//   { value: 250, label: "₹2.5L" },
//   { value: 200, label: "₹2L" },
//   { value: 150, label: "₹1.5L" },
//   { value: 100, label: "₹1L" },
//   { value: 50, label: "₹50K" },
//   { value: 0, label: "0" },
// ];

function buildLinePath(data, width, height, maxValue, leftPad = 46, rightPad = 14, topPad = 14, bottomPad = 14) {
  const max = maxValue > 0 ? maxValue : 1;
  const stepX = (width - leftPad - rightPad) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = leftPad + i * stepX;
    const y = height - bottomPad - (v / max) * (height - topPad - bottomPad);
    return [x, y];
  });
  const linePath = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0]},${height - bottomPad} L${points[0][0]},${height - bottomPad} Z`;
  const tickCount = 5;
  const gridLines = Array.from({ length: tickCount + 1 }, (_, i) => {
    const value = (max / tickCount) * (tickCount - i);
    const y = height - bottomPad - (value / max) * (height - topPad - bottomPad);
    return { y, value, label: formatShortINR(value) };
  });
  return { linePath, areaPath, points, gridLines, leftPad, rightPad };
}

function statusPill(status) {
  const map = {
    Delivered: "pill-delivered",
    Processing: "pill-processing",
    Shipped: "pill-shipped",
    Confirmed: "pill-confirmed",
    Pending: "pill-pending",
  };
  return map[status] || "";
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function normalizeRecentOrder(raw, isSellerRow) {
  const placeholder = "https://placehold.co/100x100?text=No+Image";
  if (isSellerRow) {
    const order = raw.order || {};
    return {
      id: `#ORD${order.id ?? raw.id}`,
      name: raw.name,
      buyer: order.customer?.full_name || order.full_name || "—",
      price: `₹${(Number(raw.price) * raw.quantity).toLocaleString("en-IN")}`,
      status: order.status || "Pending",
      time: timeAgo(order.created_at || raw.created_at),
      img: raw.image_url || placeholder,
    };
  }
  const items = raw.items || [];
  return {
    id: `#ORD${raw.id}`,
    name: items[0]?.name || "—",
    buyer: raw.customer?.full_name || raw.full_name || "—",
    price: `₹${Number(raw.total).toLocaleString("en-IN")}`,
    status: raw.status || "Pending",
    time: timeAgo(raw.created_at),
    img: items[0]?.image_url || placeholder,
  };
}

export default function Dashboard() {
  const chartW = 560;
  const chartH = 220;
  const [hiddenRevenue, setHiddenRevenue] = useState({});
  const [dateRange, setDateRange] = useState({
    start: new Date(2024, 4, 18),
    end: new Date(2024, 4, 24),
  });

  const [user, setUser] = useState(null);
  const [sellerType, setSellerType] = useState(null);
  const [sellerLocation, setSellerLocation] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [orderRevenue, setOrderRevenue] = useState(0);
  const [productGrowth, setProductGrowth] = useState("0%");
  const [sellerGrowth, setSellerGrowth] = useState("0%");
  const [serviceGrowth, setServiceGrowth] = useState("0%");
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesSeries, setSalesSeries] = useState({ labels: salesLabels, data: salesData });
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState([]);
  const [customers, setCustomers] = useState([]);

  
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    const loadSellerType = async () => {
      if (currentUser?.role !== "SELLER") return;
      try {
        const res = await fetch(`${API_BASE}/sellers/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSellerType(data.data?.seller?.seller_type || null);
          setSellerLocation(data.data?.seller?.location || null);
        }
      } catch (err) {
        console.error("Failed to load seller type:", err);
      }
    };

    const loadProductCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/products`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const products = data.data?.products || [];
          setProductCount(products.length);
          setProductGrowth(computeGrowth(products));
        }
      } catch (err) {
        console.error("Failed to load product count:", err);
      }
    };

    const loadServiceCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/services`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const services = data.data?.services || [];
          setServiceCount(services.length);
          setServiceGrowth(computeGrowth(services));
        }
      } catch (err) {
        console.error("Failed to load service count:", err);
      }
    };

    const loadSellerCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/sellers`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const allSellers = data.data?.sellers || [];
          const activeSellers = allSellers.filter((s) => s.approval_status !== "Rejected");
          setSellerCount(activeSellers.length);
          setSellerGrowth(computeGrowth(activeSellers));
        }
      } catch (err) {
        console.error("Failed to load seller count:", err);
      }
    };

    const loadOrderStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const orders = data.data?.orders || [];
        const currentUser = getCurrentUser();

        const isSellerRow = currentUser?.role === "SELLER";

        if (isSellerRow) {
          // For sellers this list is order ITEMS already scoped to their products/services.
          const distinctOrderIds = new Set(orders.map((item) => item.order_id));
          const revenue = orders.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0
          );
          setOrderCount(distinctOrderIds.size);
          setOrderRevenue(revenue);
        } else {
          // For admins this list is full Order records with a precomputed total.
          const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
          setOrderCount(orders.length);
          setOrderRevenue(revenue);
        }
        setRecentOrders(orders.slice(0, 5).map((o) => normalizeRecentOrder(o, isSellerRow)));
        setSalesSeries(buildSalesSeries(orders, isSellerRow));
        setOrderStatusBreakdown(buildOrderStatusBreakdown(orders, isSellerRow));
      } catch (err) {
        console.error("Failed to load order stats:", err);
      }
    };

    const loadCustomerCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/customers`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.data?.customers || []);
        }
      } catch (err) {
        console.error("Failed to load customer count:", err);
      }
    };

    loadSellerType();
    loadProductCount();
    loadServiceCount();
    loadSellerCount();
    loadOrderStats();
    loadCustomerCount();
  }, []);

  const isSeller = user?.role === "SELLER";
  const regionalSpecialty = isSeller ? findDistrictSpecialty(sellerLocation) : null;
  const allStatCards = buildStatCards(productCount, sellerCount, serviceCount, orderCount, orderRevenue, isSeller, productGrowth, sellerGrowth, serviceGrowth);
  const statCards = isSeller
    ? allStatCards.filter((c) => {
        if (c.label === "Total Sellers") return false;
        if (c.label === "Total Products" && sellerType === "service") return false;
        if (c.label === "Total Services" && sellerType === "product") return false;
        return true;
      })
    : allStatCards;

  const toggleRevenue = (name) => {
    setHiddenRevenue((prev) => ({ ...prev, [name]: !prev[name] }));
  };
  const chartMax = niceMax(Math.max(...salesSeries.data, 0));
  const { linePath, areaPath, points, gridLines, leftPad, rightPad } = buildLinePath(
    salesSeries.data,
    chartW,
    chartH,
    chartMax
  );
  const customerGrowth = computeGrowth(customers);
  const newUsersCount = countRecent(customers);
  const bottomStats = buildBottomStats(customers.length, customerGrowth, newUsersCount, sellerCount, sellerGrowth);

  let cumulative = 0;
  const conicStops = orderStatusBreakdown.length
    ? orderStatusBreakdown
        .map((s) => {
          const start = cumulative;
          cumulative += s.pct;
          return `${s.color} ${start}% ${cumulative}%`;
        })
        .join(", ")
    : "#eee 0% 100%";

  return (
    <main className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1>
                        Welcome back, {user?.name || (user?.role === "SELLER" ? (user?.seller_type === "service" ? "Service Provider" : "Seller") : "Admin")}! 👋
          </h1>
          <p>
            {user?.role === "SELLER"
              ? "Here's what's happening with your store today."
              : "Here's what's happening with your marketplace today."}
          </p>
        </div>
        <div className="dash-header-actions">
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={(start, end) => setDateRange({ start, end })}
          />
          <button className="dash-add-btn">+ Add New</button>
        </div>
      </div>

      <div className="dash-main-grid">
        <div className="dash-left-col">
          
          {regionalSpecialty && (
            <div className="dash-card dash-regional-card">
              <div className="dash-regional-icon">🏺</div>
              <div className="dash-regional-text">
                <h3>{regionalSpecialty.district} is famous for {regionalSpecialty.specialty}</h3>
                <p>List your take on this regional specialty to reach more local buyers.</p>
              </div>
              <a href="/products/new" className="dash-add-btn dash-regional-btn">
                + Add This Product
              </a>
            </div>
          )}

          <div className="dash-stats-row">
            {statCards.map((c) => (
              <div className="dash-stat-card" key={c.label}>
                <div className="dash-stat-icon" style={{ background: c.bg }}>
                  {c.icon}
                </div>
                <p className="dash-stat-label">{c.label}</p>
                <p className="dash-stat-value">{c.value}</p>
                <p className="dash-stat-change" style={{ color: c.color }}>
                  {c.change && <>↑ {c.change} </>}
                  <span className="dash-stat-sub">{c.sub}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="dash-charts-row dash-charts-row-single">
            <div className="dash-card dash-sales-card">
              <div className="dash-card-title-row">
                <h3>Sales Overview</h3>
                <select className="dash-mini-select"><option>This Week</option></select>
              </div>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="dash-line-chart" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f8d46" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2f8d46" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {gridLines.map((g) => (
                  <line
                    key={g.value}
                    x1={leftPad}
                    y1={g.y}
                    x2={chartW - rightPad}
                    y2={g.y}
                    stroke="#eee"
                    strokeWidth="1"
                  />
                ))}
                {gridLines.map((g) => (
                  <text key={`label-${g.value}`} x={leftPad - 10} y={g.y + 4} textAnchor="end" fontSize="11" fill="#999">
                    {g.label}
                  </text>
                ))}
                <path d={areaPath} fill="url(#salesGradient)" />
                <path d={linePath} fill="none" stroke="#2f8d46" strokeWidth="2.5" />
                {points.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#2f8d46" stroke="#fff" strokeWidth="1.5" />
                ))}
              </svg>
              <div className="dash-chart-labels" style={{ marginLeft: `${(leftPad / chartW) * 100}%` }}>
                {salesSeries.labels.map((l, i) => (
                  <span key={`${l}-${i}`}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders sidebar */}
        <div className="dash-card dash-recent-orders">
          <div className="dash-card-title-row">
            <h3>Recent Orders</h3>
            <a href="/orders" className="dash-view-all-link">View All →</a>
          </div>
          <div className="dash-recent-list">
            {recentOrders.length === 0 && <p className="dash-recent-empty">No orders yet.</p>}
            {recentOrders.map((o) => (
              <div className="dash-recent-item" key={o.id}>
                <img src={o.img} alt={o.name} />
                <div className="dash-recent-info">
                  <p className="dash-recent-id">{o.id}</p>
                  <p className="dash-recent-name">{o.name}</p>
                  <p className="dash-recent-buyer">{o.buyer}</p>
                </div>
                <div className="dash-recent-right">
                  <span className={`dash-pill ${statusPill(o.status)}`}>{o.status}</span>
                  <p className="dash-recent-price">{o.price}</p>
                  <p className="dash-recent-time">{o.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best sellers + Low stock */}
      <div className="dash-bottom-grid">
        <div className="dash-card dash-bestsellers-card">
          <div className="dash-card-title-row">
            <h3>Best Selling Products</h3>
            <a href="/products" className="dash-view-all-link">View All →</a>
          </div>
          <table className="dash-bestsellers-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Sold</th>
                <th>Revenue</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.map((p) => {
                const isHidden = hiddenRevenue[`product-${p.name}`];
                return (
                  <tr key={p.name}>
                    <td className="dash-product-cell">
                      <img src={p.img} alt={p.name} />
                      <div>
                        <p className="dash-product-name">{p.name}</p>
                        <p className="dash-product-seller">{p.seller}</p>
                      </div>
                    </td>
                    <td>{p.sold}</td>
                    <td>{isHidden ? "••••••" : p.revenue}</td>
                    <td>{p.stock}</td>
                    <td>
                      <button
                        className="dash-eye-btn"
                        aria-label={isHidden ? "Show revenue" : "Hide revenue"}
                        onClick={() => toggleRevenue(`product-${p.name}`)}
                      >
                        {isHidden ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="dash-card dash-bestsellers-card">
          <div className="dash-card-title-row">
            <h3>Best Selling Services</h3>
            <a href="/services" className="dash-view-all-link">View All →</a>
          </div>
          <table className="dash-bestsellers-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Booked</th>
                <th>Revenue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bestSellingServices.map((p) => {
                const isHidden = hiddenRevenue[`service-${p.name}`];
                return (
                  <tr key={p.name}>
                    <td className="dash-product-cell">
                      <img src={p.img} alt={p.name} />
                      <div>
                        <p className="dash-product-name">{p.name}</p>
                        <p className="dash-product-seller">{p.seller}</p>
                      </div>
                    </td>
                    <td>{p.sold}</td>
                    <td>{isHidden ? "••••••" : p.revenue}</td>
                    <td>
                      <button
                        className="dash-eye-btn"
                        aria-label={isHidden ? "Show revenue" : "Hide revenue"}
                        onClick={() => toggleRevenue(`service-${p.name}`)}
                      >
                        {isHidden ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* <div className="dash-card dash-lowstock-card">
          <h3>Low Stock Alerts</h3>
          <div className="dash-lowstock-list">
            {lowStock.map((p) => (
              <div className="dash-lowstock-item" key={p.name}>
                <img src={p.img} alt={p.name} />
                <div className="dash-lowstock-info">
                  <p className="dash-lowstock-name">{p.name}</p>
                  <p className="dash-lowstock-stock">
                    Stock: {p.stock} <span className="dash-lowstock-low">Low (≤{p.low})</span>
                  </p>
                </div>
                <button className="dash-update-btn">Update Stock</button>
              </div>
            ))}
          </div>
        </div>
      </div> */}
            </div>

      {/* Orders by Status — redesigned three-zone layout */}
      <div className="dash-card dash-donut-standalone-v2">
        <div className="dash-donut-v2-header">
          <h3>Orders by Status</h3>
          <p>Overview of all orders based on their current status</p>
        </div>

        <div className="dash-donut-v2-row">
          <div className="dash-donut-v2-total-card">
            <div className="dash-donut-v2-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2f8d46" strokeWidth="1.8">
                <path d="M20 7h-3V6a4 4 0 0 0-8 0v1H6a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1ZM11 6a1 1 0 0 1 2 0v1h-2Z" />
              </svg>
            </div>
            <span className="dash-donut-v2-total-value">{orderCount.toLocaleString("en-IN")}</span>
            <span className="dash-donut-v2-total-label">Total Orders</span>
            <a href="/orders" className="dash-donut-v2-btn">View All Orders →</a>
          </div>

          <div className="dash-donut-v2-chart-wrap">
            <div className="dash-donut" style={{ background: `conic-gradient(${conicStops})` }}>
              <div className="dash-donut-hole">
                <span className="dash-donut-total">{orderCount.toLocaleString("en-IN")}</span>
                <span className="dash-donut-total-label">Total Orders</span>
              </div>
            </div>
          </div>

          <div className="dash-donut-v2-legend">
            {orderStatusBreakdown.length === 0 && (
              <p className="dash-recent-empty">No orders yet.</p>
            )}
            {orderStatusBreakdown.map((s) => (
              <div className="dash-donut-v2-legend-row" key={s.label}>
                <span className="dash-donut-v2-dot" style={{ background: s.color }} />
                <span className="dash-donut-v2-label">{s.label}</span>
                <span className="dash-donut-v2-pct">{s.value} ({s.pct}%)</span>
                <div className="dash-donut-v2-bar-track">
                  <div
                    className="dash-donut-v2-bar-fill"
                    style={{ width: `${s.pct}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom stats strip */}
      <div className="dash-strip">
        {bottomStats.map((s) => (
          <div className="dash-strip-item" key={s.label}>
            <div className="dash-strip-icon" style={{ background: s.bg, color: s.color }}>
              {stripIcons[s.icon]}
            </div>
            <div>
              <p className="dash-strip-label">{s.label}</p>
              <p className="dash-strip-value">{s.value}</p>
              <p className="dash-strip-change" style={{ color: s.color }}>↑ {s.change} <span className="dash-strip-change-sub">vs last week</span></p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}