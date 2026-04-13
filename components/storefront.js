"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { CartButton } from "./Cart";

function Modal({ content, onClose }) {
  if (!content) return null;
  return (
    <div
      className="modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div className="modal-box" role="dialog" aria-modal="true">
        <h3>{content.title}</h3>
        <p>{content.message}</p>
        <button type="button" className="button button-primary" onClick={onClose}>
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

export default function Storefront({ groupedProducts, singleProducts, bottomProducts = [] }) {
  const [modalContent, setModalContent] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [addedProduct, setAddedProduct] = useState("");
  const { addItem } = useCart();

  const mapGroup = (group) => ({
    id: createProductId(group.name),
    category: group.badge,
    name: group.name,
    description: group.description,
    image: group.image || null,
    options: group.options,
    defaultOption: group.options.find((o) => o.featured)?.product || null,
  });

  const mapSingle = (product) => ({
    id: createProductId(product.name),
    category: product.badge,
    name: product.name,
    description: product.description,
    image: product.image || null,
    options: [
      {
        product: product.product,
        quantityLabel: "Standard",
        priceLabel: product.priceLabel,
        amount: product.amount,
        featured: true,
      },
    ],
    defaultOption: product.product,
  });

  const mainProducts = [
    ...groupedProducts.map(mapGroup),
    ...singleProducts.map(mapSingle),
  ];

  const lastProducts = bottomProducts.map(mapGroup);

  const allProducts = [...mainProducts, ...lastProducts];

  // Sätt default-val för produkter som har ett rekommenderat alternativ
  useEffect(() => {
    const defaults = {};
    allProducts.forEach((p) => {
      if (p.defaultOption && !selectedOptions[p.id]) {
        defaults[p.id] = p.defaultOption;
      }
    });
    if (Object.keys(defaults).length > 0) {
      setSelectedOptions((prev) => ({ ...defaults, ...prev }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!modalContent) return undefined;
    const handleEscape = (e) => { if (e.key === "Escape") setModalContent(null); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalContent]);

  function handleAddToCart(option) {
    addItem({ product: option.product, amount: option.amount, priceLabel: option.priceLabel });
    setAddedProduct(option.product);
    setTimeout(() => setAddedProduct(""), 1500);
  }

  function selectOption(productId, optionProduct) {
    setSelectedOptions((current) => ({ ...current, [productId]: optionProduct }));
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="page">
      <div className="orb-mid" aria-hidden="true" />

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="nav">
        <Link href="/" className="brand">MediShop</Link>
        <div className="nav-actions">
          <Link href="/admin" className="button button-ghost" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
            Logga in
          </Link>
          <CartButton />
        </div>
      </nav>

      <div className="content">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-content">
            <span className="pill">Utvalda produkter</span>
            <h1 className="hero-title">Medicinsk kvalitet<br />du kan lita på</h1>
            <p className="hero-copy">
              Varje produkt är noggrant utvald för dig. Välj mängd, se pris och slutför köpet enkelt via Stripe.
            </p>
            <div className="hero-actions">
              <a href="#products" className="button button-primary">Se produkter</a>
              <Link href="/admin" className="button button-ghost">Logga in</Link>
            </div>
          </div>
        </section>

        {/* ── Product grid ──────────────────────────────────────── */}
        <section className="section" id="products">
          <div className="section-head">
            <h2>Alla produkter</h2>
            <p>Välj din produkt och mängd nedan. Priset visas direkt efter ditt val.</p>
          </div>

          <div className="grid">
            {allProducts.map((product) => {
              const selectedProductKey = selectedOptions[product.id];
              const selectedOption = product.options.find((o) => o.product === selectedProductKey);
              const activeOption = selectedOption || null;
              const isSingleOption = product.options.length === 1;

              return (
                <article className="card" key={product.id} id={product.id}>
                  <div className="card-body">
                    {/* Kicker */}
                    <span className="card-kicker">{product.category}</span>

                    {/* Promo box */}
                    <div className="card-promo">
                      <span className="card-promo-title">{product.name}</span>
                      <span className="card-promo-copy">{product.description}</span>
                    </div>

                    {/* Variant label */}
                    <div className="card-variant">
                      <span className="card-variant-label">
                        {isSingleOption ? "Format" : "Välj mängd"}
                      </span>

                      {/* Variant options */}
                      <div className="card-variant-options">
                        {product.options.map((option) => {
                          const isSelected = activeOption?.product === option.product;
                          return (
                            <button
                              key={option.product}
                              type="button"
                              className={`card-variant-option${isSelected ? " selected" : ""}`}
                              onClick={() => selectOption(product.id, option.product)}
                              aria-pressed={isSelected}
                            >
                              <span style={{ fontWeight: 600 }}>{option.quantityLabel}</span>
                              <span className="card-variant-meta">{option.priceLabel}</span>
                              {option.featured && (
                                <span className="card-variant-meta" style={{ color: "var(--olive)", fontWeight: 700 }}>Rekommenderad</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="card-meta">
                      {activeOption ? (
                        <>
                          <span className="price">{activeOption.priceLabel}</span>
                          <button
                            type="button"
                            className="button button-small"
                            onClick={() => handleAddToCart(activeOption)}
                          >
                            {addedProduct === activeOption.product ? "Lagd i varukorg ✓" : "Lägg i varukorg"}
                          </button>
                        </>
                      ) : (
                        <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
                          Klicka på en mängd ovanför för att visa pris och fortsätta.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="footer">
        <p>© {currentYear} MediShop. Säker betalning via Stripe.</p>
      </footer>

      <Modal content={modalContent} onClose={() => setModalContent(null)} />
    </div>
  );
}
