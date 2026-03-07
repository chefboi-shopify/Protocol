import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  const [totalMatches, activeMatches, protocolsSet, expiredMatches, debriefsFiled] =
    await Promise.all([
      prisma.match.count({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      }),
      prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: "PROTOCOL_SET",
        },
      }),
      prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: "EXPIRED",
        },
      }),
      prisma.debrief.count({
        where: { userId },
      }),
    ]);

  return NextResponse.json({
    profile: {
      id: user.id,
      name: user.name,
      age: user.age,
      fiscalArchetype: user.fiscalArchetype,
      reliabilityScore: Math.max(0, Math.min(100, user.reliabilityScore)),
      dailySwipesLeft: user.dailySwipesLeft,
      createdAt: user.createdAt.toISOString(),
      stats: {
        totalMatches,
        activeMatches,
        protocolsSet,
        debriefsFiled,
        expiredMatches,
      },
    },
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("protocol-user-id");
  return NextResponse.json({ ok: true });
}
