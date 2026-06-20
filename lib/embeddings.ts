import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// text-embedding-004 is free on the Gemini API and outputs 768-dim vectors,
// which must match the vector(768) column in the schema.
const embedder = genAI.getGenerativeModel({ model: "text-embedding-004" });

/** Turn arbitrary text into a 768-dimension embedding vector. */
export async function embed(text: string): Promise<number[]> {
  const result = await embedder.embedContent(text);
  return result.embedding.values;
}

/** Format a JS number[] as a pgvector literal, e.g. "[0.1,0.2,...]". */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
