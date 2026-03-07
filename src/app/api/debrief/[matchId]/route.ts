import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { matchId } = await params;
  const { showed, rating, note } = await req.json();

  if (typeof showed !== "boolean") {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });

  if (!match) {
    return NextResponse.json({ error: "MATCH_NOT_FOUND" }, { status: 404 });
  }

  const debrief = await prisma.debrief.upsert({
    where: {
      matchId_userId: { matchId, userId },
    },
    create: {
      matchId,
      userId,
      showed,
      rating: rating ?? 0,
      note: note || null,
    },
    update: {
      showed,
      rating: rating ?? 0,
      note: note || null,
    },
  });

  const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;

  if (!showed) {
    await prisma.user.update({
      where: { id: otherId },
      data: { reliabilityScore: { decrement: 15 } },
    });
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ debrief });
}
