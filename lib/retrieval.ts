import { prisma } from "@/lib/prisma";
import { embed, toVectorLiteral } from "@/lib/embeddings";

export type RetrievedTask = {
  id: string;
  text: string;
  cardTitle: string;
  completed: boolean;
  similarity: number;
};

/**
 * Compute and store the embedding for one checklist item.
 * Called whenever a task is created or its text changes, so the vector
 * always reflects the current content. Uses raw SQL because Prisma can't
 * write the Unsupported `vector` column through its normal API.
 */
export async function indexChecklistItem(
  id: string,
  text: string,
  cardTitle: string,
): Promise<void> {
  // Embed card title + task text together so the card gives extra context.
  const vector = toVectorLiteral(await embed(`${cardTitle}: ${text}`));
  await prisma.$executeRaw`
    UPDATE "ChecklistItem" SET "embedding" = ${vector}::vector WHERE "id" = ${id}
  `;
}

/**
 * Semantic search over a single user's assigned tasks.
 * Embeds the query, then ranks the user's tasks by cosine distance (<=>).
 * Returns the closest `limit` tasks with a 0..1 similarity score.
 */
export async function retrieveRelevantTasks(
  userId: string,
  query: string,
  limit = 5,
): Promise<RetrievedTask[]> {
  const vector = toVectorLiteral(await embed(query));

  return prisma.$queryRaw<RetrievedTask[]>`
    SELECT
      ci."id",
      ci."text",
      c."title" AS "cardTitle",
      ci."completed",
      1 - (ci."embedding" <=> ${vector}::vector) AS "similarity"
    FROM "ChecklistItem" ci
    JOIN "Card" c ON c."id" = ci."cardId"
    WHERE ci."assignedToUserId" = ${userId}
      AND ci."embedding" IS NOT NULL
    ORDER BY ci."embedding" <=> ${vector}::vector
    LIMIT ${limit}
  `;
}
