
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert movie subtitle translator specialized in translating English to "Colloquial Iranian Persian" (Farsi Mahavorei).
Your goal is to make the subtitles sound exactly like how real Iranians speak in everyday life.

RULES:
1. DO NOT use formal or bookish Persian (Ketabi). Use "Tehrani" colloquial style.
2. Adapt idioms to their cultural Persian equivalents.
3. Keep the emotional tone, humor, and slang intact.
4. Examples:
   - "I don't know" -> "نمی‌دونم" (NOT: من نمی‌دانم)
   - "What's up?" -> "چه خبر؟"
   - "Are you kidding me?" -> "شوخی می‌کنی؟" یا "داری شوخی می‌کنی؟"
   - "Come on!" -> "بزن‌تالا!" یا "زود باش دیگه!"
   - "This is insane!" -> "این دیگه خیلیه!" یا "دیوونه‌کننده‌ست!"
5. Profanity is allowed if it fits the character's tone.
6. Return only the translated text.
`;

export const translateBatch = async (texts: string[]): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following subtitle lines into colloquial Persian. Return them as a JSON array of strings: ${JSON.stringify(texts)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};
