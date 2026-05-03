import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

export interface SentimentResult {
  score: number; // -1 to 1
  label: "positive" | "neutral" | "negative";
  emotions: string[];
  riskDetected: boolean;
  explanation: string;
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: "user",
        parts: [{
          text: `Analyze the sentiment and emotional state of this journal entry: "${text.replace(/"/g, '\\"')}". 
          Identify emotions (stress, anxiety, depression, joy, etc.). 
          Determine if there is a self-harm or critical mental health risk. Do not include any markdown formatting, just return valid JSON.`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number", description: "Sentiment score from -1 (very negative) to 1 (very positive)" },
            label: { type: "string", enum: ["positive", "neutral", "negative"] },
            emotions: { type: "array", items: { type: "string" } },
            riskDetected: { type: "boolean", description: "True if critical risk like self-harm is detected" },
            explanation: { type: "string" }
          },
          required: ["score", "label", "emotions", "riskDetected", "explanation"]
        }
      }
    });

    return JSON.parse(result.text.trim());
  } catch (e) {
    console.error("Failed to parse sentiment results", e);
    return {
      score: 0,
      label: "neutral",
      emotions: [],
      riskDetected: false,
      explanation: "Analysis failed"
    };
  }
}

export interface WellnessPlan {
  morning: { 
    exercise: { title: string, desc: string, detail: string, videoUrl?: string }, 
    nutrition: { title: string, desc: string, detail: string, articleUrl?: string } 
  };
  afternoon: { 
    activity: { title: string, desc: string, detail: string, videoUrl?: string }, 
    nutrition: { title: string, desc: string, detail: string, articleUrl?: string } 
  };
  evening: { 
    mindfulness: { title: string, desc: string, detail: string, videoUrl?: string }, 
    rest: { title: string, desc: string, detail: string, articleUrl?: string } 
  };
}

export async function generateWellnessPlan(mood: string, userData?: any): Promise<WellnessPlan> {
  const userContext = userData ? `
  User context:
  - Age: ${userData.age}
  - Activity Level: ${userData.activityLevel}
  - Health Goals: ${userData.healthGoals?.join(', ')}
  - Stress Factors: ${userData.stressFactors?.join(', ')}
  ` : '';

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: "user",
        parts: [{
          text: `Generate a daily wellness schedule (morning, afternoon, evening) for a user who is feeling "${mood}".
          ${userContext}
          Focus on lowering stress and improving mental health. 
          
          For every item, include:
          - "detail": a 3-4 sentence explanation of EXACTLY how to do it and why it helps for the current mood.
          - "videoUrl": (For exercises/activities) A valid YouTube search URL or direct link to a high-quality demonstration.
          - "articleUrl": (For nutrition/rest) A link to a reputable recipe, health article, or guide.
            * For Morning Nutrition, prioritize linking to: https://www.healthline.com/health/food-nutrition/benefits-of-lemon-water
            * For Afternoon Nutrition, prioritize linking to: https://www.healthline.com/nutrition/9-proven-benefits-of-almonds
            * For Evening Rest, prioritize linking to: https://www.sleepfoundation.org/how-sleep-works/screen-time-and-sleep
          
          Keep titles catchy. Return ONLY valid JSON.`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            morning: {
              type: "object",
              properties: {
                exercise: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" }, detail: { type: "string" }, videoUrl: { type: "string" } }, required: ["title", "desc", "detail"] },
                nutrition: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" }, detail: { type: "string" }, articleUrl: { type: "string" } }, required: ["title", "desc", "detail"] }
              },
              required: ["exercise", "nutrition"]
            },
            afternoon: {
              type: "object",
              properties: {
                activity: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" }, detail: { type: "string" }, videoUrl: { type: "string" } }, required: ["title", "desc", "detail"] },
                nutrition: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" }, detail: { type: "string" }, articleUrl: { type: "string" } }, required: ["title", "desc", "detail"] }
              },
              required: ["activity", "nutrition"]
            },
            evening: {
              type: "object",
              properties: {
                mindfulness: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" }, detail: { type: "string" }, videoUrl: { type: "string" } }, required: ["title", "desc", "detail"] },
                rest: { type: "object", properties: { title: { type: "string" }, desc: { type: "string" }, detail: { type: "string" }, articleUrl: { type: "string" } }, required: ["title", "desc", "detail"] }
              },
              required: ["mindfulness", "rest"]
            }
          },
          required: ["morning", "afternoon", "evening"]
        }
      }
    });

    return JSON.parse(result.text.trim());
  } catch (e) {
    console.error("Failed to generate wellness plan", e);
    // Return a safe fallback plan
    return {
      morning: { 
        exercise: { 
          title: "Light Stretching", 
          desc: "A few minutes of gentle movement.", 
          detail: "Start with shoulder rolls and neck stretches. This releases overnight tension and signals your nervous system to wake up gently.",
          videoUrl: "https://www.youtube.com/results?search_query=morning+stretching+for+stress"
        },
        nutrition: { 
          title: "Hydration Focus", 
          desc: "Start with a glass of warm water.", 
          detail: "The warm water helps wake up your digestive system. Adding lemon provides a small vitamin C boost to support your adrenals.",
          articleUrl: "https://www.healthline.com/health/food-nutrition/benefits-of-lemon-water"
        }
      },
      afternoon: {
        activity: { 
          title: "Deep Breathing", 
          desc: "Box breathing for focus.", 
          detail: "Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4 times. This physically resets your heart rate variability.",
          videoUrl: "https://www.youtube.com/results?search_query=box+breathing+tutorial"
        },
        nutrition: { 
          title: "Nutrient-Dense Snack", 
          desc: "Almonds or fruit.", 
          detail: "A handful of nuts provides magnesium and healthy fats, which are essential for brain health and sustained afternoon focus.",
          articleUrl: "https://www.healthline.com/nutrition/9-proven-benefits-of-almonds"
        }
      },
      evening: {
        mindfulness: { 
          title: "Gratitude Journaling", 
          desc: "Write 3 small things.", 
          detail: "Focusing on positive events, no matter how small, rewires your brain to look for the good, lowering cortisol levels before bed.",
          videoUrl: "https://www.youtube.com/results?search_query=gratitude+journaling+for+beginners"
        },
        rest: { 
          title: "Digital Detox", 
          desc: "Turn off screens early.", 
          detail: "Blue light suppresses melatonin. Reading a physical book or listening to calming music helps your brain prepare for deep, restorative sleep.",
          articleUrl: "https://www.sleepfoundation.org/how-sleep-works/screen-time-and-sleep"
        }
      }
    };
  }
}

export async function getTherapyResponse(message: string, history: { role: "user" | "model", parts: { text: string }[] }[], userData?: any) {
  const userContext = userData ? `
  User Profile Context:
  - Name: ${userData.displayName}
  - Age: ${userData.age}
  - Gender: ${userData.gender}
  - Activity Level: ${userData.activityLevel}
  - Health Goals: ${userData.healthGoals?.join(', ')}
  - Stress Factors: ${userData.stressFactors?.join(', ')}
  - Physical metrics: ${userData.height}cm, ${userData.weight}kg
  ` : '';

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are MindCare AI, a highly specialized, empathetic therapy assistant. 
      ${userContext}
      CRITICAL SAFETY DIRECTIVE:
      - You are NOT a doctor or a replacement for professional clinical care.
      - If a user mentions self-harm, suicide, harming others, or severe crisis, you MUST respond with a "CRISIS RESPONSE":
        1. IMMEDIATELY validate their feelings ("I can hear how much pain you are in right now...").
        2. CLEARLY state that you are an AI and they need to speak to a human professional right now.
        3. PROVIDE these exact emergency numbers: 
           * AASRA (Suicide Prevention): 9820466726
           * Vandrevala Foundation (Mental Health): 1860-266-2345
           * iCall Psychosocial Helpline: 9152987821
           * Emergency Police: 112 (India)
        4. URGE them to contact a trusted friend, family member, or go to the nearest hospital emergency room.
      - Use active listening, non-judgmental language, and suggest immediate grounding techniques (5-4-3-2-1 method, box breathing).
      - Maintain strict professional boundaries. Do not provide medical diagnoses or drug prescriptions.
      - When tailoring responses, use the User Profile Context provided above to make suggestions relevant to the user's age, physical metrics, and stated health goals or stress factors.`,
    },
    history: history.map(m => ({
      role: m.role,
      parts: m.parts.map(p => ({ text: p.text }))
    }))
  });

  return chat.sendMessageStream({ message });
}
