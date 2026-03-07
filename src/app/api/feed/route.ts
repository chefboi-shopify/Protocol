import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const MAX_ACTIVE_MATCHES = 3;

function parse(csv: string | null | undefined): string[] {
  return csv ? csv.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  const subscriptionActive = user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "NONE";

  // Focus Mode
  const activeMatchCount = await prisma.match.count({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });

  if (activeMatchCount >= MAX_ACTIVE_MATCHES) {
    return NextResponse.json({
      error: "FOCUS_MODE",
      message: `You have ${activeMatchCount} active conversations. Focus on meeting them before looking for new people.`,
      activeMatchCount,
      swipesLeft: user.dailySwipesLeft,
      feed: [],
    });
  }

  // Reset daily swipes
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastSwipeDay = new Date(user.lastSwipeDate);
  lastSwipeDay.setHours(0, 0, 0, 0);

  let swipesLeft = user.dailySwipesLeft;
  if (lastSwipeDay < today) {
    await prisma.user.update({
      where: { id: userId },
      data: { dailySwipesLeft: 20, lastSwipeDate: new Date() },
    });
    swipesLeft = 20;
  }

  if (swipesLeft <= 0) {
    return NextResponse.json(
      { error: "PROTOCOL LIMIT REACHED", swipesLeft: 0, feed: [] },
      { status: 403 }
    );
  }

  // Exclusions
  const [endorsed, passed, matched] = await Promise.all([
    prisma.endorsement.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.pass.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.match.findMany({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] }, select: { user1Id: true, user2Id: true } }),
  ]);

  const excludeIds = new Set<string>([userId]);
  endorsed.forEach((e) => excludeIds.add(e.toUserId));
  passed.forEach((p) => excludeIds.add(p.toUserId));
  matched.forEach((m) => { excludeIds.add(m.user1Id); excludeIds.add(m.user2Id); });

  const myTargetArchetypes = parse(user.targetArchetypes);
  const myTargetAttachment = parse(user.targetAttachment);
  const myTargetSocialBattery = parse(user.targetSocialBattery);
  const myTargetLifePace = parse(user.targetLifePace);
  const myDealbreakers = parse(user.dealbreakers);
  const myStrongPreferences = parse(user.strongPreferences);
  const myTargetReligion = parse(user.targetReligion);
  const myTargetPolitical = parse(user.targetPolitical);
  const myTargetKids = parse(user.targetKids);
  const myTags = parse(user.tags);

  const genderFilter: Record<string, unknown> = {};
  if (user.interestedIn !== "ALL") genderFilter.gender = user.interestedIn;

  const allCandidates = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      isGhostMode: false,
      age: { gte: user.targetMinAge, lte: user.targetMaxAge },
      ...(myTargetArchetypes.length > 0 ? { fiscalArchetype: { in: myTargetArchetypes } } : {}),
      ...genderFilter,
    },
    orderBy: { reliabilityScore: "desc" },
    select: {
      id: true, name: true, age: true, gender: true, interestedIn: true,
      fiscalArchetype: true, attachmentStyle: true, socialBattery: true, lifePace: true,
      videoUrl: true, reliabilityScore: true,
      targetMinAge: true, targetMaxAge: true, targetArchetypes: true,
      targetAttachment: true, targetSocialBattery: true, targetLifePace: true,
      dealbreakers: true, strongPreferences: true, tags: true, locationCity: true,
      religion: true, politicalLeaning: true, kidsPreference: true,
      targetReligion: true, targetPolitical: true, targetKids: true,
    },
  });

  // Mutual compatibility + scoring
  const scored: { candidate: typeof allCandidates[0]; score: number }[] = [];

  for (const candidate of allCandidates) {
    // --- HARD FILTERS (must pass or candidate is hidden) ---

    // Gender mutual check
    if (candidate.interestedIn !== "ALL" && candidate.interestedIn !== user.gender) continue;

    // Age mutual check
    if (user.age < candidate.targetMinAge || user.age > candidate.targetMaxAge) continue;

    // Archetype mutual check
    const theirTargetArchetypes = parse(candidate.targetArchetypes);
    if (theirTargetArchetypes.length > 0 && !theirTargetArchetypes.includes(user.fiscalArchetype)) continue;

    // Attachment style filter
    if (myTargetAttachment.length > 0 && candidate.attachmentStyle && !myTargetAttachment.includes(candidate.attachmentStyle)) continue;
    const theirTargetAttachment = parse(candidate.targetAttachment);
    if (theirTargetAttachment.length > 0 && user.attachmentStyle && !theirTargetAttachment.includes(user.attachmentStyle)) continue;

    // Social battery filter
    if (myTargetSocialBattery.length > 0 && candidate.socialBattery && !myTargetSocialBattery.includes(candidate.socialBattery)) continue;
    const theirTargetSB = parse(candidate.targetSocialBattery);
    if (theirTargetSB.length > 0 && user.socialBattery && !theirTargetSB.includes(user.socialBattery)) continue;

    // Life pace filter
    if (myTargetLifePace.length > 0 && candidate.lifePace && !myTargetLifePace.includes(candidate.lifePace)) continue;
    const theirTargetLP = parse(candidate.targetLifePace);
    if (theirTargetLP.length > 0 && user.lifePace && !theirTargetLP.includes(user.lifePace)) continue;

    // Dealbreaker check (bidirectional)
    const theirTags = parse(candidate.tags);
    if (myDealbreakers.some((db) => theirTags.includes(db))) continue;
    const theirDealbreakers = parse(candidate.dealbreakers);
    if (theirDealbreakers.some((db) => myTags.includes(db))) continue;

    // Religion filter (mutual)
    if (myTargetReligion.length > 0 && candidate.religion && !myTargetReligion.includes(candidate.religion)) continue;
    const theirTargetReligion = parse(candidate.targetReligion);
    if (theirTargetReligion.length > 0 && user.religion && !theirTargetReligion.includes(user.religion)) continue;

    // Political filter (mutual)
    if (myTargetPolitical.length > 0 && candidate.politicalLeaning && !myTargetPolitical.includes(candidate.politicalLeaning)) continue;
    const theirTargetPolitical = parse(candidate.targetPolitical);
    if (theirTargetPolitical.length > 0 && user.politicalLeaning && !theirTargetPolitical.includes(user.politicalLeaning)) continue;

    // Kids filter (mutual)
    if (myTargetKids.length > 0 && candidate.kidsPreference && !myTargetKids.includes(candidate.kidsPreference)) continue;
    const theirTargetKids = parse(candidate.targetKids);
    if (theirTargetKids.length > 0 && user.kidsPreference && !theirTargetKids.includes(user.kidsPreference)) continue;

    // --- SOFT SCORING (strong preferences deprioritize, don't hide) ---
    let score = candidate.reliabilityScore;

    // Penalize score if candidate has tags matching my strong preferences
    if (myStrongPreferences.length > 0) {
      const matchingStrong = myStrongPreferences.filter((sp) => theirTags.includes(sp));
      score -= matchingStrong.length * 15;
    }

    // Penalize score if I have tags matching their strong preferences
    const theirStrongPrefs = parse(candidate.strongPreferences);
    if (theirStrongPrefs.length > 0) {
      const matchingStrong = theirStrongPrefs.filter((sp) => myTags.includes(sp));
      score -= matchingStrong.length * 15;
    }

    scored.push({ candidate, score });
  }

  // Sort by score (higher = shown first), then slice
  scored.sort((a, b) => b.score - a.score);
  const feed = scored.slice(0, 20).map((s) => s.candidate);

  return NextResponse.json({ feed, swipesLeft, activeMatchCount, subscriptionActive });
}
