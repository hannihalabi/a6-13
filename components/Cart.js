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
          <span className="cart-badge">{totalCount}</span>
        )}
      </button>

      <CartFullscreen open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CartFullscreen({ open, onClose }) {
  const { items, totalAmount, increment, decrement, removeItem, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

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

  if (!open || !mounted) return null;

  return createPortal(
    <div className="cart-fullscreen" role="dialog" aria-modal="true" aria-label="Varukorg">
      {/* Header */}
      <div className="cart-fs-header">
        <button
          type="button"
          className="cart-fs-back"
          onClick={onClose}
          aria-label="Tillbaka"
        >
          <BackIcon />
        </button>
        <h1 className="cart-fs-title">Varukorg</h1>
      </div>

      {/* Content */}
      <div className="cart-fs-body">
        {items.length === 0 ? (
          <div className="cart-fs-empty">
            <CartIcon size={48} />
            <p>Varukorgen är tom</p>
            <button type="button" className="cart-fs-back-link" onClick={onClose}>
              Fortsätt handla
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-fs-items">
              {items.map((item) => (
                <li key={item.product} className="cart-fs-item">
                  <div className="cart-fs-item-top">
                    <span className="cart-fs-item-name">{item.product}</span>
                    <button
                      type="button"
                      className="cart-fs-remove"
                      onClick={() => removeItem(item.product)}
                      aria-label="Ta bort"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="cart-fs-item-bottom">
                    <div className="cart-fs-qty-row">
                      <button
                        type="button"
                        className="cart-fs-qty-btn"
                        onClick={() => decrement(item.product)}
                        aria-label="Minska"
                      >
                        −
                      </button>
                      <span className="cart-fs-qty">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-fs-qty-btn"
                        onClick={() => increment(item.product)}
                        aria-label="Öka"
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-fs-item-price">
                      {formatSEK(item.amount * item.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="cart-fs-clear"
              onClick={clear}
            >
              Töm varukorg
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="cart-fs-footer">
          {error && <p className="cart-fs-error">{error}</p>}
          <div className="cart-fs-total">
            <span>Totalt</span>
            <strong>{formatSEK(totalAmount)}</strong>
          </div>
          <button
            type="button"
            className="cart-fs-checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Skickar..." : "Gå till betalning"}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
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
