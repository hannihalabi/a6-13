"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatSEK(ore) {
  return (ore / 100).toLocaleString("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  });
}

function formatDate(unix) {
  return new Date(unix * 1000).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SalesDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sales/stats")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/sales");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fel vid hämtning.");
        setStats(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/sales/login", { method: "DELETE" });
    router.push("/sales");
  }

  const conversionRate =
    stats && stats.completedCount + stats.abandonedCount > 0
      ? Math.round(
          (stats.completedCount /
            (stats.completedCount + stats.abandonedCount)) *
            100
        )
      : null;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link href="/" className="brand">MediShop</Link>
        <div className="admin-header-right">
          <span className="admin-badge">Försäljning</span>
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container" style={{ maxWidth: "900px" }}>
          <div className="admin-title-block">
            <h1>Försäljningsöversikt</h1>
            <p>Data hämtad direkt från Stripe — senaste 100 sessioner.</p>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--clay)" }}>
              Laddar statistik...
            </div>
          )}

          {error && (
            <div className="admin-error" role="alert" style={{ marginBottom: "24px" }}>
              {error}
            </div>
          )}

          {stats && (
            <>
              {/* KPI-kort */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                <div className="admin-card" style={{ padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--olive)" }}>
                    {formatSEK(stats.totalRevenue)}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(15,45,94,0.55)", marginTop: "6px" }}>
                    Total omsättning
                  </div>
                </div>

                <div className="admin-card" style={{ padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--olive)" }}>
                    {stats.completedCount}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(15,45,94,0.55)", marginTop: "6px" }}>
                    Genomförda köp
                  </div>
                </div>

                <div className="admin-card" style={{ padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "#e05a2b" }}>
                    {stats.abandonedCount}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(15,45,94,0.55)", marginTop: "6px" }}>
                    Avbrutna (nådde checkout)
                  </div>
                </div>

                {conversionRate !== null && (
                  <div className="admin-card" style={{ padding: "24px", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: conversionRate >= 50 ? "var(--olive)" : "#e05a2b" }}>
                      {conversionRate}%
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(15,45,94,0.55)", marginTop: "6px" }}>
                      Konverteringsgrad
                    </div>
                  </div>
                )}
              </div>

              {/* Info om avbrutna */}
              {stats.abandonedCount > 0 && (
                <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "24px", background: "rgba(224,90,43,0.06)", border: "1px solid rgba(224,90,43,0.18)" }}>
                  <p style={{ fontSize: "0.9rem", color: "#b84a1e" }}>
                    <strong>{stats.abandonedCount} personer</strong> nådde Stripe checkout men genomförde inte betalningen.
                    {stats.openCount > 0 && ` ${stats.openCount} session${stats.openCount === 1 ? "" : "er"} är fortfarande öppen.`}
                  </p>
                </div>
              )}

              {/* Senaste ordrar */}
              <div className="admin-card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--stone)" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Senaste genomförda köp</h2>
                </div>

                {stats.recentOrders.length === 0 ? (
                  <div style={{ padding: "32px 24px", textAlign: "center", color: "rgba(15,45,94,0.45)", fontSize: "0.9rem" }}>
                    Inga genomförda köp ännu.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                      <thead>
                        <tr style={{ background: "var(--sand)" }}>
                          <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 600, color: "rgba(15,45,94,0.6)", fontSize: "0.8rem", letterSpacing: "0.04em" }}>DATUM</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "rgba(15,45,94,0.6)", fontSize: "0.8rem", letterSpacing: "0.04em" }}>PRODUKT</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "rgba(15,45,94,0.6)", fontSize: "0.8rem", letterSpacing: "0.04em" }}>KUND</th>
                          <th style={{ padding: "12px 24px", textAlign: "right", fontWeight: 600, color: "rgba(15,45,94,0.6)", fontSize: "0.8rem", letterSpacing: "0.04em" }}>BELOPP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map((order, i) => (
                          <tr key={order.id} style={{ borderTop: "1px solid var(--stone)", background: i % 2 === 0 ? "white" : "var(--sand)" }}>
                            <td style={{ padding: "14px 24px", color: "rgba(15,45,94,0.65)", whiteSpace: "nowrap" }}>
                              {formatDate(order.date)}
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              {order.products.length > 0
                                ? order.products.map((p) => (
                                    <div key={p.name} style={{ lineHeight: 1.4 }}>
                                      {p.name}
                                      {p.quantity > 1 && <span style={{ color: "rgba(15,45,94,0.5)", fontSize: "0.85em" }}> ×{p.quantity}</span>}
                                    </div>
                                  ))
                                : <span style={{ color: "rgba(15,45,94,0.4)" }}>—</span>}
                            </td>
                            <td style={{ padding: "14px 16px", color: "rgba(15,45,94,0.65)", fontSize: "0.88rem" }}>
                              {order.customerEmail || <span style={{ color: "rgba(15,45,94,0.3)" }}>—</span>}
                            </td>
                            <td style={{ padding: "14px 24px", textAlign: "right", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>
                              {formatSEK(order.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
