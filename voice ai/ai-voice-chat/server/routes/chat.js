import { Router } from "express";
import rateLimit from "express-rate-limit";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // read server-side only, never sent to the browser
});

// Basic abuse protection. Tune these numbers for your expected traffic.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again." },
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are a helpful conversational assistant.
Be honest about the limits of your knowledge: your answers depend on your
training data, the current conversation's context, and any tools or
documents connected to you. You do not have real-time or unlimited
knowledge. If asked about very recent events and no search tool result is
provided, say so plainly instead of guessing.`;

router.post("/", chatLimiter, async (req, res, next) => {
  try {
    const { messages } = req.body;

    // Basic input validation — reject malformed requests before they hit the API.
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "`messages` must be a non-empty array." });
    }
    for (const m of messages) {
      if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
        return res.status(400).json({
          error: "Each message needs a `role` of 'user' or 'assistant' and string `content`.",
        });
      }
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");

    res.json({
      reply: textBlock ? textBlock.text : "",
      stopReason: response.stop_reason,
      model: response.model,
    });
  } catch (err) {
    // Surface a clean message for common Anthropic API error shapes.
    if (err?.status === 401) {
      return res.status(500).json({ error: "Server auth with Claude API failed. Check ANTHROPIC_API_KEY." });
    }
    if (err?.status === 429) {
      return res.status(429).json({ error: "Claude API rate limit reached. Please try again shortly." });
    }
    if (err?.status === 529 || err?.status === 503) {
      return res.status(503).json({ error: "Claude API is temporarily overloaded. Please try again shortly." });
    }
    next(err);
  }
});

export default router;
