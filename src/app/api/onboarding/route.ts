import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { onboardingSchema, parseOrError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = parseOrError(onboardingSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const d = parsed.data;

  const user = await prisma.user.create({
    data: {
      name: d.name,
      age: d.age,
      gender: d.gender,
      interestedIn: d.interestedIn,
      fiscalArchetype: d.fiscalArchetype,
      attachmentStyle: d.attachmentStyle,
      socialBattery: d.socialBattery,
      lifePace: d.lifePace,
      religion: d.religion,
      politicalLeaning: d.politicalLeaning,
      kidsPreference: d.kidsPreference,
      targetReligion: d.targetReligion,
      targetPolitical: d.targetPolitical,
      targetKids: d.targetKids,
      locationCity: d.locationCity,
      locationLat: d.locationLat ?? null,
      locationLng: d.locationLng ?? null,
      targetMinAge: d.targetMinAge,
      targetMaxAge: d.targetMaxAge,
      targetArchetypes: d.targetArchetypes,
      targetAttachment: d.targetAttachment,
      targetSocialBattery: d.targetSocialBattery,
      targetLifePace: d.targetLifePace,
      dealbreakers: d.dealbreakers,
      strongPreferences: d.strongPreferences,
      tags: d.tags,
      videoUrl: d.videoUrl ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("protocol-user-id", user.id, {
    httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ userId: user.id });
}
