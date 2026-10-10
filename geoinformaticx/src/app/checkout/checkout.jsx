"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { getCart, clearCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { validateCoupon, getSavedCoupon, saveCoupon } from "@/lib/coupons";
import { createOrderFromCart, verifyRazorpayPayment, abortRazorpayPayment } from "@/lib/orders";
import "./checkout.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function Checkout() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    paymentMethod: "cod",
  });
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    const loadCart = async () => {
      const cartItems = await getCart();
      if (cartItems.length === 0) {
        router.replace("/cart");
        return;
      }
      setItems(cartItems);

      const saved = getSavedCoupon();
      if (saved) {
        const r = await validateCoupon(saved, cartItems);
        if (r.success) setCoupon({ code: r.code, discount: r.discount });
        else saveCoupon("");
      }

      const user = getCurrentUser();
      if (user) {
        setForm((f) => ({ ...f, name: user.name || "", email: user.email || "" }));
      }

      try {
        const { data } = await axios.get(`${API_BASE}/customer/auth/me`, { withCredentials: true });
        const u = data.data?.user;
        if (u) {
          const fullAddress = [u.address, u.city, u.state, u.pincode].filter(Boolean).join(", ");
          setForm((f) => ({
            ...f,
            phone: f.phone || u.phone || "",
            address: f.address || fullAddress,
          }));
        }
      } catch (err) {
        console.error("Failed to prefill profile details:", err);
      }
    };
    loadCart();
  }, [router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = coupon ? coupon.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(form.phone.trim())) newErrors.phone = "Enter a valid 10-digit phone number.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) newErrors.email = "Enter a valid email.";
    if (!form.address.trim()) newErrors.address = "Delivery address is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const goToTracking = (hasProducts, hasServices) => {
  if (hasProducts && hasServices) router.push("/trackorder?mixed=1");
  else if (hasProducts) router.push("/trackorder");
  else if (hasServices) router.push("/trackservice");
};

const handlePlaceOrder = async (e) => {
  e.preventDefault();
  if (!validate() || paying) return;
  setPaying(true);

  const { success, message, hasProducts, hasServices, razorpay } =
    await createOrderFromCart(items, { ...form, couponCode: coupon?.code || "" });
  if (!success) {
    setPaying(false);
    alert(message || "Could not place the order. Please try again.");
    return;
  }

  if (form.paymentMethod !== "razorpay") {
    await clearCart();
    goToTracking(hasProducts, hasServices);
    return;
  }

  if (!window.Razorpay) {
    await abortRazorpayPayment(razorpay.orderId);
    setPaying(false);
    alert("Payment gateway failed to load. Please refresh and try again.");
    return;
  }

  const rzp = new window.Razorpay({
    key: razorpay.keyId,
    amount: razorpay.amount,
    currency: razorpay.currency,
    order_id: razorpay.orderId,
    name: "Geomaticx",
    description: "Order payment",
    prefill: { name: form.name, email: form.email, contact: form.phone },
    theme: { color: "#2f6f4e" },
    handler: async (response) => {
      const v = await verifyRazorpayPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
      if (!v.success) {
        setPaying(false);
        alert(v.message || "Payment could not be verified. If money was deducted, please contact support.");
        return;
      }
      await clearCart();
      goToTracking(hasProducts, hasServices);
    },
    modal: {
      ondismiss: async () => {
        await abortRazorpayPayment(razorpay.orderId); 
        setPaying(false);
      },
    },
  });
  rzp.on("payment.failed", (resp) => {
    alert(resp.error?.description || "Payment failed. You can retry in the popup.");
  });
  rzp.open();
};

  if (items.length === 0) return null;

  return (
    <main className="checkout-page">
      <div className="checkout-breadcrumb">
        <Link href="/">Home</Link> <span>›</span>{" "}
        <Link href="/cart">Cart</Link> <span>›</span> <span>Checkout</span>
      </div>

      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-layout">
        {/* Left: form */}
        <form className="checkout-form" onSubmit={handlePlaceOrder}>
          <h3 className="checkout-section-title">Contact & Delivery Details</h3>

          <div className="checkout-field">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && <span className="checkout-error">{errors.name}</span>}
          </div>

          <div className="checkout-field-row">
            <div className="checkout-field">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              {errors.phone && <span className="checkout-error">{errors.phone}</span>}
            </div>

            <div className="checkout-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email && <span className="checkout-error">{errors.email}</span>}
            </div>
          </div>

          <div className="checkout-field">
            <label>Delivery Address</label>
            <textarea
              rows={3}
              placeholder="House no, street, area, city, state, PIN code"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
            {errors.address && <span className="checkout-error">{errors.address}</span>}
          </div>

          <h3 className="checkout-section-title">Payment Method</h3>

          <div className="checkout-payment-options">
            <label className={`checkout-payment-option ${form.paymentMethod === "cod" ? "selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                checked={form.paymentMethod === "cod"}
                onChange={() => handleChange("paymentMethod", "cod")}
              />
              <span>💰 Cash on Delivery</span>
            </label>

            <label className={`checkout-payment-option ${form.paymentMethod === "razorpay" ? "selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                checked={form.paymentMethod === "razorpay"}
                onChange={() => handleChange("paymentMethod", "razorpay")}
              />
              <span>💳 Pay Online (UPI / Card / Net Banking / Wallets)</span>
            </label>
          </div>

        <button type="submit" className="checkout-place-order-btn" disabled={paying}>
          {paying ? "Please wait..." : form.paymentMethod === "razorpay" ? `Pay ₹${total.toLocaleString("en-IN")}` : "Place Order"}
        </button>
        </form>

        {/* Right: order summary */}
        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="checkout-summary-items">
            {items.map((item) => (
              <div key={item.cartItemId} className="checkout-summary-item">
                <img src={item.image} alt={item.name} />
                <div className="checkout-summary-item-info">
                  <p className="checkout-summary-item-name">{item.name}</p>
                  <p className="checkout-summary-item-qty">Qty: {item.quantity}</p>
                </div>
                <p className="checkout-summary-item-price">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
          <div className="checkout-summary-divider" />
          {coupon && (
            <div className="checkout-summary-total">
              <span>Coupon ({coupon.code})</span>
              <span>- ₹{discount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}