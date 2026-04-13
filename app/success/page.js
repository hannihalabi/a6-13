import Link from "next/link";

export const metadata = {
  title: "Betalning genomförd - MediShop",
};

export default function SuccessPage() {
  return (
    <>
      <nav className="nav" style={{ justifyContent: "center" }}>
        <Link href="/" className="brand">MediShop</Link>
      </nav>

      <main className="success-page">
        <div style={{ width: "min(560px, calc(100% - 48px))", margin: "0 auto" }}>
          <section className="success-box">
            <span className="checkmark" aria-hidden="true">✓</span>
            <h1>Tack för din beställning!</h1>
            <p>
              Din betalning är genomförd. Du får en bekräftelse via e-post när
              Stripe har avslutat behandlingen.
            </p>
            <Link href="/" className="button button-primary">
              Tillbaka till butiken
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
