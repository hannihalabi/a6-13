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
          Stäng
        </button>
      </div>
    </div>
  );
}

function createProductId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Storefront({ groupedProducts, singleProducts }) {
  const [pendingProduct, setPendingProduct] = useState("");
  const [modalContent, setModalContent] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  const catalogSections = [
    {
      id: "core-range",
      eyebrow: "Utvalt sortiment",
      title: "Hitta rätt upplägg snabbare",
      description:
        "Varje produktkort är byggt som ett lugnt steg-för-steg-flöde där kunden väljer mängd först och ser priset efter sitt val.",
      products: groupedProducts.map((group) => ({
        id: createProductId(group.name),
        category: group.badge,
        name: group.name,
        description: group.description,
        options: group.options,
      })),
    },
    {
      id: "support-range",
      eyebrow: "Kompletterande produkter",
      title: "Samma tydliga checkout för mindre artiklar",
      description:
        "Produkter med ett enda format behåller samma interaktion, men med ett enklare avslut för snabb checkout.",
      products: singleProducts.map((product) => ({
        id: createProductId(product.name),
        category: product.badge,
        name: product.name,
        description: product.description,
        options: [
          {
            product: product.product,
            quantityLabel: "Standard",
            priceLabel: product.priceLabel,
            amount: product.amount,
            featured: true,
          },
        ],
      })),
    },
  ];

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
          "Lägg till NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY för att aktivera checkout i Next.js-appen.",
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
            : "Något gick fel. Försök igen eller kontakta support.",
      });
    } finally {
      setPendingProduct("");
    }
  }

  function selectOption(productId, optionProduct) {
    setSelectedOptions((current) => ({
      ...current,
      [productId]: optionProduct,
    }));
  }

  const currentYear = new Date().getFullYear();

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            Medi<span>Shop</span>
          </Link>
          <nav className="site-nav" aria-label="Primär navigation">
            <a href="#products">Produkter</a>
          </nav>
        </div>
      </header>

      <main>
        <section id="products" className="products-section">
          <div className="container">
            {catalogSections.map((section, sectionIndex) => (
              <div className="catalog-section" key={section.id}>
                <div className="section-heading section-heading-left">
                  <p className="section-kicker">{section.eyebrow}</p>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>

                <div className="catalog-list">
                  {section.products.map((product, productIndex) => {
                    const selectedProductKey = selectedOptions[product.id];
                    const selectedOption = product.options.find(
                      (option) => option.product === selectedProductKey
                    );
                    const activeOption = selectedOption || null;
                    const isSingleOption = product.options.length === 1;
                    const totalIndex = `${sectionIndex + 1}.${productIndex + 1}`;

                    return (
                      <article
                        className="catalog-card"
                        id={product.id}
                        key={product.id}
                      >
                        <div className="catalog-visual">
                          <span className="catalog-index">{totalIndex}</span>
                          <div className="visual-panel">
                            <span className="visual-badge">{product.category}</span>
                            <div className="visual-orb visual-orb-one" />
                            <div className="visual-orb visual-orb-two" />
                            <div className="visual-copy">
                              <strong>{product.name}</strong>
                              <span>
                                {isSingleOption
                                  ? "Enkelt standardval"
                                  : `${product.options.length} olika mängder`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="catalog-content">
                          <div className="product-header">
                            <span className="badge">{product.category}</span>
                            <h3>{product.name}</h3>
                            <p className="product-desc">{product.description}</p>
                          </div>

                          <div className="selector-shell">
                            <div className="selector-header">
                              <span>{isSingleOption ? "Välj format" : "Välj mängd"}</span>
                              <span className="selector-note">
                                {activeOption
                                  ? `Pris visas för ${activeOption.quantityLabel}`
                                  : "Pris visas efter ditt val"}
                              </span>
                            </div>

                            <div className="option-pills" role="list">
                              {product.options.map((option) => {
                                const isSelected =
                                  activeOption?.product === option.product;

                                return (
                                  <button
                                    type="button"
                                    className={`option-pill${isSelected ? " active" : ""}`}
                                    key={option.product}
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                      selectOption(product.id, option.product)
                                    }
                                  >
                                    <span>{option.quantityLabel}</span>
                                    {option.featured ? (
                                      <small>Rekommenderad</small>
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div
                            className={`selection-drawer${activeOption ? " active" : ""}`}
                          >
                            {activeOption ? (
                              <>
                                <div className="selection-copy">
                                  <span className="selection-kicker">Vald mängd</span>
                                  <h4>{activeOption.quantityLabel}</h4>
                                  <p>
                                    {isSingleOption
                                      ? "Du har valt standardformatet. Pris och checkout är nu klara."
                                      : "Byt enkelt mellan mängder utan att förlora ditt steg i köpflödet."}
                                  </p>
                                </div>

                                <div className="selection-actions">
                                  <span className="selection-price">
                                    {activeOption.priceLabel}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn-buy"
                                    disabled={pendingProduct === activeOption.product}
                                    onClick={() =>
                                      checkout(
                                        activeOption.product,
                                        activeOption.amount
                                      )
                                    }
                                  >
                                    {pendingProduct === activeOption.product
                                      ? "Skickar..."
                                      : "Gå till checkout"}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p className="selection-placeholder">
                                Klicka på en mängd ovanför för att visa pris och
                                fortsätta till checkout.
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>&copy; {currentYear} MediShop. Alla rättigheter förbehållna.</p>
        </div>
      </footer>

      <Modal content={modalContent} onClose={() => setModalContent(null)} />
    </>
  );
}
