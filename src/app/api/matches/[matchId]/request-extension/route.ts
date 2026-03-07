import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getStripe, EXTENSION_FEE, APP_URL } from "@/lib/stripe";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { matchId } = await params;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: "ACTIVE",
    },
  });

  if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Only allow extension request in the last 24 hours
  const hoursLeft = (match.expiresAt.getTime() - Date.now()) / 3_600_000;
  if (hoursLeft > 24) {
    return NextResponse.json({
      error: "TOO_EARLY",
      message: "Extension requests unlock at the 24-hour mark.",
    }, { status: 400 });
  }

  if (match.extensionApplied) {
    return NextResponse.json({ error: "ALREADY_EXTENDED" }, { status: 400 });
  }

  if (match.extensionRequestedBy) {
    return NextResponse.json({ error: "EXTENSION_ALREADY_REQUESTED" }, { status: 400 });
  }

  const stripe = getStripe();
  const isUser1 = match.user1Id === userId;

  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "PROTOCOL — 72h Extension (Logistics Tariff)" },
          unit_amount: EXTENSION_FEE,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${APP_URL}/chat/${matchId}?extension=requested`,
      cancel_url: `${APP_URL}/chat/${matchId}`,
      metadata: { matchId, userId, role: isUser1 ? "user1" : "user2", type: "extension_request" },
    });

    await prisma.match.update({
      where: { id: matchId },
      data: {
        extensionRequestedBy: userId,
        extensionRequestedAt: new Date(),
        ...(isUser1 ? { extensionUser1Paid: true, extensionStripeId1: session.id } : { extensionUser2Paid: true, extensionStripeId2: session.id }),
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  }

  // Dev mode: skip Stripe, mark as paid directly
  await prisma.match.update({
    where: { id: matchId },
    data: {
      extensionRequestedBy: userId,
      extensionRequestedAt: new Date(),
      ...(isUser1 ? { extensionUser1Paid: true } : { extensionUser2Paid: true }),
    },
  });

  // Create system message to notify the other user
  await prisma.message.create({
    data: {
      matchId,
      senderId: userId,
      content: `⏳ Your match has paid $${(EXTENSION_FEE / 100).toFixed(2)} to extend this sprint by 72 hours. Pay the same to accept, or let the match expire. This is a penalty for failing to meet — stop texting and schedule the meeting.`,
      isSystem: true,
    },
  });

  return NextResponse.json({ ok: true, devMode: true });
}
