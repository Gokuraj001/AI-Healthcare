import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const { message } = req.body;

  const result = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: message,
  });

  res.json({ reply: result.text });
}