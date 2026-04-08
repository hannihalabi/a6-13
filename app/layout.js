import "./globals.css";

export const metadata = {
  title: "MediShop",
  description: "Medicinsk kvalitet du kan lita på med säker checkout via Stripe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
