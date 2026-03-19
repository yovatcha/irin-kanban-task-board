import { prisma } from "@/lib/prisma";

const MAX_HISTORY = 6;

export async function getRecentMessages(userId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
  });

  return messages.reverse();
}

export async function saveMessage(
  userId: string,
  role: "user" | "assistant",
  content: string,
) {
  await prisma.chatMessage.create({
    data: { userId, role, content },
  });
}
