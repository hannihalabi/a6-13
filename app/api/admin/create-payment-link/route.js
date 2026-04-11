import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request) {
  const token = request.cookies.get("admin_token")?.value;
  const validToken = process.env.ADMIN_TOKEN;

  if (!validToken || token !== validToken) {
    return NextResponse.json({ error: "Ej behörig." }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY saknas." },
      { status: 500 }
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig request." }, { status: 400 });
  }

  const { product, amount, currency = "sek" } = payload;

  if (
    typeof product !== "string" ||
    !product.trim() ||
    !Number.isInteger(amount) ||
    amount < 1 ||
    typeof currency !== "string"
  ) {
    return NextResponse.json({ error: "Ogiltig produktdata." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const price = await stripe.prices.create({
      currency: currency.toLowerCase(),
      unit_amount: amount,
      product_data: {
        name: product.trim(),
      },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      payment_method_types: ["card", "klarna"],
      after_completion: {
        type: "redirect",
        redirect: { url: `${new URL(request.url).origin}/success` },
      },
    });

    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kunde inte skapa betalningslänk.",
      },
      { status: 500 }
    );
  }
}
