import Link from "next/link";

export const metadata = {
  title: "Betalning genomförd - MediShop",
};

export default function SuccessPage() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            Medi<span>Shop</span>
          </Link>
        </div>
      </header>

      <main className="success-page">
        <div className="container">
          <section className="success-box">
            <span className="checkmark" aria-hidden="true">
              ✓
            </span>
            <h1>Tack för din beställning!</h1>
            <p>
              Din betalning är genomförd. Du får en bekräftelse via e-post när
              Stripe har avslutat behandlingen.
            </p>
            <Link href="/" className="btn btn-primary">
              Tillbaka till butiken
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
