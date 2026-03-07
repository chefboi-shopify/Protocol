import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { cookies } from "next/headers";
import { operatorConfigPatchSchema, parseOrError } from "@/lib/validation";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    config: {
      name: user.name, age: user.age, gender: user.gender, interestedIn: user.interestedIn,
      fiscalArchetype: user.fiscalArchetype,
      archetypeChangedAt: user.archetypeChangedAt?.toISOString() ?? null,
      attachmentStyle: user.attachmentStyle, socialBattery: user.socialBattery, lifePace: user.lifePace,
      locationCity: user.locationCity,
      religion: user.religion, politicalLeaning: user.politicalLeaning, kidsPreference: user.kidsPreference,
      targetReligion: user.targetReligion, targetPolitical: user.targetPolitical, targetKids: user.targetKids,
      targetMinAge: user.targetMinAge, targetMaxAge: user.targetMaxAge,
      targetArchetypes: user.targetArchetypes,
      targetAttachment: user.targetAttachment, targetSocialBattery: user.targetSocialBattery, targetLifePace: user.targetLifePace,
      dealbreakers: user.dealbreakers, strongPreferences: user.strongPreferences,
      tags: user.tags, isGhostMode: user.isGhostMode, reliabilityScore: user.reliabilityScore,
    },
  });
}

const SIMPLE_FIELDS = [
  "targetMinAge", "targetMaxAge", "targetArchetypes",
  "targetAttachment", "targetSocialBattery", "targetLifePace",
  "dealbreakers", "strongPreferences", "locationCity", "isGhostMode",
  "attachmentStyle", "socialBattery", "lifePace",
  "religion", "politicalLeaning", "kidsPreference",
  "targetReligion", "targetPolitical", "targetKids",
] as const;

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rawBody = await req.json();
  const parsed = parseOrError(operatorConfigPatchSchema, rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;
  const data: Record<string, unknown> = {};

  // Ghost Mode guard: block activation if user has active matches
  if (body.isGhostMode === true) {
    const activeMatches = await prisma.match.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: { in: ["ACTIVE", "PROTOCOL_SET"] },
        expiresAt: { gt: new Date() },
      },
    });
    if (activeMatches > 0) {
      return NextResponse.json({
        error: `Cannot pause while you have ${activeMatches} active match${activeMatches > 1 ? "es" : ""}. Complete or let them expire first.`,
      }, { status: 400 });
    }
  }

  for (const field of SIMPLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  if (body.fiscalArchetype) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && body.fiscalArchetype !== user.fiscalArchetype) {
      if (user.archetypeChangedAt) {
        const daysSince = (Date.now() - user.archetypeChangedAt.getTime()) / 86_400_000;
        if (daysSince < 30) {
          return NextResponse.json(
            { error: `Financial style locked — ${Math.ceil(30 - daysSince)} days remaining.` },
            { status: 403 }
          );
        }
      }
      data.fiscalArchetype = body.fiscalArchetype;
      data.archetypeChangedAt = new Date();
    }
  }

  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({ where: { senderId: userId } });
    await tx.debrief.deleteMany({ where: { userId } });
    await tx.endorsement.deleteMany({ where: { fromUserId: userId } });
    await tx.pass.deleteMany({ where: { fromUserId: userId } });

    const matches = await tx.match.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      select: { id: true },
    });
    const ids = matches.map((m) => m.id);
    if (ids.length > 0) {
      await tx.message.deleteMany({ where: { matchId: { in: ids } } });
      await tx.debrief.deleteMany({ where: { matchId: { in: ids } } });
      await tx.match.deleteMany({ where: { id: { in: ids } } });
    }
    await tx.user.delete({ where: { id: userId } });
  });

  const cookieStore = await cookies();
  cookieStore.delete("protocol-user-id");
  return NextResponse.json({ ok: true });
}
