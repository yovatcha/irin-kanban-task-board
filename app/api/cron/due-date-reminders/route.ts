import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDueDateReminder } from "@/lib/line";

export async function GET(request: NextRequest) {
  // Protect the endpoint with a secret
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Compute today's date range in Asia/Bangkok (UTC+7)
    // Using a fixed +7 offset so this stays correct regardless of server timezone
    const nowUTC = new Date();
    const bangkokOffsetMs = 7 * 60 * 60 * 1000;
    const nowBangkok = new Date(nowUTC.getTime() + bangkokOffsetMs);

    const todayStart = new Date(
      Date.UTC(
        nowBangkok.getUTCFullYear(),
        nowBangkok.getUTCMonth(),
        nowBangkok.getUTCDate(),
        0,
        0,
        0,
        0,
      ) - bangkokOffsetMs,
    );

    const todayEnd = new Date(
      Date.UTC(
        nowBangkok.getUTCFullYear(),
        nowBangkok.getUTCMonth(),
        nowBangkok.getUTCDate(),
        23,
        59,
        59,
        999,
      ) - bangkokOffsetMs,
    );

    // Find all cards whose dueDate falls within today (Bangkok time)
    const cards = await prisma.card.findMany({
      where: {
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        checklists: {
          include: {
            assignedTo: true,
          },
        },
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const card of cards) {
      if (!card.dueDate) continue;

      // Collect unique LINE user IDs assigned to this card
      const lineUserIds = new Set<string>();
      for (const item of card.checklists) {
        if (item.assignedTo?.lineUserId) {
          lineUserIds.add(item.assignedTo.lineUserId);
        }
      }

      if (lineUserIds.size === 0) {
        skipped++;
        continue;
      }

      // Send a reminder to each unique assignee
      for (const lineUserId of lineUserIds) {
        try {
          await sendDueDateReminder(lineUserId, card.title, card.dueDate);
          sent++;
        } catch (err) {
          console.error(
            `Failed to send reminder to ${lineUserId} for card "${card.title}":`,
            err,
          );
          skipped++;
        }
      }
    }

    console.log(`[due-date-reminders] sent=${sent} skipped=${skipped}`);
    return NextResponse.json({ success: true, sent, skipped });
  } catch (error) {
    console.error("[due-date-reminders] Error:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 },
    );
  }
}
