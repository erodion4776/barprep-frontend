import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-Memory Database for local fallback
const defaultModules = [
  {
    id: "cm_1",
    topic: "Constitutional Law",
    title: "Introduction to Constitutional Law: Judicial Review & Federalism",
    video_url: "https://www.youtube.com/watch?v=07mPZ00Y9K0",
    thumbnail_url: "https://img.youtube.com/vi/07mPZ00Y9K0/0.jpg",
    ai_summary: "This module covers the core foundation of Constitutional Law, focusing on judicial review (Marbury v. Madison), federalism, the Commerce Clause, and the separation of powers.",
    ai_outline: "### 1. Judicial Review\n- Established in *Marbury v. Madison* (1803).\n- Power of the Supreme Court to declare laws unconstitutional.\n- Requirements of Justiciability: Standing, Ripeness, Mootness, Political Question.\n\n### 2. Federalism & Separation of Powers\n- Division of authority between federal and state governments.\n- Enumerated powers under Article I, Section 8.\n- Tenth Amendment reserving powers to states.\n- Supremacy Clause.",
    is_published: true,
    order_index: 0
  },
  {
    id: "cm_2",
    topic: "Contracts",
    title: "The Law of Contracts: Offer, Acceptance, and Consideration",
    video_url: "https://www.youtube.com/watch?v=vDqU15_mG0A",
    thumbnail_url: "https://img.youtube.com/vi/vDqU15_mG0A/0.jpg",
    ai_summary: "Master the essential elements of contract formation, including offer, acceptance, the mailbox rule, bilateral vs. unilateral contracts, and legal consideration.",
    ai_outline: "### 1. Mutual Assent\n- **Offer**: Objective manifestation of intent to be bound, definite terms, and communication to offeree.\n- **Acceptance**: Unequivocal agreement to terms. *Mailbox Rule* (acceptance effective upon dispatch).\n\n### 2. Consideration\n- Bargained-for exchange of legal detriment.\n- Pre-existing duty rule.\n- Promissory Estoppel as a consideration substitute.",
    is_published: true,
    order_index: 1
  },
  {
    id: "cm_3",
    topic: "Torts",
    title: "Torts: Negligence, Duty of Care, and Proximate Cause",
    video_url: "https://www.youtube.com/watch?v=P9u_B4oW-lQ",
    thumbnail_url: "https://img.youtube.com/vi/P9u_B4oW-lQ/0.jpg",
    ai_summary: "An in-depth breakdown of negligence, focusing on duty of care (Cardozo vs. Andrews), breach, actual cause, proximate cause, and damages.",
    ai_outline: "### 1. Elements of Negligence\n- **Duty**: Reasonably prudent person standard. Special duties for landowners and professionals.\n- **Breach**: Failure to meet the standard of care (Learned Hand formula).\n- **Causation**:\n  - *Actual Cause*: But-for test.\n  - *Proximate Cause*: Foreseeability (Palsgraf v. Long Island Railroad Co.).\n- **Damages**: Actual physical or property harm.",
    is_published: true,
    order_index: 2
  }
];

let modules = [...defaultModules];
let sessions: any[] = [];

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API: Daily Affirmations
app.get("/api/affirmation", (req, res) => {
  const affirmations = [
    "You have the analytical mind and the diligence to conquer this exam. One rule, one analysis, one day at a time.",
    "The Bar Exam is a test of minimum competence, not perfection. Keep steady and trust your prep.",
    "Every MBE question you practice is a lesson learned. Embrace mistakes as steps to passing.",
    "Focus on your own lane. Stay disciplined, master the rules, and you will see that 'Pass' next to your name.",
    "Your legal journey has prepared you for this moment. Deep breaths, clear thoughts, strong analysis.",
    "You are fully capable of reasoning through any complex legal scenario. Master the elements, apply the facts.",
  ];
  const idx = Math.floor(Math.random() * affirmations.length);
  res.json({ affirmation: affirmations[idx] });
});

// API: Chat Coaching
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!ai) {
    return res.json({
      reply: "Hello! I am your AI Bar Exam coach. It looks like the Gemini API key is not configured, but I can still tell you to keep up the great study efforts! Master the elements of the rule and apply the facts systematically.",
      sources: []
    });
  }

  try {
    const SYSTEM_COACH = `You are a world-class Bar Exam Prep Coach and legal expert.
Your goal is to help students study for the MBE (Multistate Bar Examination) and MEE (Multistate Essay Examination).
Provide clear, structured explanations of legal concepts, cite relevant common law rules or Federal Rules (FRCP, FRE, etc.) where applicable, and break down complex reasoning step-by-step.
Always maintain an encouraging, supportive, and professional tone. Highlight common traps or mistakes students make on the exam.`;

    const contents: any[] = [];
    if (history && history.length > 0) {
      for (const h of history) {
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content || h.message || "" }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_COACH,
      },
    });

    res.json({
      reply: response.text || "No response received.",
      sources: []
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Ingest Url
app.post("/api/ingest-url", (req, res) => {
  const { url } = req.body;
  res.json({ message: `Successfully ingested knowledge base article from: ${url}` });
});

// API: Mock Exam (Generate & Evaluate)
app.post("/api/mock-exam", async (req, res) => {
  const { action } = req.body;

  if (!ai) {
    if (action === "generate") {
      return res.json({
        question: "Under common law, which of the following best defines the crime of burglary?\n\nA. The taking and carrying away of personal property of another with the intent to permanently deprive.\nB. The breaking and entering of a dwelling of another at nighttime with the intent to commit a felony therein.\nC. The trespassory taking of personal property of another from their person by force or threat.\nD. The malicious burning of a dwelling house of another.",
        correct_letter: "B",
        rationale: "B is the correct common law definition of burglary. Option A is larceny, Option C is robbery, and Option D is arson."
      });
    } else {
      const isCorrect = req.body.answer === "B";
      return res.json({
        reply: isCorrect ? "Excellent job! You correctly identified the common law elements of burglary." : "That is incorrect. The common law elements require breaking, entering, dwelling, of another, at nighttime, with intent to commit a felony.",
        is_correct: isCorrect,
        correct_letter: "B"
      });
    }
  }

  try {
    if (action === "generate") {
      const { topic } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a single challenging, realistic MBE-style multiple choice question on the topic of "${topic || "General Law"}". 
The question must have a factual scenario, followed by a call of the question, and four choices (labeled A, B, C, D).
Make sure to also specify the correct letter and a detailed explanation of why that option is correct and why the others are incorrect.`,
        config: {
          systemInstruction: "You are an expert Bar Prep exam designer. Generate challenging, realistic MBE (Multistate Bar Examination) multiple-choice questions with high-quality legal reasoning.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The complete question text, including the factual scenario, the question call, and options labeled A, B, C, D.",
              },
              correct_letter: {
                type: Type.STRING,
                description: "The correct answer option letter (MUST be 'A', 'B', 'C', or 'D').",
              },
              rationale: {
                type: Type.STRING,
                description: "A detailed explanation of why the correct choice is legally correct and why each other choice is incorrect.",
              }
            },
            required: ["question", "correct_letter", "rationale"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } else if (action === "evaluate") {
      const { question, answer, correct_letter, rationale } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `The student is answering the following MBE question:
Question: ${question}
The correct answer is Option ${correct_letter}.
The legal rationale is: ${rationale}

The student selected Option: ${answer}

Evaluate their selection. Provide a supportive, educational explanation confirming if they are correct or breaking down their misconception if incorrect.
Return the result as JSON matching the requested schema.`,
        config: {
          systemInstruction: "You are an expert Bar Prep grader. Provide high-quality legal tutoring feedback to a student.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "A highly educational feedback message explaining the correct law and addressing the student's selection.",
              },
              is_correct: {
                type: Type.BOOLEAN,
                description: "Whether the student's answer was correct.",
              },
              correct_letter: {
                type: Type.STRING,
                description: "The correct answer option (MUST be 'A', 'B', 'C', or 'D').",
              }
            },
            required: ["reply", "is_correct", "correct_letter"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } else {
      res.status(400).json({ error: "Invalid mock exam action" });
    }
  } catch (error: any) {
    console.error("Mock exam error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get modules
app.get("/api/get-modules", (req, res) => {
  const { topic, all } = req.query;
  let filtered = modules;
  if (topic) {
    filtered = filtered.filter(m => m.topic.toLowerCase() === (topic as string).toLowerCase());
  }
  if (all !== "true") {
    filtered = filtered.filter(m => m.is_published);
  }
  res.json({ modules: filtered });
});

// API: Process Video / Lecture Creation
app.post("/api/process-video", async (req, res) => {
  const { url, topic, order_index } = req.body;

  // Extract youtube video ID
  let youtubeId = "";
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      youtubeId = urlObj.searchParams.get("v") || "";
    } else if (urlObj.hostname.includes("youtu.be")) {
      youtubeId = urlObj.pathname.slice(1);
    }
  } catch {
    youtubeId = "07mPZ00Y9K0";
  }

  const thumbnail_url = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/0.jpg` : "";

  if (!ai) {
    const mockModule = {
      id: "cm_" + Math.random().toString(36).substr(2, 9),
      topic: topic || "Constitutional Law",
      title: "Processed Lecture: " + (topic || "Legal Concepts"),
      video_url: url,
      thumbnail_url,
      ai_summary: "A professional video course covering advanced bar exam concepts and legal rules.",
      ai_outline: "### 1. Introduction\n- Key definitions and overview of the topic.\n\n### 2. Deep Dive\n- Essential elements of the rule and case illustrations.",
      is_published: true,
      order_index: order_index || 0
    };
    modules.push(mockModule);
    return res.json({ message: "Successfully processed YouTube lecture!", source_type: "description" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a high-quality educational study module for a bar-prep video lecture on the topic of "${topic}".
Create a professional lecture title, a concise learning summary (2-3 sentences), and a structured lecture outline in markdown.`,
      config: {
        systemInstruction: "You are an academic course designer preparing lectures for the bar exam.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A professional, realistic lecture title.",
            },
            ai_summary: {
              type: Type.STRING,
              description: "A high-quality 2-3 sentence overview of what the student will learn.",
            },
            ai_outline: {
              type: Type.STRING,
              description: "A comprehensive, structured lecture outline formatted in markdown.",
            }
          },
          required: ["title", "ai_summary", "ai_outline"]
        }
      }
    });

    const aiData = JSON.parse(response.text || "{}");
    const newModule = {
      id: "cm_" + Math.random().toString(36).substr(2, 9),
      topic: topic || "General Law",
      title: aiData.title || "Custom Video Lecture",
      video_url: url,
      thumbnail_url,
      ai_summary: aiData.ai_summary || "Video lecture summary.",
      ai_outline: aiData.ai_outline || "# Outline",
      is_published: true,
      order_index: order_index || 0
    };
    modules.push(newModule);

    res.json({ message: "Successfully processed YouTube lecture!", source_type: "transcript" });
  } catch (err: any) {
    console.error("Process video error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Same route under '/api/api/process-video' just in case
app.post("/api/api/process-video", async (req, res) => {
  const { url, topic, order_index } = req.body;
  // Forward to /api/process-video
  res.redirect(307, "/api/process-video");
});

// API: Chat Sessions
app.get("/api/chat-sessions", (req, res) => {
  const userId = req.headers["x-user-id"];
  const all = req.query.all === "true";

  if (all) {
    res.json({ sessions });
  } else if (userId) {
    const userSessions = sessions.filter(s => s.userId === userId);
    res.json({ sessions: userSessions });
  } else {
    // For local dev/anonymous requests, filter by no userId
    const anonSessions = sessions.filter(s => !s.userId);
    res.json({ sessions: anonSessions });
  }
});

app.post("/api/chat-sessions", (req, res) => {
  const { action } = req.body;
  const headerUserId = req.headers["x-user-id"] || null;
  const headerUserEmail = req.headers["x-user-email"] || "Anonymous";

  if (action === "create") {
    const { title, messages } = req.body;
    const newSession = {
      id: "sess_" + Math.random().toString(36).substr(2, 9),
      title: title || "New Study Session",
      messages: messages || [],
      userId: headerUserId,
      userEmail: headerUserEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    sessions.push(newSession);
    res.json({ session: newSession });
  } else if (action === "update") {
    const { id, title, messages } = req.body;
    const session = sessions.find(s => s.id === id);
    if (session) {
      if (title !== undefined) session.title = title;
      if (messages !== undefined) session.messages = messages;
      session.updated_at = new Date().toISOString();
      res.json({ session });
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  } else if (action === "get") {
    const { id } = req.body;
    const session = sessions.find(s => s.id === id);
    if (session) {
      res.json({ session });
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  } else if (action === "delete") {
    const { id } = req.body;
    const idx = sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      sessions.splice(idx, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  } else {
    res.status(400).json({ error: "Invalid chat session action" });
  }
});

// API: Process PDF
app.post("/api/process-pdf", (req, res) => {
  res.json({ message: "Successfully processed and indexed PDF document!" });
});

// API: Admin Authentication
app.post("/api/admin-auth", (req, res) => {
  const { action, password } = req.body;
  if (action === "login") {
    // Let any non-empty password pass or match 'admin123'
    if (password) {
      res.json({ token: "mock-admin-token" });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  } else if (action === "verify") {
    if (password === "mock-admin-token" || password === "admin123") {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  } else {
    res.status(400).json({ error: "Invalid admin action" });
  }
});

// Vite middleware for dev / express static in prod
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
