"use client";

import { useState, useEffect } from "react";
import "./toast.css";

const ICONS = {
  success: "✓",
  info: "i",
  warning: "!",
  error: "✕",
};

const TITLES = {
  success: "Success",
  info: "Info",
  warning: "Warning",
  error: "Error",
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now() + Math.random();
      const type = e.detail.type || "success";
      setToasts((prev) => [...prev, { id, message: e.detail.message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    window.addEventListener("app-toast", handleToast);
    return () => window.removeEventListener("app-toast", handleToast);
  }, []);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">{ICONS[t.type] || ICONS.success}</span>
          <div className="toast-text">
            <p className="toast-title">{TITLES[t.type] || TITLES.success}</p>
            <p className="toast-message">{t.message}</p>
          </div>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
            ×
          </button>
          <span className="toast-progress" />
        </div>
      ))}
    </div>
  );
}