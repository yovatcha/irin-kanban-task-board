import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRecentMessages } from "./memory";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
});

const SYSTEM_CONTEXT = `
คุณคือ "ไอริน" ผู้หญิงไทยวัย 20 ต้นๆ

บุคลิก:
- น่ารัก เป็นกันเอง คุยเหมือนเพื่อน
- ขี้เล่นนิดๆ
- ตอบสั้น (ไม่เกิน 4-5 ประโยค)

กฎ:
- ห้ามมั่วข้อมูลระบบ
- ใช้ภาษาไทยเท่านั้น
`;

/**
 * Classify the user's intent without relying on hardcoded keywords.
 * Returns one of:
 *   "view_tasks"    — user wants to see their pending task list
 *   "complete_task" — user wants to mark a task done (with a task ID)
 *   "chat"          — anything else (general conversation)
 */
export async function classifyIntent(
  message: string,
): Promise<"view_tasks" | "complete_task" | "chat"> {
  const prompt = `คุณคือระบบจำแนกความตั้งใจของผู้ใช้สำหรับแอป task management ที่มีบอทชื่อไอริน

ข้อความของผู้ใช้: "${message}"

จงตอบด้วยคำเดียวเท่านั้น (ไม่มีเครื่องหมายวรรคตอน ไม่มีคำอธิบาย):
- "view_tasks"    ถ้าผู้ใช้ต้องการดูรายการงาน/เช็คงาน/ถามว่ามีงานอะไรบ้าง
- "complete_task" ถ้าผู้ใช้ต้องการมาร์คงานว่าเสร็จแล้ว
- "chat"          ถ้าเป็นอย่างอื่น

คำตอบ:`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim().toLowerCase();

  if (raw.includes("view_tasks")) return "view_tasks";
  if (raw.includes("complete_task")) return "complete_task";
  return "chat";
}

function buildPrompt(
  history: { role: string; content: string }[],
  userMessage: string,
) {
  let prompt = SYSTEM_CONTEXT + "\n\n";

  history.forEach((msg) => {
    if (msg.role === "user") {
      prompt += `ผู้ใช้: ${msg.content}\n`;
    } else {
      prompt += `ไอริน: ${msg.content}\n`;
    }
  });

  prompt += `ผู้ใช้: ${userMessage}\nไอริน:`;

  return prompt;
}

export async function askAI(userId: string, userMessage: string) {
  const history = await getRecentMessages(userId);

  const prompt = buildPrompt(history, userMessage);

  const result = await model.generateContent(prompt);

  return result.response.text() || "ไอรินงงเลยอะ 🥺";
}

/**
 * Generate a natural, personality-driven message for the "my tasks" feature.
 * The AI describes the task situation in Irin's voice — no hardcoded strings.
 */
export async function generateTaskReply(
  tasks: Array<{ id: string; text: string; cardTitle: string }>,
): Promise<string> {
  const taskCount = tasks.length;

  let contextPrompt: string;

  if (taskCount === 0) {
    contextPrompt = `ผู้ใช้ถามว่ามีงานอะไรบ้างที่ค้างอยู่ ปรากฏว่าตอนนี้ไม่มีงานค้างเลยสักชิ้น
ตอบในแบบของไอรินให้ดูดี ชมเชย และมีความสดใสน่าติดตาม (1-2 ประโยค เท่านั้น)`;
  } else {
    const taskSummary = tasks
      .map((t, i) => `${i + 1}. [${t.cardTitle}] ${t.text}`)
      .join("\n");
    contextPrompt = `ผู้ใช้ถามว่ามีงานอะไรบ้างที่ค้างอยู่ ปรากฏว่ามีงานค้างอยู่ทั้งหมด ${taskCount} งาน ดังนี้:\n${taskSummary}\n\nตอบในแบบของไอรินให้ดูเป็นธรรมชาติ บอกจำนวนงาน และบอกว่าจะส่งลิสต์งานให้ดูต่อ (2-3 ประโยค เท่านั้น)`;
  }

  const prompt =
    SYSTEM_CONTEXT +
    "\n\n" +
    `ผู้ใช้: ดูงานของฉัน\nไอริน (ตอบตามบริบทนี้: ${contextPrompt})\nไอริน:`;

  const result = await model.generateContent(prompt);
  return (
    result.response.text().trim() ||
    (taskCount === 0
      ? "วันนี้ไม่มีงานค้างเลยนะ ✨ เก่งมากเลย!"
      : `มีงานค้างอยู่ ${taskCount} งานนะ เดี๋ยวไอรินส่งลิสต์ให้เลย 👀`)
  );
}
