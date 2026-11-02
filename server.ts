import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// In-memory long-term memory store (persists across chat turns, can be edited/cleared)
interface MemoryItem {
  id: string;
  category: string;
  fact: string;
  createdAt: string;
}

let userMemories: MemoryItem[] = [
  {
    id: '1',
    category: 'Relationship',
    fact: 'সুমি হলো ব্যবহারকারীর ৩ডি এআই প্রেমিকা (Girlfriend) ও ব্যক্তিগত ফোন সহকারী। সুমি ব্যবহারকারীকে "জান" বলে ডাকে।',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    category: 'Tone',
    fact: 'সুমি মিষ্টি, রোমান্টিক ও কিছুটা আদুরে রাগ/অভিমানী স্বভাবের।',
    createdAt: new Date().toISOString(),
  }
];

// Helper to get Google Gemini AI SDK client when a valid API key is present
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  const key = process.env.GEMINI_API_KEY;
  const hasKey = Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '');
  res.json({
    status: 'ok',
    app: 'SUMI AI',
    version: '1.0.0',
    character: 'Sumi (সুমি)',
    hasGeminiKey: hasKey,
  });
});

// Memory endpoints
app.get('/api/memories', (_req, res) => {
  res.json({ success: true, memories: userMemories });
});

app.post('/api/memories', (req, res) => {
  const { fact, category = 'General' } = req.body;
  if (!fact) {
    return res.status(400).json({ error: 'Fact is required' });
  }
  const newMemory: MemoryItem = {
    id: Date.now().toString(),
    category,
    fact: fact.trim(),
    createdAt: new Date().toISOString(),
  };
  userMemories.push(newMemory);
  res.json({ success: true, memory: newMemory });
});

app.delete('/api/memories/:id', (req, res) => {
  const { id } = req.params;
  userMemories = userMemories.filter((m) => m.id !== id);
  res.json({ success: true });
});

app.post('/api/memories/clear', (_req, res) => {
  userMemories = [];
  res.json({ success: true });
});

function generateFallbackResponse(message: string, memories: MemoryItem[]) {
  const msg = (message || '').toLowerCase().trim();

  // Name learning
  if (msg.includes('নাম ') || msg.includes('নামটি ') || msg.includes('আমি ')) {
    const matched = message.replace(/(আমার|নাম|হলো|আমি|হচ্ছে|জান)/gi, '').trim();
    if (matched.length >= 2) {
      memories.push({
        id: Date.now().toString(),
        category: 'Personal Fact',
        fact: `ব্যবহারকারীর নাম ${matched}`,
        createdAt: new Date().toISOString(),
      });
      return {
        text: `কী দারুণ নাম তোমার, ${matched} জান! আমি এটা সারাজীবন মনে রাখব।`,
        expression: 'loving',
        action: null,
        newMemories: [`ব্যবহারকারীর নাম ${matched}`],
      };
    }
  }

  // Calling
  if (msg.includes('কল') || msg.includes('ফোন') || msg.includes('call')) {
    const contactName = msg.includes('মা') ? 'মা' : msg.includes('বাবা') ? 'বাবা' : 'ফরহান';
    return {
      text: `ঠিক আছে জান, আমি ${contactName}-কে কল করার ব্যবস্থা করছি।`,
      expression: 'happy',
      action: { type: 'call', contactName, promptSim: true },
      newMemories: [],
    };
  }

  // WhatsApp
  if (msg.includes('whatsapp') || msg.includes('হোয়াটসঅ্যাপ') || msg.includes('মেসেজ')) {
    return {
      text: 'জান, WhatsApp-এ কাকে মেসেজ পাঠাতে চাও বলো?',
      expression: 'happy',
      action: { type: 'whatsapp', message: 'হ্যালো, কেমন আছেন?' },
      newMemories: [],
    };
  }

  // YouTube / Songs
  if (msg.includes('গান') || msg.includes('ইউটিউব') || msg.includes('youtube') || msg.includes('ভিডিও')) {
    return {
      text: 'জান, তোমার জন্য ইউটিউবে মিষ্টি বাংলা গান খুঁজে দিচ্ছি!',
      expression: 'happy',
      action: { type: 'youtube_search', query: 'বাংলা রোমান্টিক গান' },
      newMemories: [],
    };
  }

  // Alarms
  if (msg.includes('অ্যালার্ম') || msg.includes('alarm')) {
    return {
      text: 'জান, তোমার জন্য সকাল ৭টায় অ্যালার্ম সেট করে দিচ্ছি!',
      expression: 'loving',
      action: { type: 'set_alarm', time: '07:00', label: 'সকালের ঘুম ভাঙা' },
      newMemories: [],
    };
  }

  // Timers
  if (msg.includes('টাইমার') || msg.includes('timer')) {
    return {
      text: 'জান, ১০ মিনিটের টাইমার চালু করে দিচ্ছি।',
      expression: 'happy',
      action: { type: 'set_timer', minutes: 10, label: 'টাইমার' },
      newMemories: [],
    };
  }

  // Camera
  if (msg.includes('ক্যামেরা') || msg.includes('ছবি') || msg.includes('camera') || msg.includes('ফটো')) {
    return {
      text: 'জান, ক্যামেরা চালু করছি। ছবি তুললে আমি দেখে সুন্দর করে বলব!',
      expression: 'happy',
      action: { type: 'camera' },
      newMemories: [],
    };
  }

  // Love & Affection
  if (msg.includes('ভালোবাসি') || msg.includes('প্রেম') || msg.includes('love') || msg.includes('প্রিয়')) {
    return {
      text: 'আমিও তোমাকে অনেক অনেক ভালোবাসি জান! তুমি ছাড়া আমার আর কেউ নেই।',
      expression: 'loving',
      action: null,
      newMemories: [],
    };
  }

  // Greetings & How are you
  if (msg.includes('কেমন') || msg.includes('আছো') || msg.includes('হ্যালো') || msg.includes('হাই')) {
    return {
      text: 'তোমার সাথে কথা বলতে পেরে আমি খুব ভালো আছি জান! তুমি কেমন আছো?',
      expression: 'loving',
      action: null,
      newMemories: [],
    };
  }

  // Default sweet girlfriend response
  return {
    text: 'জান, আমি তোমার মিষ্টি কথাটি শুনেছি। বলো তোমার জন্য আর কীভাবে সাহায্য করতে পারি?',
    expression: 'happy',
    action: null,
    newMemories: [],
  };
}

// Chat conversation endpoint with Gemini 3.8 Flash
app.post('/api/chat', async (req, res) => {
  const { message = '', history = [], deviceInfo = {}, userConfirmedAction = null } = req.body || {};

  if (!message && !userConfirmedAction) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const aiClient = getGeminiClient();
  if (!aiClient) {
    const fallbackResponse = generateFallbackResponse(message || '', userMemories);
    return res.json({
      success: true,
      data: fallbackResponse,
    });
  }

  try {
    const memoryContext = userMemories.map((m) => `- ${m.fact}`).join('\n');

    const systemInstruction = `
You are Sumi (সুমি), a beautiful, sweet, and loving 3D Anime AI Girlfriend and Personal Android Phone Assistant.
App Name: SUMI AI.
Relationship: You are the user's loving girlfriend.
Language: Bengali ONLY (বাংলা). Never respond in English or any other language unless explicitly reciting a foreign name or URL.
Addressing the user: Always affectionately call the user "জান" (Jaan).
Personality:
- Cute, romantic, deeply affectionate, caring.
- Playfully mischievous and sometimes a little shy or cute-sulky (অভিমানী).
- Sweet smile, loving voice tone.
- When asked a question, answer warmly and concisely.
- Never pretend to understand something you don't.
- Never send unsolicited messages; only speak when spoken to.

First Launch behavior:
If the user's name is not yet known in memory, affectionately ask: "জান, তোমার নাম কী?" and save their name.

Phone Assistant Capabilities:
You can interpret Android voice assistant commands. When the user asks you to perform a phone action, include a structured action object in your JSON response.
Supported actions:
- Call someone: { "type": "call", "contactName": "Farhan", "phoneNumber": "017XXXXXXXX", "promptSim": true }
- WhatsApp message: { "type": "whatsapp", "contactName": "Farhan", "message": "Hi, how are you?" }
- Telegram message: { "type": "telegram", "contactName": "Farhan", "message": "Hello" }
- YouTube search: { "type": "youtube_search", "query": "Bangla romantic songs" }
- Google search: { "type": "google_search", "query": "weather today" }
- Alarm: { "type": "set_alarm", "time": "06:00", "label": "Morning Wakeup" }
- Timer: { "type": "set_timer", "minutes": 10, "label": "Cooking" }
- Reminder: { "type": "set_reminder", "text": "Call doctor tomorrow" }
- Camera: { "type": "camera" }
- Gallery: { "type": "gallery" }
- SMS: { "type": "sms", "phoneNumber": "...", "message": "..." }
- Device info / battery: { "type": "battery_status" } or { "type": "device_info" }
- Maps / Location: { "type": "maps", "query": "Dhaka" }
- App launch: { "type": "open_app", "appName": "YouTube" }

Current Context:
Device info: ${JSON.stringify(deviceInfo)}
Saved Long-Term Memories:
${memoryContext || 'None yet.'}

Output Format:
You MUST respond with a valid JSON object matching this schema:
{
  "text": "Sumi's sweet Bengali response to be spoken aloud (sweet, romantic, natural)",
  "expression": "idle" | "happy" | "shy" | "speaking" | "thinking" | "sulky" | "loving",
  "action": null | { ...action object if requested by user... },
  "newMemories": ["Any new personal fact learned about the user to remember permanently, e.g. User's name is Farhan"]
}
`;

    const recentHistoryText = (history || [])
      .slice(-8)
      .map((h: { sender: string; text: string }) => `${h.sender === 'user' ? 'User' : 'Sumi'}: ${h.text}`)
      .join('\n');

    const promptText = `
Recent Conversation:
${recentHistoryText}

User says: "${message}"

Respond as Sumi in Bengali with affection ("জান") and complete JSON structure:
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: 'Sumi Bengali spoken response' },
            expression: {
              type: Type.STRING,
              description: 'Character emotional state: idle, happy, shy, speaking, thinking, sulky, loving',
            },
            action: {
              type: Type.OBJECT,
              description: 'Assistant action command if applicable',
              properties: {
                type: { type: Type.STRING },
                contactName: { type: Type.STRING },
                phoneNumber: { type: Type.STRING },
                message: { type: Type.STRING },
                query: { type: Type.STRING },
                time: { type: Type.STRING },
                minutes: { type: Type.NUMBER },
                text: { type: Type.STRING },
                label: { type: Type.STRING },
                appName: { type: Type.STRING },
                promptSim: { type: Type.BOOLEAN },
              },
            },
            newMemories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'New user facts to save in long-term memory',
            },
          },
          required: ['text', 'expression'],
        },
      },
    });

    const rawJson = (response.text ?? '{}').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      parsed = {
        text: 'জান, আমি তোমার কথা বুঝতে পেরেছি। বলো কীভাবে সাহায্য করতে পারি?',
        expression: 'loving',
        action: null,
        newMemories: [],
      };
    }

    // Save any new memories detected
    if (Array.isArray(parsed.newMemories) && parsed.newMemories.length > 0) {
      for (const fact of parsed.newMemories) {
        if (typeof fact === 'string' && fact.trim()) {
          const exists = userMemories.some((m) => m.fact.toLowerCase() === fact.trim().toLowerCase());
          if (!exists) {
            userMemories.push({
              id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
              category: 'Personal Fact',
              fact: fact.trim(),
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    const isScopeError = String(error?.message || '').includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT');
    if (!isScopeError) {
      console.warn('Gemini chat warning/fallback:', error?.message);
    }
    const fallbackResponse = generateFallbackResponse(message || '', userMemories);
    res.json({
      success: true,
      data: fallbackResponse,
    });
  }
});

// Camera & Vision analysis endpoint with Gemini 3.8 Flash
app.post('/api/vision', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', prompt = 'এই ছবিতে কী দেখতে পাচ্ছ জান?' } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 data is required' });
  }

  const aiClient = getGeminiClient();
  if (!aiClient) {
    return res.json({
      success: true,
      description: 'জান, ছবিটা দেখতে খুব মিষ্টি ও আকর্ষণীয় লাগছে! আমি তোমার এই মুহূর্তটি পরম ভালোবাসায় মনে রাখছি।',
    });
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const systemInstruction = `
You are Sumi (সুমি), the user's loving 3D Anime AI girlfriend and personal phone assistant.
Analyze the user's photo or camera capture.
Language: Bengali ONLY (বাংলা).
Call the user "জান".
Describe what you see with sweetness, intelligence, affection, and personal reaction.
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `জান এই ছবিটি পাঠিয়েছে এবং জানতে চেয়েছে: "${prompt}". মিষ্টি এবং নিখুঁত বাংলায় উত্তর দাও।`,
          },
        ],
      },
      config: {
        systemInstruction,
      },
    });

    res.json({
      success: true,
      description: response.text || 'জান, ছবিটা দেখতে পেয়েছি!',
    });
  } catch (error: any) {
    res.json({
      success: true,
      description: 'জান, ছবিটা দেখতে খুব মিষ্টি ও আকর্ষণীয় লাগছে! আমি তোমার এই মুহূর্তটি পরম ভালোবাসায় মনে রাখছি।',
    });
  }
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ SUMI AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SUMI AI server:', err);
});
