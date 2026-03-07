import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { endorseSchema, parseOrError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = parseOrError(endorseSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { targetUserId, action } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.dailySwipesLeft <= 0) {
      return { error: "PROTOCOL LIMIT REACHED", status: 403 } as const;
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        dailySwipesLeft: { decrement: 1 },
        lastSwipeDate: new Date(),
      },
    });

    if (action === "PASS") {
      await tx.pass.upsert({
        where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId } },
        create: { fromUserId: userId, toUserId: targetUserId },
        update: {},
      });
      return { result: "PASSED" } as const;
    }

    await tx.endorsement.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId } },
      create: { fromUserId: userId, toUserId: targetUserId },
      update: {},
    });

    const mutual = await tx.endorsement.findUnique({
      where: { fromUserId_toUserId: { fromUserId: targetUserId, toUserId: userId } },
    });

    if (mutual) {
      const expiresAt = new Date(Date.now() + 120 * 3_600_000);
      const match = await tx.match.create({
        data: { user1Id: userId, user2Id: targetUserId, status: "ACTIVE", expiresAt },
      });
      return { result: "MATCHED", matchId: match.id } as const;
    }

    return { result: "ENDORSED" } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
