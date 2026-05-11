import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBroadcastMessage } from "@/lib/line";

export async function POST(request: NextRequest) {
  const sender = await getCurrentUser();
  if (!sender) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    message?: string;
  } | null;
  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 },
    );
  }

  const recipients = await prisma.user.findMany({
    where: { id: { not: sender.id } },
    select: { lineUserId: true },
  });

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    if (!recipient.lineUserId) {
      failed++;
      continue;
    }
    try {
      await sendBroadcastMessage(recipient.lineUserId, sender.name, message);
      sent++;
    } catch (err) {
      console.error(
        `[broadcast] Failed to send to ${recipient.lineUserId}:`,
        err,
      );
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
