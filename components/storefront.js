"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_live_51TD0dkGcQBBi7wtgTGqXyI9GJ5Hgtubz7MAY38xNwc4yrMMiUDhMSdUbcjgGy23Wi1xiVqpWUJwbE0OUS3g3kdNI00sy2XavLd";

let stripePromise;

function getStripeClient() {
  if (!PUBLISHABLE_KEY || typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = new Promise((resolve, reject) => {
      const resolveStripe = () => {
        if (!window.Stripe) {
          reject(new Error("Stripe.js kunde inte initieras."));
          return;
        }

        resolve(window.Stripe(PUBLISHABLE_KEY));
      };

      if (window.Stripe) {
        resolveStripe();
        return;
      }

      const existingScript = document.querySelector(
        'script[data-stripe-loader="true"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", resolveStripe, { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Kunde inte ladda Stripe.js.")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.dataset.stripeLoader = "true";
      script.onload = resolveStripe;
      script.onerror = () =>
        reject(new Error("Kunde inte ladda Stripe.js."));

      document.head.appendChild(script);
    });
  }

  return stripePromise;
}

function Modal({ content, onClose }) {
  if (!content) {
    return null;
  }

  return (
    <div
      className="modal"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div className="modal-box" role="dialog" aria-modal="true">
        <h3>{content.title}</h3>
        <p>{content.message}</p>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Stang
        </button>
      </div>
    </div>
  );
}

export default function Storefront({ groupedProducts, singleProducts }) {
  const [pendingProduct, setPendingProduct] = useState("");
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    if (!modalContent) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setModalContent(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalContent]);

  async function checkout(productName, amountInOre) {
    if (!PUBLISHABLE_KEY) {
      setModalContent({
        title: "Stripe ej konfigurerat",
        message:
          "Lagg till NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for att aktivera checkout i Next.js-appen.",
      });
      return;
    }

    setPendingProduct(productName);

    try {
      const stripe = await getStripeClient();

      if (!stripe) {
        throw new Error("Stripe.js kunde inte laddas.");
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: productName,
          amount: amountInOre,
          currency: "sek",
        }),
      });

      let payload = {};

      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(
          payload.error || "Serverfel vid skapande av checkout-session."
        );
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: payload.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setModalContent({
        title: "Checkout misslyckades",
        message:
          error instanceof Error
            ? error.message
            : "Nagot gick fel. Forsok igen eller kontakta support.",
      });
    } finally {
      setPendingProduct("");
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            Medi<span>Shop</span>
          </Link>
          <nav className="site-nav" aria-label="Primar navigation">
            <a href="#products">Produkter</a>
            <a href="#contact">Kontakt</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-panel">
              <p className="hero-kicker">Medicinsk kvalitet online</p>
              <h1>Medicinsk kvalitet du kan lita pa</h1>
              <p className="hero-copy">
                Sakra produkter med snabb leverans till dorren och Stripe-checkout
                direkt i en riktig Next.js-app.
              </p>
              <a href="#products" className="btn btn-light">
                Se produkter
              </a>
            </div>
          </div>
        </section>

        <section id="products" className="products-section">
          <div className="container">
            <div className="section-heading">
              <h2>Vara produkter</h2>
              <p>Valj det antal som passar dina behov och ga vidare till checkout.</p>
            </div>

            {groupedProducts.map((group) => (
              <article className="product-card" key={group.name}>
                <div className="product-header">
                  <span className="badge">{group.badge}</span>
                  <h3>{group.name}</h3>
                  <p className="product-desc">{group.description}</p>
                </div>

                <div className="price-grid">
                  {group.options.map((option) => {
                    const isPending = pendingProduct === option.product;

                    return (
                      <div
                        className={`price-option${option.featured ? " featured" : ""}`}
                        key={option.product}
                      >
                        {option.featured ? (
                          <span className="badge-featured">Popular</span>
                        ) : null}
                        <span className="qty">{option.quantityLabel}</span>
                        <span className="price">{option.priceLabel}</span>
                        <button
                          type="button"
                          className="btn-buy"
                          disabled={isPending}
                          onClick={() => checkout(option.product, option.amount)}
                        >
                          {isPending ? "Skickar..." : "Kop"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}

            <div className="single-products">
              {singleProducts.map((product) => {
                const isPending = pendingProduct === product.product;

                return (
                  <article className="product-card single" key={product.product}>
                    <div className="product-header">
                      <span className="badge">{product.badge}</span>
                      <h3>{product.name}</h3>
                      <p className="product-desc">{product.description}</p>
                    </div>

                    <div className="single-footer">
                      <span className="price-big">{product.priceLabel}</span>
                      <button
                        type="button"
                        className="btn-buy"
                        disabled={isPending}
                        onClick={() => checkout(product.product, product.amount)}
                      >
                        {isPending ? "Skickar..." : "Kop nu"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="container">
            <div className="contact-card">
              <h2>Kontakt</h2>
              <p>Har du fragor? Hor av dig till oss sa hjalper vi dig vidare.</p>
              <a href="mailto:info@medishop.se" className="btn btn-light">
                Skicka e-post
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>&copy; {currentYear} MediShop. Alla rattigheter forbehallna.</p>
        </div>
      </footer>

      <Modal content={modalContent} onClose={() => setModalContent(null)} />
    </>
  );
}
