import "./globals.css";
import { CartProvider } from "../context/CartContext";

export const metadata = {
  title: "MediShop",
  description: "Medicinsk kvalitet du kan lita på med säker checkout via Stripe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
