import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLineClient, formatTaskList } from "@/lib/line";
import { WebhookEvent, MessageEvent } from "@line/bot-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-line-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Parse webhook events
    const events: WebhookEvent[] = JSON.parse(body).events;

    // Process each event
    await Promise.all(
      events.map(async (event) => {
        if (event.type === "message" && event.message.type === "text") {
          await handleTextMessage(event as MessageEvent);
        }
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

async function handleTextMessage(event: MessageEvent) {
  const userId = event.source.userId;
  if (!userId) return;

  const message = event.message;
  if (message.type !== "text") return;

  const messageText = message.text.trim().toLowerCase();
  const lineClient = getLineClient();

  // Find user by LINE user ID
  const user = await prisma.user.findUnique({
    where: { lineUserId: userId },
  });

  if (!user) {
    await lineClient.replyMessage(event.replyToken, {
      type: "text",
      text: "ไอรินยังไม่รู้จักเธอเลยนะ 🥺\nไปล็อกอินใน Irin Task Board ก่อนน้า แล้วค่อยกลับมาคุยกันอีกทีนะ",
    });
    return;
  }

  // Handle "my tasks" command
  if (
    messageText === "my tasks" ||
    messageText === "My tasks" ||
    messageText.includes("งานของ") ||
    messageText.includes("งานอะไร") ||
    messageText.includes("งานไหน")
  ) {
    const tasks = await prisma.checklistItem.findMany({
      where: {
        assignedToUserId: user.id,
        completed: false,
      },
      include: {
        card: true,
      },
    });

    const formattedTasks = tasks.map(
      (task: { id: any; text: any; card: { title: any } }) => ({
        id: task.id,
        text: task.text,
        cardTitle: task.card.title,
      }),
    );

    // small personality touch
    await lineClient.replyMessage(event.replyToken, {
      type: "text",
      text:
        tasks.length === 0
          ? "วันนี้ยังไม่มีงานค้างเลยนะ ✨ เก่งมาก!"
          : "เดี๋ยวไอรินดูงานให้แป๊บนึงนะ 👀",
    });

    // send task list after
    const message = formatTaskList(formattedTasks);

    await lineClient.pushMessage(userId, {
      type: "text",
      text: message,
    });

    return;
  }

  // Handle "done {taskId}" command
  if (messageText.startsWith("done ")) {
    const taskId = messageText.substring(5).trim();

    try {
      const task = await prisma.checklistItem.findUnique({
        where: { id: taskId },
        include: { card: true },
      });

      if (!task) {
        await lineClient.replyMessage(event.replyToken, {
          type: "text",
          text: "ไอรินหางานนี้ไม่เจอเลย 😢 ลองเช็ก task id อีกทีน้า",
        });
        return;
      }

      if (task.assignedToUserId !== user.id) {
        await lineClient.replyMessage(event.replyToken, {
          type: "text",
          text: "งานนี้ไม่ได้มอบหมายให้เธอนะ 🤔",
        });
        return;
      }

      await prisma.checklistItem.update({
        where: { id: taskId },
        data: { completed: true },
      });

      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: `เสร็จแล้วใช่มั้ย เก่งมากเลย ✨\n\nการ์ด: ${task.card.title}\nงาน: ${task.text}`,
      });
    } catch (error) {
      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: "ไอรินทำรายการไม่สำเร็จเลย ลองใหม่อีกทีได้มั้ยนะ 🙏",
      });
    }
    return;
  }

  // Unknown command
  await lineClient.replyMessage(event.replyToken, {
    type: "text",
    text:
      "ไอรินช่วยได้ประมาณนี้นะ 👇\n\n" +
      "• my tasks — ดูงานที่ต้องทำ\n" +
      "• done {taskId} — บอกว่างานเสร็จแล้ว\n\n" +
      "ลองพิมพ์ดูได้เลยน้า ✨",
  });
}
