"use client";

import { useState } from "react";
import "./payment.css";

// const INITIAL_ITEMS = [
//   {
//     id: 1,
//     name: "Amul Buffalo Milk",
//     variant: "1 L Pack",
//     qty: 2,
//     unitPrice: 65,
//     img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80",
//   },
//   {
//     id: 2,
//     name: "Fresh Vegetables",
//     variant: "1 kg",
//     qty: 1,
//     unitPrice: 30,
//     img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80",
//   },
//   {
//     id: 3,
//     name: "Fresh Fruits",
//     variant: "1 kg",
//     qty: 1,
//     unitPrice: 60,
//     img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80",
//   },
// ];

// const DELIVERY_CHARGE = 25;

const INITIAL_ITEMS = [];

const DELIVERY_CHARGE = 0;

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "💳" },
  { id: "upi", label: "UPI", icon: "🔺" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
  { id: "wallet", label: "Wallets", icon: "👛" },
];

export default function Payment() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [method, setMethod] = useState("card");
  const [saveCard, setSaveCard] = useState(true);
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });

  const updateQty = (id, delta) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
    );
  };

  const itemTotal = items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
  const totalAmount = itemTotal + DELIVERY_CHARGE;
  const itemCount = items.reduce((sum, it) => sum + it.qty, 0);

  const handleCardChange = (field, value) => {
    setCard((c) => ({ ...c, [field]: value }));
  };

  const handlePay = (e) => {
    e.preventDefault();
    alert(`This is a demo page — no real payment was made.\nTotal: ₹${totalAmount}`);
  };

  return (
    <main className="pay-page">
      <div className="pay-steps">
        <div className="pay-step done">
          <span className="pay-step-circle">✓</span>
          <span className="pay-step-label">Cart</span>
        </div>
        <div className="pay-step-line done" />
        <div className="pay-step active">
          <span className="pay-step-circle">2</span>
          <span className="pay-step-label">Payment</span>
        </div>
        <div className="pay-step-line" />
        <div className="pay-step">
          <span className="pay-step-circle">3</span>
          <span className="pay-step-label">Review &amp; Place Order</span>
        </div>
      </div>

      <div className="pay-body">
        <section className="pay-main">
          <h1 className="pay-title">Payment</h1>
          <p className="pay-subtitle">Choose a secure payment method to complete your order</p>

          <div className="pay-layout">
            <div className="pay-methods">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`pay-method-btn ${method === m.id ? "selected" : ""}`}
                  onClick={() => setMethod(m.id)}
                >
                  <span className="pay-method-icon">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <form className="pay-form-panel" onSubmit={handlePay}>
              {method === "card" && (
                <>
                  <div className="pay-form-title-row">
                    <h3>Pay with Credit / Debit Card</h3>
                    <div className="pay-card-brands">
                      <span>VISA</span>
                      <span>●●</span>
                      <span>RuPay</span>
                    </div>
                  </div>

                  <div className="pay-field">
                    <label>Card Number</label>
                    <div className="pay-input-with-icon">
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={card.number}
                        onChange={(e) => handleCardChange("number", e.target.value)}
                      />
                      <span className="pay-input-icon">💳</span>
                    </div>
                  </div>

                  <div className="pay-field-row">
                    <div className="pay-field">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={card.expiry}
                        onChange={(e) => handleCardChange("expiry", e.target.value)}
                      />
                    </div>
                    <div className="pay-field">
                      <label>CVV</label>
                      <div className="pay-input-with-icon">
                        <input
                          type="text"
                          placeholder="123"
                          value={card.cvv}
                          onChange={(e) => handleCardChange("cvv", e.target.value)}
                        />
                        <span className="pay-input-icon">❔</span>
                      </div>
                    </div>
                  </div>

                  <div className="pay-field">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Name on Card"
                      value={card.name}
                      onChange={(e) => handleCardChange("name", e.target.value)}
                    />
                  </div>

                  <label className="pay-save-card">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                    />
                    Save this card for future payments
                  </label>
                </>
              )}

              {method !== "card" && (
                <div className="pay-other-method">
                  <p>
                    You'll be redirected to complete your payment via{" "}
                    {PAYMENT_METHODS.find((m) => m.id === method)?.label}.
                  </p>
                </div>
              )}

              <button type="submit" className="pay-submit-btn">
                🔒 Pay ₹{totalAmount}
              </button>

              <div className="pay-or-divider">
                <span>OR PAY WITH</span>
              </div>

              <div className="pay-quick-methods">
                <button type="button" className="pay-quick-btn">
                  🔺 UPI
                </button>
                <button type="button" className="pay-quick-btn">
                  🏦 Net Banking
                </button>
                <button type="button" className="pay-quick-btn">
                  👛 Wallets
                </button>
                <button type="button" className="pay-quick-btn">
                  💰 Cash on Delivery
                </button>
              </div>
            </form>
          </div>

          <div className="pay-trust-row">
            <div className="pay-trust-item">
              <span>🛡️</span>
              <div>
                <p>100% Secure Payments</p>
                <span>Your data is protected</span>
              </div>
            </div>
            <div className="pay-trust-item">
              <span>✔️</span>
              <div>
                <p>Trusted by 1M+ Customers</p>
                <span>Safe and reliable</span>
              </div>
            </div>
            <div className="pay-trust-item">
              <span>🚚</span>
              <div>
                <p>Easy Returns</p>
                <span>Hassle free returns</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="pay-summary">
          <div className="pay-summary-header">
            <h3>Order Summary</h3>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Edit Cart
            </a>
          </div>
          <p className="pay-summary-count">{items.length} Items</p>

          <div className="pay-summary-items">
            {items.map((it) => (
              <div key={it.id} className="pay-summary-item">
                <img src={it.img} alt={it.name} />
                <div className="pay-summary-item-info">
                  <p className="pay-summary-item-name">{it.name}</p>
                  <p className="pay-summary-item-variant">{it.variant}</p>
                  <div className="pay-qty-control">
                    <button type="button" onClick={() => updateQty(it.id, -1)}>
                      −
                    </button>
                    <span>{it.qty}</span>
                    <button type="button" onClick={() => updateQty(it.id, 1)}>
                      +
                    </button>
                  </div>
                </div>
                <div className="pay-summary-item-price">
                  <p>₹{it.unitPrice * it.qty}</p>
                  <span>₹{it.unitPrice} each</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pay-summary-divider" />

          <div className="pay-summary-row">
            <span>Item Total</span>
            <span>₹{itemTotal}</span>
          </div>
          <div className="pay-summary-row">
            <span>Delivery Charge</span>
            <span>₹{DELIVERY_CHARGE}</span>
          </div>
          <div className="pay-summary-row promo">
            <span>Promo Code Applied</span>
            <span>- ₹0</span>
          </div>

          <div className="pay-summary-total">
            <span>Total Amount</span>
            <span>₹{totalAmount}</span>
          </div>

          <div className="pay-delivery-box">
            <span className="pay-delivery-icon">🚚</span>
            <div>
              <p>Estimated Delivery</p>
              <span>Tomorrow, 10 AM - 1 PM</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}