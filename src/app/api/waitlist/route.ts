import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema, parseOrError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = parseOrError(waitlistSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { firstName, lastName, email, city } = parsed.data;

  const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "ALREADY_REGISTERED", message: "This email is already on the waitlist." }, { status: 409 });
  }

  await prisma.waitlistSignup.create({
    data: { firstName, lastName, email, city },
  });

  const totalCount = await prisma.waitlistSignup.count();
  const cityCount = await prisma.waitlistSignup.count({ where: { city } });

  return NextResponse.json({
    ok: true,
    totalCount,
    cityCount,
    city,
  });
}

export async function GET() {
  const total = await prisma.waitlistSignup.count();

  const cityCounts = await prisma.waitlistSignup.groupBy({
    by: ["city"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  const cities = cityCounts.map((c) => ({
    city: c.city,
    count: c._count.id,
  }));

  return NextResponse.json({ total, cities });
}
