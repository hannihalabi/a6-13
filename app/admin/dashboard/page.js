"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { groupedProducts, singleProducts } from "@/data/products";

const allProducts = [
  ...groupedProducts.flatMap((group) =>
    group.options.map((opt) => ({
      label: `${group.name} — ${opt.quantityLabel}`,
      product: opt.product,
      defaultAmount: opt.amount,
      badge: group.badge,
    }))
  ),
  ...singleProducts.map((p) => ({
    label: p.name,
    product: p.product,
    defaultAmount: p.amount,
    badge: p.badge,
  })),
];

function formatSEK(ore) {
  return (ore / 100).toLocaleString("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  });
}

export default function AdminDashboard() {
  const router = useRouter();

  const [selectedProduct, setSelectedProduct] = useState(allProducts[0]);
  const [customPrice, setCustomPrice] = useState(
    String(allProducts[0].defaultAmount / 100)
  );
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function handleProductChange(e) {
    const product = allProducts.find((p) => p.product === e.target.value);
    if (!product) return;
    setSelectedProduct(product);
    setCustomPrice(String(product.defaultAmount / 100));
    setGeneratedUrl("");
    setError("");
    setCopied(false);
  }

  function handlePriceChange(e) {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setCustomPrice(value);
    setGeneratedUrl("");
    setCopied(false);
  }

  async function handleGenerate() {
    setError("");
    setGeneratedUrl("");
    setCopied(false);

    const amount = parseInt(customPrice, 10) * 100;

    if (!customPrice || isNaN(amount) || amount < 100) {
      setError("Ange ett giltigt pris (minst 1 kr).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: selectedProduct.product,
          amount,
          currency: "sek",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin");
          return;
        }
        setError(data.error || "Något gick fel.");
        return;
      }

      setGeneratedUrl(data.url);
    } catch {
      setError("Nätverksfel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Kunde inte kopiera länken automatiskt.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin");
  }

  const priceInOre = parseInt(customPrice, 10) * 100;
  const priceIsValid = customPrice && !isNaN(priceInOre) && priceInOre >= 100;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link href="/" className="logo admin-logo">
          Medi<span>Shop</span>
        </Link>
        <div className="admin-header-right">
          <span className="admin-badge">Admin</span>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
          >
            Logga ut
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container">
          <div className="admin-title-block">
            <h1>Betalningslänkar</h1>
            <p>
              Välj en produkt, justera priset och generera en unik Stripe-länk
              att skicka till kunden.
            </p>
          </div>

          <div className="admin-card">
            <div className="admin-section">
              <label className="admin-label" htmlFor="product-select">
                Produkt
              </label>
              <div className="admin-select-wrapper">
                <select
                  id="product-select"
                  className="admin-select"
                  value={selectedProduct.product}
                  onChange={handleProductChange}
                >
                  {groupedProducts.map((group) => (
                    <optgroup key={group.name} label={group.name}>
                      {group.options.map((opt) => (
                        <option key={opt.product} value={opt.product}>
                          {opt.quantityLabel} — {opt.priceLabel}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <optgroup label="Kompletterande produkter">
                    {singleProducts.map((p) => (
                      <option key={p.product} value={p.product}>
                        {p.name} — {p.priceLabel}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span className="admin-select-arrow">▾</span>
              </div>
              <p className="admin-hint">
                Standardpris:{" "}
                <strong>{formatSEK(selectedProduct.defaultAmount)}</strong>
              </p>
            </div>

            <div className="admin-section">
              <label className="admin-label" htmlFor="price-input">
                Pris (kr)
              </label>
              <div className="admin-price-wrapper">
                <span className="admin-price-currency">kr</span>
                <input
                  id="price-input"
                  type="text"
                  inputMode="numeric"
                  className="admin-price-input"
                  value={customPrice}
                  onChange={handlePriceChange}
                  placeholder="0"
                />
              </div>
              {priceIsValid && (
                <p className="admin-hint">
                  Kunden betalar <strong>{formatSEK(priceInOre)}</strong>
                </p>
              )}
            </div>

            {error && (
              <div className="admin-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="button"
              className="admin-generate-btn"
              onClick={handleGenerate}
              disabled={loading || !priceIsValid}
            >
              {loading ? (
                <span className="admin-spinner-row">
                  <span className="admin-spinner" />
                  Genererar länk...
                </span>
              ) : (
                "Generera betalningslänk"
              )}
            </button>
          </div>

          {generatedUrl && (
            <div className="admin-result-card">
              <div className="admin-result-header">
                <span className="admin-result-icon">✓</span>
                <div>
                  <strong>Länken är klar</strong>
                  <p>Skicka denna länk direkt till kunden.</p>
                </div>
              </div>

              <div className="admin-result-url-row">
                <span className="admin-result-url">{generatedUrl}</span>
                <button
                  type="button"
                  className={`admin-copy-btn${copied ? " copied" : ""}`}
                  onClick={handleCopy}
                >
                  {copied ? "Kopierad!" : "Kopiera"}
                </button>
              </div>

              <div className="admin-result-meta">
                <span className="admin-meta-item">
                  <span className="admin-meta-label">Produkt</span>
                  <span>{selectedProduct.product}</span>
                </span>
                <span className="admin-meta-divider" />
                <span className="admin-meta-item">
                  <span className="admin-meta-label">Pris</span>
                  <span>{formatSEK(priceInOre)}</span>
                </span>
                <span className="admin-meta-divider" />
                <span className="admin-meta-item">
                  <span className="admin-meta-label">Betalning</span>
                  <span>Kort &amp; Klarna</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
