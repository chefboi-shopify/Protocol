import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { screenWithLLM } from "@/lib/llm-screening";
import { MAX_STRIKES, SHADOWBAN_HOURS } from "@/lib/chat-screening";
import { log } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true, skipped: true, reason: "No LLM API key configured." });
  }

  // Fetch recent non-system messages that haven't been LLM-screened yet.
  // We use a convention: messages with isScreened=false and isSystem=false
  // that were created in the last 10 minutes are candidates.
  const cutoff = new Date(Date.now() - 10 * 60_000);

  const messages = await prisma.message.findMany({
    where: {
      isSystem: false,
      isScreened: false,
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  if (messages.length === 0) {
    return NextResponse.json({ ok: true, screened: 0 });
  }

  const contents = messages.map((m) => m.content);
  const results = await screenWithLLM(contents);

  let flagged = 0;
  let strikesApplied = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const result = results[i];

    if (result?.flagged) {
      flagged++;

      // Mark message as screened and replace content
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          isScreened: true,
          content: msg.content.replace(
            /[\s\S]*/,
            `${msg.content}\n\n⚠️ [ FLAGGED BY AI SCREENING: ${result.reason} ]`
          ),
        },
      });

      // Apply retroactive strike to sender
      const sender = await prisma.user.findUnique({
        where: { id: msg.senderId },
        select: { id: true, chatStrikes: true },
      });

      if (sender) {
        const newStrikes = sender.chatStrikes + 1;
        const updateData: Record<string, unknown> = { chatStrikes: newStrikes };

        if (newStrikes >= MAX_STRIKES) {
          updateData.shadowBannedUntil = new Date(Date.now() + SHADOWBAN_HOURS * 3_600_000);
          updateData.chatStrikes = 0;
        }

        await prisma.user.update({ where: { id: sender.id }, data: updateData });
        strikesApplied++;
      }

      // Inject a system warning into the chat
      await prisma.message.create({
        data: {
          matchId: msg.matchId,
          senderId: msg.senderId,
          content: `⚠️ A message in this conversation was flagged by AI screening for attempting to share contact information. Strikes have been applied. Use the Protocol — schedule a meeting.`,
          isSystem: true,
        },
      });
    }
  }

  // Mark remaining non-flagged messages as screened to avoid re-processing
  const cleanIds = messages.filter((_, i) => !results[i]?.flagged).map((m) => m.id);
  if (cleanIds.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: cleanIds } },
      data: { isScreened: true },
    });
  }

  log.info("cron:screen-messages completed", { screened: messages.length, flagged, strikesApplied });
  return NextResponse.json({
    ok: true,
    screened: messages.length,
    flagged,
    strikesApplied,
    timestamp: new Date().toISOString(),
  });
}
