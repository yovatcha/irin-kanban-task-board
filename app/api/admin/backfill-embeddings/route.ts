import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { indexChecklistItem } from "@/lib/retrieval";

// One-off endpoint to embed tasks that existed before RAG was added.
// Safe to re-run: it only touches rows whose embedding is still NULL.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find tasks that have no embedding yet (raw SQL — embedding is Unsupported).
  const pending = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "ChecklistItem" WHERE "embedding" IS NULL
  `;

  let indexed = 0;
  const failed: string[] = [];

  for (const { id } of pending) {
    const item = await prisma.checklistItem.findUnique({
      where: { id },
      include: { card: true },
    });
    if (!item) continue;

    try {
      await indexChecklistItem(item.id, item.text, item.card.title);
      indexed++;
    } catch (error) {
      console.error(`Failed to index ${id}:`, error);
      failed.push(id);
    }
  }

  return NextResponse.json({
    total: pending.length,
    indexed,
    failed: failed.length,
  });
}
