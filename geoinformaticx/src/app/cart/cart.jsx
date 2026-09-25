"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCart,
  removeFromCart,
  updateCartQuantity,
  clearCart as clearCartStore,
} from "@/lib/cart";
import { isLoggedIn } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/orders";
import "./cart.css";

const FREE_DELIVERY_THRESHOLD = 5000;
const DELIVERY_CHARGE = 60;
const PACKAGING_CHARGE = 20;

export default function Cart() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [promoCode, setPromoCode] = useState("");

  useEffect(() => {
    const syncCart = async () => setItems(await getCart());
    syncCart();
    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = items.length === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const packaging = items.length === 0 ? 0 : PACKAGING_CHARGE;
  const total = subtotal + delivery + packaging;

  const freeDeliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const amountLeftForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const handleQtyChange = async (cartItemId, delta) => {
    const item = items.find((i) => i.cartItemId === cartItemId);
    if (!item) return;
    await updateCartQuantity(cartItemId, item.quantity + delta);
    setItems(await getCart());
  };

  const handleRemove = async (cartItemId) => {
    await removeFromCart(cartItemId);
    setItems(await getCart());
  };

  const handleClearCart = async () => {
    await clearCartStore();
    setItems([]);
  };

  const handleCheckout = () => {
    if (!isLoggedIn()) {
      router.push("/login?redirect=/cart");
      return;
    }
    if (items.length === 0) return;
    router.push("/checkout");
  };

  const productItems = items.filter((item) => (item.type || "product") === "product" && !item.isFreshDelivery);
  const serviceItems = items.filter((item) => item.type === "service");
  const tenMinItems = items.filter((item) => item.isFreshDelivery);
  return (
    <main className="cart-page">
      {/* Breadcrumb */}
      <div className="cart-breadcrumb">
        <Link href="/">Home</Link> <span>›</span>
        <span>My Cart</span>
      </div>

      <div className="cart-header">
        <div>
          <h1 className="cart-title">My Cart ({items.length})</h1>
          <p className="cart-subtitle">Review your items before checkout</p>
        </div>
        <Link href="/shop" className="cart-continue-btn">
          ← Continue Shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p className="cart-empty-icon">🛒</p>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link href="/shop" className="cart-continue-btn cart-continue-btn-solid">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          {/* Left: items table */}
          <div className="cart-items-col">
            {productItems.length > 0 && (
              <>
                <h3 className="cart-section-title">
                  Products ({productItems.reduce((s, i) => s + i.quantity, 0)})
                </h3>
                <div className="cart-table">
                  <div className="cart-table-header">
                    <span>Product</span>
                    <span>Price</span>
                    <span>Quantity</span>
                    <span>Total</span>
                    <span></span>
                  </div>

                  {productItems.map((item) => (
                    <div key={item.cartItemId} className="cart-row">
                      <div className="cart-row-product">
                        <img src={item.image} alt={item.name} className="cart-row-img" />
                        <div>
                          <p className="cart-row-name">{item.name}</p>
                          <p className="cart-row-seller">
                            {item.seller} {item.verified && <span className="cart-row-verified">✓</span>}
                          </p>
                        </div>
                      </div>

                      <span className="cart-row-price">₹{item.price.toLocaleString("en-IN")}</span>

                      <div className="cart-row-qty">
                        <button onClick={() => handleQtyChange(item.cartItemId, -1)} aria-label="Decrease quantity">−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleQtyChange(item.cartItemId, 1)} aria-label="Increase quantity">+</button>
                      </div>

                      <span className="cart-row-total">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>

                      <button
                        className="cart-row-remove"
                        onClick={() => handleRemove(item.cartItemId)}
                        aria-label="Remove item"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {serviceItems.length > 0 && (
              <>
                <h3 className="cart-section-title cart-section-services">
                  Services ({serviceItems.reduce((s, i) => s + i.quantity, 0)})
                </h3>
                <div className="cart-table">
                  <div className="cart-table-header">
                    <span>Service</span>
                    <span>Price</span>
                    <span>Quantity</span>
                    <span>Total</span>
                    <span></span>
                  </div>

                  {serviceItems.map((item) => (
                    <div key={item.cartItemId} className="cart-row">
                      <div className="cart-row-product">
                        <img src={item.image} alt={item.name} className="cart-row-img" />
                        <div>
                          <p className="cart-row-name">{item.name}</p>
                          <p className="cart-row-seller">
                            {item.seller} {item.verified && <span className="cart-row-verified">✓</span>}
                          </p>
                        </div>
                      </div>

                      <span className="cart-row-price">₹{item.price.toLocaleString("en-IN")}</span>

                      <div className="cart-row-qty">
                        <button onClick={() => handleQtyChange(item.cartItemId, -1)} aria-label="Decrease quantity">−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleQtyChange(item.cartItemId, 1)} aria-label="Increase quantity">+</button>
                      </div>

                      <span className="cart-row-total">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>

                      <button
                        className="cart-row-remove"
                        onClick={() => handleRemove(item.cartItemId)}
                        aria-label="Remove item"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {tenMinItems.length > 0 && (
              <>
                <h3 className="cart-section-title cart-section-10min">
                  ⚡ 10-Min Fresh Delivery ({tenMinItems.reduce((s, i) => s + i.quantity, 0)})
                </h3>
                <div className="cart-table">
                  <div className="cart-table-header">
                    <span>Business</span>
                    <span>Price</span>
                    <span>Quantity</span>
                    <span>Total</span>
                    <span></span>
                  </div>

                  {tenMinItems.map((item) => (
                    <div key={item.cartItemId} className="cart-row cart-row-10min">
                      <div className="cart-row-product">
                        <img src={item.image} alt={item.name} className="cart-row-img" />
                        <div>
                          <p className="cart-row-name">{item.name}</p>
                          <p className="cart-row-seller">
                            <span className="cart-row-10min-badge">⚡ 10-Min Delivery</span>
                          </p>
                        </div>
                      </div>

                      <span className="cart-row-price">{item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "—"}</span>

                      <div className="cart-row-qty">
                        <button onClick={() => handleQtyChange(item.cartItemId, -1)} aria-label="Decrease quantity">−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleQtyChange(item.cartItemId, 1)} aria-label="Increase quantity">+</button>
                      </div>

                      <span className="cart-row-total">
                        {item.price > 0 ? `₹${(item.price * item.quantity).toLocaleString("en-IN")}` : "—"}
                      </span>

                      <button
                        className="cart-row-remove"
                        onClick={() => handleRemove(item.cartItemId)}
                        aria-label="Remove item"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="cart-promo-row">
              <input type="text" placeholder="Enter promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              <button className="cart-apply-btn">Apply</button>
              <button className="cart-clear-btn" onClick={handleClearCart}>
                Clear Cart
              </button>
            </div>

            <div className="cart-perks-strip">
              <div className="cart-perk"><span>🏘️</span> Support Local</div>
              <div className="cart-perk"><span>🔒</span> Secure Payments</div>
              <div className="cart-perk"><span>↺</span> Easy Returns</div>
              <div className="cart-perk"><span>🚚</span> Fast Delivery</div>
            </div>
          </div>

          {/* Right: order summary */}
          <aside className="cart-summary-col">
            <div className="cart-summary-card">
              <h3>Order Summary</h3>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="cart-summary-row">
                <span>Delivery</span>
                <span>{delivery === 0 ? "Free" : `₹${delivery}`}</span>
              </div>
              <div className="cart-summary-row">
                <span>Packaging</span>
                <span>₹{packaging}</span>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              {amountLeftForFreeDelivery > 0 ? (
                <div className="cart-free-delivery">
                  <p>
                    Add <strong>₹{amountLeftForFreeDelivery.toLocaleString("en-IN")}</strong> more for free delivery
                  </p>
                  <div className="cart-progress-track">
                    <div className="cart-progress-fill" style={{ width: `${freeDeliveryProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="cart-free-delivery cart-free-delivery-earned">
                  🎉 You've unlocked free delivery!
                </div>
              )}

              <button
                className="cart-checkout-btn"
                disabled={items.length === 0}
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </button>

              <div className="cart-payment-icons">
                <span>💳</span><span>📱</span><span>🏦</span><span>💰</span>
              </div>

              <p className="cart-secure-note">🔒 Your payment information is safe and secure</p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}