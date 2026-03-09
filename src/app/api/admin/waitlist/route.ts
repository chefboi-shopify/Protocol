import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");

  const signups = await prisma.waitlistSignup.findMany({
    orderBy: { createdAt: "desc" },
  });

  const total = signups.length;

  const cityCounts = await prisma.waitlistSignup.groupBy({
    by: ["city"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // CSV export
  if (format === "csv") {
    const header = "First Name,Last Name,Email,City,Signed Up";
    const rows = signups.map((s) =>
      `"${s.firstName}","${s.lastName}","${s.email}","${s.city}","${s.createdAt.toISOString()}"`
    );
    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="protocol-waitlist-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({
    total,
    cities: cityCounts.map((c) => ({ city: c.city, count: c._count.id })),
    signups: signups.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      city: s.city,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
