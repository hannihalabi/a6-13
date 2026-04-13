"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../context/CartContext";

function formatSEK(ore) {
  return (ore / 100).toLocaleString("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  });
}

let stripePromise;

function getStripeClient(publishableKey) {
  if (!publishableKey || typeof window === "undefined") return Promise.resolve(null);
  if (!stripePromise) {
    stripePromise = new Promise((resolve, reject) => {
      const resolveStripe = () => {
        if (!window.Stripe) { reject(new Error("Stripe.js kunde inte initieras.")); return; }
        resolve(window.Stripe(publishableKey));
      };
      if (window.Stripe) { resolveStripe(); return; }
      const existing = document.querySelector('script[data-stripe-loader="true"]');
      if (existing) {
        existing.addEventListener("load", resolveStripe, { once: true });
        existing.addEventListener("error", () => reject(new Error("Kunde inte ladda Stripe.js.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.dataset.stripeLoader = "true";
      script.onload = resolveStripe;
      script.onerror = () => reject(new Error("Kunde inte ladda Stripe.js."));
      document.head.appendChild(script);
    });
  }
  return stripePromise;
}

export function CartButton() {
  const { totalCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="cart-trigger"
        onClick={() => setOpen(true)}
        aria-label="Öppna varukorg"
      >
        <CartIcon />
        {totalCount > 0 && (
          <span className="cart-count">{totalCount}</span>
        )}
      </button>

      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CartDrawer({ open, onClose }) {
  const { items, totalAmount, increment, decrement, removeItem, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [discount, setDiscount] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  async function handleCheckout() {
    if (items.length === 0) return;
    setError("");
    setLoading(true);

    try {
      const stripe = await getStripeClient(publishableKey);
      if (!stripe) throw new Error("Stripe.js kunde inte laddas.");

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      let payload = {};
      try { payload = await response.json(); } catch {}

      if (!response.ok) {
        throw new Error(payload.error || "Serverfel vid skapande av checkout-session.");
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: payload.sessionId });
      if (stripeError) throw stripeError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className={`drawer${open ? " drawer-open" : ""}`}>
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="cart-panel" role="dialog" aria-modal="true" aria-label="Varukorg">
        {/* Header */}
        <div className="cart-header">
          <div>
            <h2 className="cart-title">Varukorg</h2>
            {items.length > 0 && (
              <p className="cart-subtitle">{items.length} {items.length === 1 ? "produkt" : "produkter"}</p>
            )}
          </div>
          <button
            type="button"
            className="button button-ghost"
            style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            onClick={onClose}
            aria-label="Stäng varukorg"
          >
            Stäng
          </button>
        </div>

        {/* Items */}
        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <p className="muted">Varukorgen är tom</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.product}</span>
                  <div className="qty-controls">
                    <button
                      type="button"
                      className="button button-ghost"
                      style={{ fontSize: "1rem", padding: "4px 12px", minHeight: "unset" }}
                      onClick={() => decrement(item.product)}
                      aria-label="Minska"
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 700, minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                    <button
                      type="button"
                      className="button button-ghost"
                      style={{ fontSize: "1rem", padding: "4px 12px", minHeight: "unset" }}
                      onClick={() => increment(item.product)}
                      aria-label="Öka"
                    >
                      +
                    </button>
                    <span style={{ marginLeft: "auto", fontWeight: 600 }}>
                      {formatSEK(item.amount * item.quantity)}
                    </span>
                    <button
                      type="button"
                      className="button-link"
                      style={{ background: "none", border: "none", color: "rgba(15,45,94,0.45)", cursor: "pointer", fontSize: "0.8rem" }}
                      onClick={() => removeItem(item.product)}
                      aria-label="Ta bort"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-footer">
            {/* Rabattkod */}
            <div className="cart-discount">
              <label htmlFor="discount-code">Rabattkod</label>
              <div className="discount-input">
                <input
                  id="discount-code"
                  type="text"
                  placeholder="Ange kod"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
                <button
                  type="button"
                  className="button button-small"
                  onClick={() => {}}
                >
                  Använd
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="totals">
              <div className="totals-row totals-total">
                <span>Totalt</span>
                <span>{formatSEK(totalAmount)}</span>
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <button
              type="button"
              className="button button-primary"
              style={{ width: "100%", fontSize: "1rem", padding: "14px", minHeight: "unset" }}
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "Skickar..." : "Gå till betalning"}
            </button>

            <p className="footnote muted" style={{ textAlign: "center" }}>
              Säker betalning via Stripe
            </p>

            {items.length > 1 && (
              <button
                type="button"
                className="button-link"
                style={{ background: "none", border: "none", color: "rgba(15,45,94,0.4)", cursor: "pointer", fontSize: "0.8rem", alignSelf: "center" }}
                onClick={clear}
              >
                Töm varukorg
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function CartIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
