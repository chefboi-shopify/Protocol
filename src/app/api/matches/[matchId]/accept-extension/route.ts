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
      extensionRequestedBy: { not: null },
      extensionApplied: false,
    },
  });

  if (!match) return NextResponse.json({ error: "NO_PENDING_EXTENSION" }, { status: 404 });

  // The accepting user must be the OTHER person (not the requester)
  if (match.extensionRequestedBy === userId) {
    return NextResponse.json({ error: "CANNOT_ACCEPT_OWN_REQUEST" }, { status: 400 });
  }

  const isUser1 = match.user1Id === userId;
  const stripe = getStripe();

  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "PROTOCOL — 72h Extension (Accept)" },
          unit_amount: EXTENSION_FEE,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${APP_URL}/chat/${matchId}?extension=accepted`,
      cancel_url: `${APP_URL}/chat/${matchId}`,
      metadata: { matchId, userId, role: isUser1 ? "user1" : "user2", type: "extension_accept" },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  }

  // Dev mode: apply extension directly
  const newExpiry = new Date(match.expiresAt.getTime() + 72 * 3_600_000);

  await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(isUser1 ? { extensionUser1Paid: true } : { extensionUser2Paid: true }),
      extensionApplied: true,
      expiresAt: newExpiry,
    },
  });

  await prisma.message.create({
    data: {
      matchId,
      senderId: userId,
      content: `✅ Extension accepted. 72 hours added. New deadline: ${newExpiry.toLocaleString()}. Now schedule the meeting.`,
      isSystem: true,
    },
  });

  return NextResponse.json({ ok: true, newExpiresAt: newExpiry.toISOString(), devMode: true });
}
