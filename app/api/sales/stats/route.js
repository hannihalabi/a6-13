import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Stripe from "stripe";

export const runtime = "nodejs";

const SALES_TOKEN = process.env.SALES_TOKEN;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sales_token")?.value;

  if (!token || token !== SALES_TOKEN) {
    return NextResponse.json({ error: "Ej behörig." }, { status: 401 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });

  try {
    // Hämta senaste 100 checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ["data.line_items"],
    });

    const completed = sessions.data.filter((s) => s.status === "complete");
    const expired = sessions.data.filter((s) => s.status === "expired");
    const open = sessions.data.filter((s) => s.status === "open");

    const totalRevenue = completed.reduce(
      (sum, s) => sum + (s.amount_total || 0),
      0
    );

    const recentOrders = completed.slice(0, 20).map((s) => ({
      id: s.id,
      date: s.created,
      amount: s.amount_total,
      currency: s.currency,
      customerEmail: s.customer_details?.email || null,
      products:
        s.line_items?.data?.map((li) => ({
          name: li.description || li.price?.product,
          quantity: li.quantity,
          amount: li.amount_total,
        })) || [],
    }));

    return NextResponse.json({
      completedCount: completed.length,
      abandonedCount: expired.length,
      openCount: open.length,
      totalRevenue,
      recentOrders,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Stripe-fel." },
      { status: 500 }
    );
  }
}
