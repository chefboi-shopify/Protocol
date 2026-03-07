import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { matchId } = await params;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: { id: true, name: true, fiscalArchetype: true } },
      user2: { select: { id: true, name: true, fiscalArchetype: true } },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "MATCH_NOT_FOUND" }, { status: 404 });
  }

  const other = match.user1Id === userId ? match.user2 : match.user1;

  return NextResponse.json({
    match: {
      id: match.id,
      status: match.status,
      expiresAt: match.expiresAt.toISOString(),
      protocolDate: match.protocolDate?.toISOString().split("T")[0] ?? null,
      protocolTime: match.protocolTime,
      protocolLocation: match.protocolLocation,
      protocolNote: match.protocolNote,
      other,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { matchId } = await params;
  const { date, time, location, note } = await req.json();

  if (!date || !time || !location) {
    return NextResponse.json({ error: "MISSING FIELDS" }, { status: 400 });
  }

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: { in: ["ACTIVE", "PROTOCOL_SET"] },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "MATCH_NOT_FOUND" }, { status: 404 });
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "PROTOCOL_SET",
      protocolDate: new Date(date),
      protocolTime: time,
      protocolLocation: location,
      protocolNote: note || null,
      protocolSetBy: userId,
      protocolSetAt: new Date(),
    },
  });

  return NextResponse.json({ match: updated });
}
