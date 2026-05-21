import { Client, FlexMessage, FlexBubble } from "@line/bot-sdk";

function getLineClient() {
  const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "",
  };
  return new Client(config);
}

// Send push notification to user
export async function sendTaskAssignmentNotification(
  lineUserId: string,
  cardTitle: string,
  taskText: string,
) {
  try {
    const lineClient = getLineClient();
    await lineClient.pushMessage(lineUserId, {
      type: "text",
      text: `📋 มีงานใหม่มาแล้วน้า~\n\nไอรินเพิ่มงานให้เธอจากการ์ด\n「${cardTitle}」\n\nงานที่ต้องทำคือ:\n${taskText}\n\nสู้ๆน้า ไอรินเป็นกำลังใจให้ ✨`,
    });
  } catch (error) {
    console.error("Failed to send LINE notification:", error);
    throw error;
  }
}

// Verify webhook signature
export function verifySignature(body: string, signature: string): boolean {
  const crypto = require("crypto");
  const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

// LINE carousels hold up to 12 bubbles.
const MAX_TASK_BUBBLES = 12;

/**
 * Build a Flex carousel where each task is a bubble with a tap-to-complete
 * button. The button sends a postback "complete:{taskId}" so users never
 * have to type or copy a cuid.
 */
export function buildTaskListFlex(
  tasks: Array<{ id: string; text: string; cardTitle: string }>,
): FlexMessage {
  const bubbles: FlexBubble[] = tasks
    .slice(0, MAX_TASK_BUBBLES)
    .map((task, idx) => ({
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: `#${idx + 1}  ${task.cardTitle}`,
            weight: "bold",
            size: "xs",
            color: "#9E9189",
            wrap: true,
          },
          {
            type: "text",
            text: task.text,
            size: "md",
            color: "#1C1A18",
            weight: "bold",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#06C755",
            height: "sm",
            action: {
              type: "postback",
              label: "✓ เสร็จแล้ว",
              data: `complete:${task.id}`,
              displayText: `เสร็จงาน: ${task.text}`,
            },
          },
        ],
      },
    }));

  return {
    type: "flex",
    altText: `งานที่ต้องทำ ${tasks.length} งาน`,
    contents: { type: "carousel", contents: bubbles },
  };
}

// Send due date reminder notification
export async function sendDueDateReminder(
  lineUserId: string,
  cardTitle: string,
  dueDate: Date,
) {
  try {
    const lineClient = getLineClient();

    // Format date in Thai locale (Asia/Bangkok)
    const formattedDate = dueDate.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await lineClient.pushMessage(lineUserId, {
      type: "text",
      text:
        `⏰ เตือนความจำจากไอริน!\n\n` +
        `การ์ด「${cardTitle}」\n` +
        `มีกำหนดส่งวันนี้เลยนะ 📅\n` +
        `วันที่: ${formattedDate}\n\n` +
        `อย่าลืมทำให้เสร็จด้วยน้า สู้ๆ! ✨`,
    });
  } catch (error) {
    console.error("Failed to send due date reminder:", error);
    throw error;
  }
}

// Send broadcast announcement to a single user
export async function sendBroadcastMessage(
  lineUserId: string,
  senderName: string,
  message: string,
) {
  const lineClient = getLineClient();
  await lineClient.pushMessage(lineUserId, {
    type: "text",
    text: `📣 มีข้อความประกาศจาก ${senderName} ว่า:\n\n${message}`,
  });
}

// Export getLineClient for webhook use
export { getLineClient };
