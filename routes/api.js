const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: "AIzaSyBVKO_JSQkINtxo0AoNNk1uFpPBIdcq5dA" });

const ANTHROPIC_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
// const MODEL             = 'claude-sonnet-4-20250514';

// ── POST /api/chat ─────────────────────────────────────────────────────────
// Body: { messages, systemPrompt }
router.post('/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '`messages` array is required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server.' });
  }

  try {
    // Dynamically import node-fetch (ESM package)
    const { default: fetch } = await import('node-fetch');

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': 'AIzaSyBVKO_JSQkINtxo0AoNNk1uFpPBIdcq5dA',
        // 'anthropic-version' : '2023-06-01',
      },
      body: JSON.stringify({
        "contents": [
          {
            "parts": [
              {
                "text": "Explain how AI works in a few words"
              }
            ]
          }
        ]
      }),
    });



    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('Gemini API error:', errBody);
      return res.status(anthropicRes.status).json({ error: 'Gemini API error', detail: errBody });
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text ?? '';

    return res.json({ text });
  } catch (err) {
    console.error('Error calling Gemini:', err);
    return res.status(500).json({ error: 'Failed to reach Gemini API.' });
  }
});

module.exports = router;
