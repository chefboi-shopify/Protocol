import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: { in: ["ACTIVE", "PROTOCOL_SET"] },
    },
    include: {
      user1: { select: { id: true, name: true, fiscalArchetype: true, videoUrl: true } },
      user2: { select: { id: true, name: true, fiscalArchetype: true, videoUrl: true } },
      messages: { select: { id: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { expiresAt: "asc" },
  });

  const result = matches.map((m) => {
    const other = m.user1Id === userId ? m.user2 : m.user1;
    return {
      id: m.id,
      status: m.status,
      expiresAt: m.expiresAt.toISOString(),
      createdAt: m.createdAt.toISOString(),
      messageCount: m.messages.length,
      other,
    };
  });

  return NextResponse.json({ matches: result });
}
