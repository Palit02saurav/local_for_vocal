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
import "./cart.css";

/* ---------- SVG ICONS (Lucide-style, 24x24) ---------- */
const ICONS = {
  bag: (<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>),
  wrench: (<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />),
  bolt: (<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />),
  trash: (<><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></>),
  tag: (<><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".6" fill="currentColor" /></>),
  file: (<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>),
  lock: (<><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  arrowRight: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  arrowLeft: (<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>),
  info: (<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>),
  shield: (<><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>),
  refresh: (<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>),
  truck: (<><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></>),
  store: (<><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8" /><path d="M10 20v-5h4v5" /></>),
  card: (<><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /><path d="M6 15h4" /></>),
  wallet: (<><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></>),
  bank: (<><path d="M3 22h18" /><path d="M6 18v-7" /><path d="M10 18v-7" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M12 2 20 7H4z" /></>),
};

function Icon({ name, size = 20, stroke = 1.8, fill = "none" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
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

/* UPI-style double arrow (orange + green) */
function UpiMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3l9 9-9 9h4l9-9-9-9z" fill="#f08a24" />
      <path d="M2 3l9 9-9 9h4l9-9-9-9z" fill="#1f9d55" transform="translate(7 0) scale(.85) translate(-2 2)" opacity=".95" />
    </svg>
  );
}

/* Shopping cart illustration for the banner */
function CartArt() {
  return (
    <svg className="ct-hero-art" viewBox="0 0 330 170" fill="none" aria-hidden="true">
      {/* leaves */}
      <path d="M20 160C8 108 40 58 92 36C108 88 86 138 20 160Z" fill="#2f8f5b" opacity=".85" />
      <path d="M62 168C52 118 84 76 140 58C150 106 118 152 62 168Z" fill="#1b5e3b" />
      <path d="M312 160C330 118 318 66 286 28C260 74 270 126 312 160Z" fill="#3a9d68" opacity=".9" />
      {/* bags */}
      <rect x="236" y="62" width="52" height="98" rx="4" fill="#176b43" />
      <path d="M250 62c0-18 24-18 24 0" stroke="#0f4a2e" strokeWidth="3" fill="none" />
      <rect x="272" y="48" width="46" height="112" rx="4" fill="#e3b97d" />
      <path d="M284 48c0-20 22-20 22 0" stroke="#b98a4c" strokeWidth="3" fill="none" />
      {/* boxes in cart */}
      <rect x="96" y="38" width="46" height="38" fill="#e1b47c" />
      <rect x="96" y="38" width="46" height="9" fill="#f0cf9f" />
      <rect x="142" y="24" width="52" height="52" fill="#d29a57" />
      <rect x="142" y="24" width="52" height="11" fill="#e8b97f" />
      <rect x="164" y="24" width="8" height="52" fill="#f5e7cf" opacity=".8" />
      {/* basket */}
      <path d="M64 74H224L202 130H86Z" fill="#ffffff" fillOpacity=".55" stroke="#9aa5a0" strokeWidth="3" strokeLinejoin="round" />
      <path d="M78 74l8 56M104 74l5 56M130 74l3 56M157 74v56M184 74l-3 56M210 74l-8 56" stroke="#b6bfba" strokeWidth="2" />
      <path d="M72 92H216M79 111H209" stroke="#b6bfba" strokeWidth="2" />
      {/* handle + frame */}
      <path d="M64 74L50 40H22" stroke="#8f9a95" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M86 130L96 146H196" stroke="#8f9a95" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="104" cy="156" r="8" fill="#37413c" />
      <circle cx="190" cy="156" r="8" fill="#37413c" />
    </svg>
  );
}

const FALLBACK_IMG = "https://placehold.co/200x200?text=No+Image";
const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const qtyOf = (arr) => arr.reduce((s, i) => s + i.quantity, 0);
const sumOf = (arr) => arr.reduce((s, i) => s + i.price * i.quantity, 0);

/* One section (Products / Services / 10-Min) */
function CartSection({ title, icon, tone, column, items, onQty, onRemove, hideQty = false }) {
  return (
    <section className={`ct-section ${tone}`}>
      <div className="ct-section-head">
        <Icon name={icon} size={24} fill={icon === "bolt" ? "currentColor" : "none"} />
        <h3>{title} ({qtyOf(items)})</h3>
      </div>

      <div className="ct-table-head">
        <span>{column}</span>
        <span>Price</span>
        <span>Quantity</span>
        <span>Total</span>
        <span />
      </div>

      {items.map((item) => (
        <div key={item.cartItemId} className="ct-row">
          <div className="ct-row-product">
            <img
              src={item.image}
              alt={item.name}
              className="ct-row-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMG;
              }}
            />
            <div>
              <p className="ct-row-name">{item.name}</p>
              {item.isFreshDelivery ? (
                <span className="ct-fresh-badge">
                  <Icon name="bolt" size={14} fill="currentColor" stroke={1.4} />
                  10-Min Delivery
                </span>
              ) : (
                <p className="ct-row-seller">{item.seller}</p>
              )}
            </div>
          </div>

          <span className="ct-row-price">{item.price > 0 ? inr(item.price) : "—"}</span>

          {hideQty ? (
            <span className="ct-row-price">{item.quantity}</span>
          ) : (
            <div className="ct-qty">
              <button onClick={() => onQty(item.cartItemId, -1)} aria-label="Decrease quantity">−</button>
              <span>{item.quantity}</span>
              <button onClick={() => onQty(item.cartItemId, 1)} aria-label="Increase quantity">+</button>
            </div>
          )}

          <span className="ct-row-total">{item.price > 0 ? inr(item.price * item.quantity) : "—"}</span>

          <button className="ct-row-remove" onClick={() => onRemove(item.cartItemId)} aria-label="Remove item">
            <Icon name="trash" size={20} />
          </button>
        </div>
      ))}
    </section>
  );
}

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

  const productItems = items.filter((i) => (i.type || "product") === "product" && !i.isFreshDelivery);
  const serviceItems = items.filter((i) => i.type === "service");
  const tenMinItems = items.filter((i) => i.isFreshDelivery);

  const subtotal = sumOf(items);
  const deliveryFee = 0; // TODO: plug in real delivery fee logic
  const discount = 0;    // TODO: plug in promo code logic
  const total = subtotal + deliveryFee - discount;

  return (
    <main className="ct-page">
      {/* ---------- Banner ---------- */}
      <section className="ct-hero">
        <div className="ct-hero-text">
          <div className="ct-breadcrumb">
            <Link href="/">Home</Link> <span>›</span> <span>My Cart</span>
          </div>
          <h1 className="ct-title">My Cart ({items.length})</h1>
          <p className="ct-subtitle">Review your items before checkout.</p>
        </div>
        <Link href="/shop" className="ct-continue">
          <Icon name="arrowLeft" size={16} stroke={2} />
          Continue Shopping
        </Link>
        <CartArt />
      </section>

      {items.length === 0 ? (
        <div className="ct-empty">
          <p className="ct-empty-icon">🛒</p>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link href="/shop" className="ct-empty-btn">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="ct-content">
            {/* ---------- Left ---------- */}
            <div className="ct-left">
              {productItems.length > 0 && (
                <CartSection
                  title="Products" icon="bag" tone="green" column="Product"
                  items={productItems} onQty={handleQtyChange} onRemove={handleRemove}
                />
              )}
              {serviceItems.length > 0 && (
                <CartSection
                  title="Services" icon="wrench" tone="blue" column="Service"
                  items={serviceItems} onQty={handleQtyChange} onRemove={handleRemove}
                  hideQty
                />
              )}
              {tenMinItems.length > 0 && (
                <CartSection
                  title="10-Min Fresh Delivery" icon="bolt" tone="orange" column="Business"
                  items={tenMinItems} onQty={handleQtyChange} onRemove={handleRemove}
                />
              )}

              <div className="ct-promo">
                <div className="ct-promo-input">
                  <Icon name="tag" size={22} />
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                </div>
                <button className="ct-apply">Apply</button>
                <button className="ct-clear" onClick={handleClearCart}>
                  <Icon name="trash" size={18} />
                  Clear Cart
                </button>
              </div>
            </div>

            {/* ---------- Right: summary ---------- */}
            <aside className="ct-summary">
              <div className="ct-summary-head">
                <Icon name="file" size={26} />
                <h3>Order Summary</h3>
              </div>

              <div className="ct-sum-rows">
                {productItems.length > 0 && (
                  <div className="ct-sum-row"><span>Products ({qtyOf(productItems)})</span><span>{inr(sumOf(productItems))}</span></div>
                )}
                {serviceItems.length > 0 && (
                  <div className="ct-sum-row"><span>Services ({qtyOf(serviceItems)})</span><span>{inr(sumOf(serviceItems))}</span></div>
                )}
                {tenMinItems.length > 0 && (
                  <div className="ct-sum-row"><span>10-Min Delivery ({qtyOf(tenMinItems)})</span><span>{inr(sumOf(tenMinItems))}</span></div>
                )}
              </div>

              <div className="ct-sum-divider" />

              <div className="ct-sum-rows">
                <div className="ct-sum-row strong"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
                <div className="ct-sum-row">
                  <span className="ct-sum-info">Delivery Fee <Icon name="info" size={15} /></span>
                  <span>{inr(deliveryFee)}</span>
                </div>
                <div className="ct-sum-row"><span>Discount</span><span>- {inr(discount)}</span></div>
              </div>

              <div className="ct-total">
                <span>Total Amount</span>
                <strong>{inr(total)}</strong>
              </div>

              <button className="ct-checkout" disabled={items.length === 0} onClick={handleCheckout}>
                <Icon name="lock" size={20} fill="currentColor" stroke={1.4} />
                Proceed to Checkout
                <Icon name="arrowRight" size={20} stroke={2.2} />
              </button>

              <div className="ct-accept-title"><span>We Accept</span></div>
              <div className="ct-accept">
                <div><span className="ct-pay blue"><Icon name="card" size={24} fill="#2f5fd0" stroke={1.4} /></span><small>Cards</small></div>
                <div><span className="ct-pay"><UpiMark /></span><small>UPI</small></div>
                <div><span className="ct-pay indigo"><Icon name="wallet" size={24} /></span><small>Wallets</small></div>
                <div><span className="ct-pay blue"><Icon name="bank" size={24} /></span><small>Net Banking</small></div>
              </div>

              <div className="ct-secure">
                <Icon name="shield" size={24} />
                Your payment information is safe and secure.
              </div>
            </aside>
          </div>

          {/* ---------- Perks ---------- */}
          <div className="ct-perks">
            <div className="ct-perk">
              <Icon name="store" size={34} stroke={1.6} />
              <div><strong>Support Local</strong><span>Shop from local businesses</span></div>
            </div>
            <div className="ct-perk">
              <Icon name="shield" size={34} stroke={1.6} />
              <div><strong>Secure Payments</strong><span>100% safe and encrypted</span></div>
            </div>
            <div className="ct-perk">
              <Icon name="refresh" size={34} stroke={1.6} />
              <div><strong>Easy Returns</strong><span>Hassle-free returns</span></div>
            </div>
            <div className="ct-perk">
              <Icon name="truck" size={34} stroke={1.6} />
              <div><strong>Fast Delivery</strong><span>Get your order quickly</span></div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}