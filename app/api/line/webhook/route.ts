import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLineClient, formatTaskList } from "@/lib/line";
import { WebhookEvent, MessageEvent } from "@line/bot-sdk";
import { askAI, generateTaskReply, classifyIntent } from "@/lib/ai";
import { saveMessage } from "@/lib/memory";

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

  // Fast-path: explicit "done {id}" shortcut (skip AI classification for speed)
  const isDoneCommand = messageText.startsWith("done ");

  // Classify the user's intent with AI — understands any natural phrasing
  const intent = isDoneCommand ? "complete_task" : await classifyIntent(message.text);

  // ===== VIEW TASKS =====
  if (intent === "view_tasks") {
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

    // AI-generated intro — no hardcoded strings
    const introReply = await generateTaskReply(formattedTasks);

    await lineClient.replyMessage(event.replyToken, {
      type: "text",
      text: introReply,
    });

    // only send the detailed task list when there are tasks
    if (formattedTasks.length > 0) {
      const taskListMessage = formatTaskList(formattedTasks);
      await lineClient.pushMessage(userId, {
        type: "text",
        text: taskListMessage,
      });
    }

    return;
  }

  // ===== COMPLETE TASK =====
  if (intent === "complete_task") {
    // Support both "done {id}" shortcut and natural phrases like "ทำอะไรเสร็จ {id}"
    // Extract the last whitespace-separated token as the task ID
    const parts = message.text.trim().split(/\s+/);
    const taskId = parts[parts.length - 1];

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

  // ===== AI CHAT WITH MEMORY =====

  // save user message
  await saveMessage(user.id, "user", message.text);

  // ask AI
  const aiReply = await askAI(user.id, message.text);

  // save response
  await saveMessage(user.id, "assistant", aiReply);

  // delay เพิ่มความเป็นมนุษย์
  await new Promise((r) => setTimeout(r, 500));

  await lineClient.replyMessage(event.replyToken, {
    type: "text",
    text: aiReply,
  });
}
