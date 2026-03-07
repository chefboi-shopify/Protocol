import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getStripe, SEASON_PASS_FEE } from "@/lib/stripe";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { jointExitSchema, parseOrError } from "@/lib/validation";

// Generate a joint exit code
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Generate a unique 8-char code
  const code = randomBytes(4).toString("hex").toUpperCase();

  await prisma.user.update({
    where: { id: userId },
    data: { jointExitCode: code, jointExitPartner: null },
  });

  return NextResponse.json({ code });
}

// Confirm joint exit by entering partner's code
export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rawBody = await req.json();
  const parsed = parseOrError(jointExitSchema, rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Find the partner with this code
  const partner = await prisma.user.findFirst({
    where: {
      jointExitCode: code.toUpperCase(),
      id: { not: userId },
    },
  });

  if (!partner) {
    return NextResponse.json({ error: "INVALID_CODE" }, { status: 404 });
  }

  // Verify they actually matched
  const match = await prisma.match.findFirst({
    where: {
      OR: [
        { user1Id: userId, user2Id: partner.id },
        { user1Id: partner.id, user2Id: userId },
      ],
    },
  });

  if (!match) {
    return NextResponse.json({ error: "NO_MATCH_FOUND — You can only joint-exit with someone you matched with." }, { status: 400 });
  }

  // Process Stripe refunds before the DB transaction (external API)
  const stripe = getStripe();
  const refundAmount = Math.round(SEASON_PASS_FEE * 0.3);
  const refunds: string[] = [];

  if (stripe) {
    for (const target of [user, partner]) {
      if (target.stripeSessionId) {
        try {
          const session = await stripe.checkout.sessions.retrieve(target.stripeSessionId);
          if (session.payment_intent) {
            const refund = await stripe.refunds.create({
              payment_intent: session.payment_intent as string,
              amount: refundAmount,
            });
            refunds.push(`${target.id === userId ? "User" : "Partner"} refund: $${(refund.amount / 100).toFixed(2)}`);
          }
        } catch { /* refund failed — non-blocking */ }
      }
    }
  }

  // Cascade delete in a single transaction for data integrity
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { jointExitPartner: partner.id } });
    await tx.user.update({ where: { id: partner.id }, data: { jointExitPartner: userId } });

    for (const uid of [userId, partner.id]) {
      await tx.message.deleteMany({ where: { senderId: uid } });
      await tx.debrief.deleteMany({ where: { userId: uid } });
      await tx.endorsement.deleteMany({ where: { fromUserId: uid } });
      await tx.pass.deleteMany({ where: { fromUserId: uid } });
    }

    const allMatchIds = await tx.match.findMany({
      where: { OR: [{ user1Id: { in: [userId, partner.id] } }, { user2Id: { in: [userId, partner.id] } }] },
      select: { id: true },
    });
    const mIds = allMatchIds.map((m) => m.id);
    if (mIds.length > 0) {
      await tx.message.deleteMany({ where: { matchId: { in: mIds } } });
      await tx.debrief.deleteMany({ where: { matchId: { in: mIds } } });
      await tx.match.deleteMany({ where: { id: { in: mIds } } });
    }

    await tx.user.delete({ where: { id: userId } });
    await tx.user.delete({ where: { id: partner.id } });
  });

  const cookieStore = await cookies();
  cookieStore.delete("protocol-user-id");

  return NextResponse.json({
    ok: true,
    refundPerPerson: `$${(refundAmount / 100).toFixed(2)}`,
    refunds: refunds.length > 0 ? refunds : ["Dev mode — no Stripe refunds processed."],
  });
}
