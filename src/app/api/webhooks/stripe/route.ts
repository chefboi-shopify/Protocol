import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 500 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  // Idempotency: skip events we've already processed
  const processedEvents = globalThis as unknown as { _stripeProcessed?: Set<string> };
  if (!processedEvents._stripeProcessed) processedEvents._stripeProcessed = new Set();
  if (processedEvents._stripeProcessed.has(event.id)) {
    return NextResponse.json({ received: true, deduplicated: true });
  }
  processedEvents._stripeProcessed.add(event.id);
  // Cap the set size to prevent memory leaks
  if (processedEvents._stripeProcessed.size > 10000) {
    const first = processedEvents._stripeProcessed.values().next().value;
    if (first) processedEvents._stripeProcessed.delete(first);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const { type, userId, matchId, role } = metadata;

    if (type === "season_pass" && userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionPaidAt: new Date(),
          subscriptionAmount: session.amount_total || 9000,
          stripeCustomerId: session.customer as string,
          stripeSessionId: session.id,
        },
      });
    }

    if (type === "extension_request" && matchId && userId && role) {
      const isUser1 = role === "user1";
      await prisma.match.update({
        where: { id: matchId },
        data: {
          extensionRequestedBy: userId,
          extensionRequestedAt: new Date(),
          ...(isUser1
            ? { extensionUser1Paid: true, extensionStripeId1: session.id }
            : { extensionUser2Paid: true, extensionStripeId2: session.id }),
        },
      });

      await prisma.message.create({
        data: {
          matchId,
          senderId: userId,
          content: `⏳ Your match has paid to extend this sprint by 72 hours. Pay the same to accept, or let the match expire. This is a penalty for failing to meet — stop texting and schedule the meeting.`,
          isSystem: true,
        },
      });
    }

    if (type === "extension_accept" && matchId && role) {
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (match) {
        const isUser1 = role === "user1";
        const newExpiry = new Date(match.expiresAt.getTime() + 72 * 3_600_000);

        await prisma.match.update({
          where: { id: matchId },
          data: {
            ...(isUser1
              ? { extensionUser1Paid: true, extensionStripeId1: session.id }
              : { extensionUser2Paid: true, extensionStripeId2: session.id }),
            extensionApplied: true,
            expiresAt: newExpiry,
          },
        });

        await prisma.message.create({
          data: {
            matchId,
            senderId: metadata.userId || match.user1Id,
            content: `✅ Extension accepted. 72 hours added. New deadline: ${newExpiry.toLocaleString()}. Now schedule the meeting.`,
            isSystem: true,
          },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
