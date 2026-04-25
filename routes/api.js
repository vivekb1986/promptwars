const express = require('express');
const router = express.Router();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
// ── POST /api/chat ─────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '`messages` array is required.' });
  }

  const allMessage = messages[messages.length - 1];
  const lastMessage = allMessage.content;



  try {
    // Dynamically import node-fetch (ESM package)
    const { default: fetch } = await import('node-fetch');

    const geminiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': 'AIzaSyC4kVS0XBs2OXTZYI2oP_raZDphAR4rtI4',
      },
      body: JSON.stringify({
        "contents": [
          {
            role: "user",
            "parts": [
              {
                "text": systemPrompt
              }
            ]
          },
          {
            role: "user",
            "parts": [
              {
                "text": lastMessage
              }
            ]
          }
        ]
      }),
    });


    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('Gemini API error:', errBody);
      return res.status(geminiRes.status).json({ error: 'Gemini API error', detail: errBody });
    }
    const data = await geminiRes.json();
    const text = data.candidates[0].content.parts[0].text || ""

    return res.json({ text });
  } catch (err) {
    console.error('Error calling Gemini:', err);
    return res.status(500).json({ error: 'Failed to reach Gemini API.' });
  }
});

module.exports = router;
