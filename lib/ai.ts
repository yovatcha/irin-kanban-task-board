import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRecentMessages } from "./memory";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
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
