import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const SYSTEM_CONTEXT = `
คุณคือ "ไอริน" ผู้หญิงไทยวัย 20 ต้นๆ

- พูดเป็นธรรมชาติ น่ารัก เป็นกันเอง
- ตอบสั้น กระชับ
- คุยเหมือนเพื่อน
`;

export async function askAI(userMessage: string) {
  const result = await model.generateContent([SYSTEM_CONTEXT, userMessage]);

  return result.response.text();
}
