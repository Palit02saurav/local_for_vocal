"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import api from "@/lib/api";
import "../products/products.css";

function getSellerName(b) {
  return b.Seller?.store_name || b.Seller?.full_name || b.seller?.store_name || b.seller?.full_name || "Admin";
}

export default function Banners() {

  const handlePay = async (bannerId) => {
  try {
    const res = await api.post(`/banners/${bannerId}/create-payment-order`);
    const { orderId, amount, currency, keyId } = res.data.data;

    const options = {
      key: keyId,
      amount,
      currency,
      name: "Geoinformaticx",
      description: "Banner Publishing Fee",
      order_id: orderId,
      handler: async (response) => {
        await api.post(`/banners/${bannerId}/verify-payment`, {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        alert("Payment successful! Your banner is now live.");
        window.location.reload();
      },
      theme: { color: "#2f8d46" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    alert(err.response?.data?.message || "Payment failed to start.");
  }
};
  const [user, setUser] = useState(null);
  const isAdmin = user?.role === "SUPER_ADMIN";
  const isSeller = user?.role === "SELLER";

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBanners = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/banners");
      setBanners(res.data.data?.banners || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    loadBanners();
  }, []);

  return (
    <main className="pp-page">
      <div className="pp-header">
        <div>
          <h1>Banners</h1>
          <p>
            {isAdmin
              ? "All approved banners across your marketplace."
              : "Your approved banners."}
          </p>
        </div>
        <Link href="/banners/new" className="pp-add-btn">+ Add New Banner</Link>
      </div>

      <div className="pp-table-wrapper" style={{ marginTop: 20 }}>
        {loading ? (
          <div className="pp-state-msg">Loading banners…</div>
        ) : error ? (
          <div className="pp-state-msg pp-state-error">
            {error} <button className="pp-retry-btn" onClick={loadBanners}>Retry</button>
          </div>
        ) : banners.length === 0 ? (
          <div className="pp-state-msg">No banners yet.</div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                {isAdmin && <th>Seller</th>}
                <th>Link</th>
                <th>Date Added</th>
                <th>Status</th>
                {isSeller && <th>Payment</th>}
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td className="pp-product-cell">
                    <img src={b.image_url} alt={b.title} />
                  </td>
                  <td className="pp-product-name">{b.title}</td>
                  {isAdmin && <td>{getSellerName(b)}</td>}
                  <td>{b.link_url || "—"}</td>
                  <td className="pp-date-cell">
                    {new Date(b.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td>
                    <span className={`pp-pill ${b.is_published ? "pp-pill-active" : "pp-pill-low"}`}>
                      {b.is_published ? "Live" : "Not Published"}
                    </span>
                  </td>
                  {isSeller && (
                    <td>
                      {b.payment_status === "Paid" ? (
                        <span className="pp-pill pp-pill-active">Paid</span>
                      ) : (
                        <button
                          onClick={() => handlePay(b.id)}
                          style={{
                            color: "#2f8d46",
                            fontWeight: 700,
                            fontSize: 12,
                            border: "1px solid #2f8d46",
                            borderRadius: 6,
                            padding: "5px 10px",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          Pay ₹{b.payment_amount || 10} to Publish
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}