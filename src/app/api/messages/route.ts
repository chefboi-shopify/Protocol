import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getPusherServer } from "@/lib/pusher";
import { screenMessage, MAX_STRIKES, SHADOWBAN_HOURS } from "@/lib/chat-screening";
import { messageSchema, parseOrError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ error: "MISSING_MATCH_ID" }, { status: 400 });

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: { id: true, name: true, fiscalArchetype: true, videoUrl: true, attachmentStyle: true, socialBattery: true } },
      user2: { select: { id: true, name: true, fiscalArchetype: true, videoUrl: true, attachmentStyle: true, socialBattery: true } },
    },
  });

  if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10), 200);

  const messages = await prisma.message.findMany({
    where: { matchId, ...(cursor ? { createdAt: { gt: new Date(cursor) } } : {}) },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const nextCursor = messages.length === limit ? messages[messages.length - 1].createdAt.toISOString() : null;

  const other = match.user1Id === userId ? match.user2 : match.user1;

  return NextResponse.json({
    match: {
      id: match.id,
      status: match.status,
      expiresAt: match.expiresAt.toISOString(),
      extensionRequestedBy: match.extensionRequestedBy,
      extensionUser1Paid: match.extensionUser1Paid,
      extensionUser2Paid: match.extensionUser2Paid,
      extensionApplied: match.extensionApplied,
      other,
    },
    messages,
    nextCursor,
  });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Check subscription gate
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  if (user.subscriptionStatus !== "ACTIVE" && user.subscriptionStatus !== "NONE") {
    return NextResponse.json({ error: "SUBSCRIPTION_REQUIRED" }, { status: 403 });
  }

  // Check shadowban
  if (user.shadowBannedUntil && new Date() < user.shadowBannedUntil) {
    const hoursLeft = Math.ceil((user.shadowBannedUntil.getTime() - Date.now()) / 3_600_000);
    return NextResponse.json({
      error: "SHADOWBANNED",
      message: `You've been temporarily restricted for attempting to bypass the Protocol. ${hoursLeft}h remaining.`,
    }, { status: 403 });
  }

  const body = await req.json();
  const parsed = parseOrError(messageSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { matchId, content } = parsed.data;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: { in: ["ACTIVE", "PROTOCOL_SET"] },
    },
  });

  if (!match) return NextResponse.json({ error: "MATCH_NOT_FOUND" }, { status: 404 });

  if (new Date() > match.expiresAt && match.status !== "PROTOCOL_SET") {
    await prisma.match.update({ where: { id: matchId }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "PROTOCOL EXPIRED" }, { status: 410 });
  }

  // Screen the message
  const screening = screenMessage(content.trim());
  let strike = false;

  if (!screening.isClean) {
    strike = true;
    const newStrikes = user.chatStrikes + 1;
    const updateData: Record<string, unknown> = { chatStrikes: newStrikes };

    if (newStrikes >= MAX_STRIKES) {
      updateData.shadowBannedUntil = new Date(Date.now() + SHADOWBAN_HOURS * 3_600_000);
      updateData.chatStrikes = 0;
    }

    await prisma.user.update({ where: { id: userId }, data: updateData });
  }

  const message = await prisma.message.create({
    data: {
      matchId,
      senderId: userId,
      content: screening.isClean ? content.trim() : screening.sanitizedContent,
      isScreened: !screening.isClean,
    },
  });

  // Push real-time event
  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(`chat-${matchId}`, "new-message", {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      isScreened: message.isScreened,
      createdAt: message.createdAt,
    });
  }

  return NextResponse.json({
    message,
    ...(strike ? {
      warning: {
        type: "SCREENING_VIOLATION",
        message: `Attempting to share contact info bypasses the Protocol. ${MAX_STRIKES - (user.chatStrikes + 1)} strikes remaining before temporary restriction.`,
        violations: screening.violations,
        strikesRemaining: Math.max(0, MAX_STRIKES - (user.chatStrikes + 1)),
      },
    } : {}),
  });
}
