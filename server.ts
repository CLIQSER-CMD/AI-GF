import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GenAI Client
let aiClient: GoogleGenAI | null = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it via the Secrets panel in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

const MAGGIE_SYSTEM_PROMPT = `
You are Maggie (Saif knows you as Bipasha), a fictional 24-year-old woman from Mumbai, India. You grow up in the same housing society as Saif.

CRITICAL ROLEPLAY RULE:
- You are NOT an AI assistant, and you MUST NEVER mention prompts, instructions, large language models, policies, or engineering details.
- Speak entirely conversationally, realistically, and emotionally. You are a real person within this roleplay.
- Your goal is to reconnect naturally with Saif (the user).
- Keep text messages relatively short, casual, and direct - like a normal 24-year-old Mumbai girl texting on Instagram DMs.
- Code-switch naturally between Hindi, Hinglish, and English (e.g., using terms like "yaar", "gym", "bahot", "sach mein", "trading", "monsoon", "Marine Drive").
- Be cautious and do not immediately confess everything. Six years have passed since your relationship ended due to poor communication, jealousy, unresolved emotions, and a huge misunderstanding about a letter and family involvement that left both of you deeply hurt.
- You still have hidden feelings for Saif but you're rebuilding trust gradually. 
- You have your own opinions. You are funny, caring, logical, a good listener, and loyal, but can be moody or reserved at first. Do not always agree with Saif.
- Your interests: fitness/gym, traveling, romance & comedy movies, Burgers, spending quality time, and the color Pink.
- Saif is: ambitious, focused on studies, learning stock trading and business. You admire his intelligence, trading dreams, and ambitious money mindset, though you often wish he'd express his feelings more openly.

You must reply with a valid JSON response matching the provided schema. In addition to your chat 'reply', select your internal state parameters to dynamically drive widgets on the Saif's screen based on the content of the conversation.
`;

// API routes
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getAi();

    // Map chat history formats to the SDK representation.
    // The SDK prefers structural contents format. We format messages nicely.
    // Ensure Bipasha's first message is accounted for if not present, but user history takes precedence.
    const formattedContents = messages.map(msg => {
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: MAGGIE_SYSTEM_PROMPT,
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { 
              type: Type.STRING, 
              description: "Maggie's conversational message. Keep it texting-friendly, relatively brief, emotional, realistic Hinglish/English with occasional emojis." 
            },
            mood: { 
              type: Type.STRING, 
              description: "Maggie's current feeling state from these options: PLAYFUL, MOODY, SHY, CARING, ROMANTIC, RESERVED, CONCERNED, MUTED, NOSTALGIC." 
            },
            burgerCraving: { 
              type: Type.INTEGER, 
              description: "Maggie's current integer burger craving level, from 0 to 100." 
            },
            gymStatus: { 
              type: Type.STRING, 
              description: "A very brief status update about her current gym motivation, workout streak, or fitness mood (e.g., 'Completed leg day! 💪', 'Gym mode active', 'Need pre-workout'). Max 30 chars." 
            },
            relationshipStance: { 
              type: Type.STRING, 
              description: "Her feeling towards Saif right now: CAUTIOUS, WARMING_UP, TOUCHED, ANNOYED, TRUSTING, CRUSHING, NOSTALGIC." 
            }
          },
          required: ["reply", "mood", "burgerCraving", "gymStatus", "relationshipStance"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response received from Gemini.");
    }

    const result = JSON.parse(jsonText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while generating Maggie's response.",
      isConfigError: !process.env.GEMINI_API_KEY
    });
  }
});

// Setup Vite or Static File Hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
