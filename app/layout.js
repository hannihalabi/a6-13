import "./globals.css";
import { Space_Grotesk, Fraunces } from "next/font/google";
import { CartProvider } from "../context/CartContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "MediShop",
  description: "Medicinsk kvalitet du kan lita på med säker checkout via Stripe.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv" className={`${spaceGrotesk.variable} ${fraunces.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
