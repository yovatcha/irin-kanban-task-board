import { Client } from "@line/bot-sdk";

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

// Format task list for LINE message
export function formatTaskList(
  tasks: Array<{ id: string; text: string; cardTitle: string }>,
) {
  if (tasks.length === 0) {
    return "วันนี้ยังไม่มีงานค้างเลยนะ ✨ เก่งมาก!";
  }

  let message = `📌 งานที่เธอยังต้องทำมี ${tasks.length} งานนะ:\n\n`;

  tasks.forEach((task, index) => {
    message += `${index + 1}. ${task.cardTitle}\n   └ ${task.text}\n   ID: ${task.id}\n\n`;
  });

  message += "ถ้าทำเสร็จแล้ว พิมพ์แบบนี้ได้เลยน้า:\ndone {taskId}";

  return message;
}

// Export getLineClient for webhook use
export { getLineClient };
