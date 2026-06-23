import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function createGeminiProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY ausente");
  return createGoogleGenerativeAI({ apiKey });
}
