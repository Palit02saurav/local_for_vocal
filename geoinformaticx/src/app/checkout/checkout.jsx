"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCart, clearCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/orders";
import "./checkout.css";

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

  useEffect(() => {
    const loadCart = async () => {
      const cartItems = await getCart();
      if (cartItems.length === 0) {
        router.replace("/cart");
        return;
      }
      setItems(cartItems);

      const user = getCurrentUser();
      if (user) {
        setForm((f) => ({ ...f, name: user.name || "", email: user.email || "" }));
      }
    };
    loadCart();
  }, [router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { hasProducts, hasServices } = await createOrderFromCart(items, form);
    await clearCart();

    if (hasProducts && hasServices) {
      router.push("/trackorder?mixed=1");
    } else if (hasProducts) {
      router.push("/trackorder");
    } else if (hasServices) {
      router.push("/trackservice");
    }
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

            <label className={`checkout-payment-option ${form.paymentMethod === "upi" ? "selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                checked={form.paymentMethod === "upi"}
                onChange={() => handleChange("paymentMethod", "upi")}
              />
              <span>📱 UPI</span>
            </label>

            <label className={`checkout-payment-option ${form.paymentMethod === "card" ? "selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                checked={form.paymentMethod === "card"}
                onChange={() => handleChange("paymentMethod", "card")}
              />
              <span>💳 Credit / Debit Card</span>
            </label>
          </div>

          <button type="submit" className="checkout-place-order-btn">
            Place Order
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
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}