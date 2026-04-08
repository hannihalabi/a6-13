import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY saknas i miljo-variablerna." },
      { status: 500 }
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Kunde inte lasa request-body." },
      { status: 400 }
    );
  }

  const { product, amount, currency = "sek" } = payload;

  if (
    typeof product !== "string" ||
    !product.trim() ||
    !Number.isInteger(amount) ||
    amount < 1 ||
    typeof currency !== "string" ||
    !currency.trim()
  ) {
    return NextResponse.json(
      { error: "Ogiltig produktdata skickades till checkout." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const baseUrl = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: product.trim(),
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/#products`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kunde inte skapa checkout-session.",
      },
      { status: 500 }
    );
  }
}
