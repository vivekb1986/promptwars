const express = require('express');
const router = express.Router();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
// ── POST /api/chat ─────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '\`messages\` array is required.' });
  }

  // Format messages for Gemini API
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const geminiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt || "" }]
        },
        contents: contents
      }),
    });


    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('Gemini API error:', errBody);
      return res.status(geminiRes.status).json({ error: 'Gemini API error', detail: errBody });
    }
    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.json({ text });
  } catch (err) {
    console.error('Error calling Gemini:', err);
    return res.status(500).json({ error: 'Failed to reach Gemini API.' });
  }
});

module.exports = router;
