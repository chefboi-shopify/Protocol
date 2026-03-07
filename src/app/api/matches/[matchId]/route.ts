import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { matchId } = await params;
  const { status } = await req.json();

  if (status !== "PROTOCOL_SET") {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: "ACTIVE",
    },
  });

  if (!match) {
    return NextResponse.json({ error: "MATCH_NOT_FOUND" }, { status: 404 });
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: "PROTOCOL_SET" },
  });

  return NextResponse.json({ match: updated });
}
