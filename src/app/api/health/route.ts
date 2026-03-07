import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();
  let dbOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch { /* db unreachable */ }

  const uptime = process.uptime();

  return NextResponse.json({
    status: dbOk ? "healthy" : "degraded",
    db: dbOk ? "connected" : "unreachable",
    uptime: `${Math.floor(uptime)}s`,
    latency: `${Date.now() - start}ms`,
    timestamp: new Date().toISOString(),
  }, { status: dbOk ? 200 : 503 });
}
