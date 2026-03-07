import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { log } from "@/lib/logger";

const FULL_PENALTY = 10;
const REDUCED_PENALTY = 3;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();

  // Atomic lock: claim expired ACTIVE matches by setting status to EXPIRING
  // This prevents concurrent cron invocations from double-processing
  const claimed = await prisma.match.updateMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    data: { status: "EXPIRING" },
  });

  let matchesExpired = 0;
  let penaltiesApplied = 0;
  let extensionRefunds = 0;

  if (claimed.count > 0) {
    const expiringMatches = await prisma.match.findMany({
      where: { status: "EXPIRING" },
      include: {
        user1: { select: { id: true, reliabilityScore: true } },
        user2: { select: { id: true, reliabilityScore: true } },
      },
    });

    for (const match of expiringMatches) {
      // Refund extension if one party paid but the other declined/ignored
      if (match.extensionRequestedBy && !match.extensionApplied) {
        const stripe = getStripe();
        if (stripe) {
          const sessionId = match.extensionStripeId1 || match.extensionStripeId2;
          if (sessionId) {
            try {
              const session = await stripe.checkout.sessions.retrieve(sessionId);
              if (session.payment_intent) {
                await stripe.refunds.create({ payment_intent: session.payment_intent as string });
                extensionRefunds++;
              }
            } catch { /* refund failed */ }
          }
        }
      }

      const user1Tried = match.user1TriedToSchedule;
      const user2Tried = match.user2TriedToSchedule;

      let user1Penalty = FULL_PENALTY;
      let user2Penalty = FULL_PENALTY;

      if (user1Tried && !user2Tried) {
        user1Penalty = REDUCED_PENALTY;
      } else if (user2Tried && !user1Tried) {
        user2Penalty = REDUCED_PENALTY;
      } else if (user1Tried && user2Tried) {
        user1Penalty = REDUCED_PENALTY;
        user2Penalty = REDUCED_PENALTY;
      }

      await prisma.$transaction([
        prisma.match.update({ where: { id: match.id }, data: { status: "EXPIRED" } }),
        prisma.user.update({
          where: { id: match.user1.id },
          data: { reliabilityScore: Math.max(0, match.user1.reliabilityScore - user1Penalty) },
        }),
        prisma.user.update({
          where: { id: match.user2.id },
          data: { reliabilityScore: Math.max(0, match.user2.reliabilityScore - user2Penalty) },
        }),
      ]);

      matchesExpired++;
      penaltiesApplied += 2;
    }
  }

  // Grace expiry for PROTOCOL_SET matches 48h past deadline (also atomic)
  const graceClaimed = await prisma.match.updateMany({
    where: { status: "PROTOCOL_SET", expiresAt: { lt: new Date(now.getTime() - 48 * 3_600_000) } },
    data: { status: "EXPIRED" },
  });
  matchesExpired += graceClaimed.count;

  log.info("cron:expire-matches completed", { matchesExpired, penaltiesApplied, extensionRefunds });
  return NextResponse.json({ ok: true, timestamp: now.toISOString(), matchesExpired, penaltiesApplied, extensionRefunds });
}
