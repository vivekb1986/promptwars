# Intelligent Learning Assistant

An adaptive AI-powered learning tutor built with Node.js + Express and the Anthropic Claude API.

## Project Structure

```
learning-assistant/
├── server.js            # Express app entry point
├── routes/
│   └── api.js           # POST /api/chat  →  proxies to Anthropic
├── public/
│   ├── index.html       # Single-page UI
│   ├── css/
│   │   └── style.css    # All styles
│   └── js/
│       └── app.js       # All client-side logic
├── .env.example         # Environment variable template
├── .gitignore
└── package.json
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then open `.env` and paste in your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
```

Get your key from https://console.anthropic.com/

### 3. Run the server

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

Open http://localhost:3000 in your browser.

## How It Works

| Layer | What it does |
|---|---|
| `public/index.html` | UI shell — onboarding form + chat session |
| `public/css/style.css` | All styles (light + dark mode) |
| `public/js/app.js` | UI logic, state, calls `POST /api/chat` |
| `routes/api.js` | Receives request, forwards to Anthropic with the secret key |
| `server.js` | Serves static files, mounts the API router |

The API key never leaves the server — the browser only talks to your own `/api/chat` endpoint.

## Features

- **Personalized onboarding** — topic, skill level (beginner / intermediate / advanced), learning style (analogies, examples, structured, Socratic)
- **Adaptive lessons** — tutor adjusts depth and vocabulary based on your level
- **Comprehension checks** — after each concept, choose: continue, slow down, get an example, or take a quiz
- **Live knowledge map** — tracks concepts you've mastered vs. currently learning
- **Progress bar** — visual lesson progress
- **Dark mode** — automatic via `prefers-color-scheme`
