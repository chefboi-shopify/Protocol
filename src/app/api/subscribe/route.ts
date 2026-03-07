import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getStripe, SEASON_PASS_FEE, APP_URL } from "@/lib/stripe";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (user.subscriptionStatus === "ACTIVE") {
    return NextResponse.json({ error: "ALREADY_SUBSCRIBED" }, { status: 400 });
  }

  const stripe = getStripe();

  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "PROTOCOL — 90-Day Season Pass",
            description: "Full access to messaging, endorsements, and the Protocol. 30% refunded if you find your person.",
          },
          unit_amount: SEASON_PASS_FEE,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${APP_URL}/feed?subscribed=true`,
      cancel_url: `${APP_URL}/subscribe`,
      metadata: { userId, type: "season_pass" },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  }

  // Dev mode: activate subscription directly
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionPaidAt: new Date(),
      subscriptionAmount: SEASON_PASS_FEE,
    },
  });

  return NextResponse.json({ ok: true, devMode: true });
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true, subscriptionPaidAt: true, subscriptionAmount: true },
  });

  return NextResponse.json({ subscription: user });
}
