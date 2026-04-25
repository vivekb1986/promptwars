/* ─────────────────────────────────────────────────────────────────────────
   app.js  –  Intelligent Learning Assistant (client-side logic)
   Calls our Express backend at /api/chat, which proxies to Anthropic.
   ───────────────────────────────────────────────────────────────────────── */

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  topic: '',
  level: '',
  style: '',
  messages: [],
  knowledgeNodes: { learned: [], learning: [] },
  lessonCount: 0,
  isLoading: false,
};

// ── DOM refs ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const onboardingEl      = $('onboarding');
const sessionEl         = $('session');
const topicInput        = $('topicInput');
const startBtn          = $('startBtn');
const sessionTitle      = $('sessionTitle');
const sessionTags       = $('sessionTags');
const progressBar       = $('progressBar');
const messagesEl        = $('messages');
const comprehensionRow  = $('comprehensionRow');
const chatInput         = $('chatInput');
const sendBtn           = $('sendBtn');
const nodesSection      = $('nodesSection');
const nodesList         = $('nodesList');
const resetBtn          = $('resetBtn');

// ── Onboarding interactions ────────────────────────────────────────────────
document.querySelectorAll('.quick-topic').forEach(el => {
  el.addEventListener('click', () => {
    topicInput.value = el.dataset.topic;
    state.topic = el.dataset.topic;
    checkReady();
  });
});

document.querySelectorAll('.level-card').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    state.level = el.dataset.level;
    checkReady();
  });
});

document.querySelectorAll('.style-card').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    state.style = el.dataset.style;
    checkReady();
  });
});

topicInput.addEventListener('input', () => {
  state.topic = topicInput.value.trim();
  checkReady();
});

function checkReady() {
  startBtn.disabled = !(state.topic && state.level && state.style);
}

// ── Start session ──────────────────────────────────────────────────────────
startBtn.addEventListener('click', startSession);

async function startSession() {
  onboardingEl.style.display = 'none';
  sessionEl.style.display    = 'flex';

  sessionTitle.textContent = state.topic;

  const styleLabels = {
    analogies : 'Analogies',
    examples  : 'Examples',
    structured: 'Structured',
    socratic  : 'Socratic',
  };

  sessionTags.innerHTML = `
    <span class="tag tag-level">${state.level}</span>
    <span class="tag tag-style">${styleLabels[state.style]}</span>
  `;

  state.messages = [];

  await callAI(
    'Start the first lesson on this topic. Begin engaging, concise, and adapted to my level and style. ' +
    'After explaining the first key idea, pause and show a comprehension check by ending with exactly: [COMPREHENSION_CHECK]',
    buildSystemPrompt()
  );
}

// ── System prompt ──────────────────────────────────────────────────────────
function buildSystemPrompt() {
  const styleGuides = {
    analogies : 'Use vivid analogies and storytelling to explain concepts. Make everything relatable to everyday life.',
    examples  : 'Always lead with a concrete example before explaining the theory or concept behind it.',
    structured: 'Use clear definitions, numbered frameworks, and precise language. Be systematic.',
    socratic  : 'Guide the learner through discovery by asking thought-provoking questions. Let them reason through concepts.',
  };

  return `You are an expert adaptive learning tutor teaching "${state.topic}" to a ${state.level}-level learner.

Teaching style: ${styleGuides[state.style]}

CRITICAL RULES:
1. Adapt your depth and vocabulary to a ${state.level} learner strictly.
2. Teach one focused concept at a time — never overwhelm with too much at once.
3. After every explanation, end with [COMPREHENSION_CHECK] so the UI shows response options.
4. When the learner says they understood, move to the next logical concept in a natural progression.
5. If asked to slow down: re-explain more simply with a different approach.
6. If asked for an example: give a concrete, vivid, real-world example.
7. If asked to quiz: create a simple question and evaluate their answer.
8. Respond with [NODES: learned=concept1,concept2 learning=concept3,concept4] at the end of messages where knowledge changes.
9. Keep responses focused — aim for 80–150 words per response.
10. Be warm, encouraging, and intellectually exciting. Make learning feel like discovery.
11. Use simple markdown: **bold** for key terms, bullet lists when helpful.`;
}

// ── Comprehension buttons ──────────────────────────────────────────────────
document.querySelectorAll('.check-btn').forEach(btn => {
  btn.addEventListener('click', () => sendComprehension(btn.dataset.check));
});

const comprehensionMsgs = {
  'got-it' : "I understand! Please continue to the next concept.",
  'slower' : "Can you explain that again more simply? I'm a bit lost.",
  'example': "Could you give me a concrete real-world example to make this clearer?",
  'quiz'   : "Please quiz me on what I just learned to test my understanding.",
};

async function sendComprehension(type) {
  comprehensionRow.style.display = 'none';
  const text = comprehensionMsgs[type];
  addMessage('user', text);
  state.messages.push({ role: 'user', content: text });
  await callAI(null, null);
}

// ── Chat input ─────────────────────────────────────────────────────────────
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
});

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || state.isLoading) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';

  addMessage('user', text);
  state.messages.push({ role: 'user', content: text });

  await callAI(null, null);
}

// ── API call (→ Express backend → Anthropic) ───────────────────────────────
async function callAI(initialUserMsg, systemOverride) {
  state.isLoading           = true;
  sendBtn.disabled          = true;
  comprehensionRow.style.display = 'none';

  const typingEl = addTypingIndicator();

  const messages = [...state.messages];
  if (initialUserMsg) messages.push({ role: 'user', content: initialUserMsg });

  try {
    const res = await fetch('/api/chat', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        messages,
        systemPrompt: systemOverride || buildSystemPrompt(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const { text: raw } = await res.json();

    removeTypingIndicator(typingEl);

    let text = raw;

    // Parse knowledge nodes
    const nodeMatch = text.match(/\[NODES:\s*learned=([^\s\]]*)\s*learning=([^\]]*)\]/);
    if (nodeMatch) {
      const newLearned  = nodeMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const newLearning = nodeMatch[2].split(',').map(s => s.trim()).filter(Boolean);

      newLearned.forEach(n => {
        if (!state.knowledgeNodes.learned.includes(n)) state.knowledgeNodes.learned.push(n);
      });
      state.knowledgeNodes.learning = newLearning;
      text = text.replace(/\[NODES:[^\]]*\]/g, '');
      renderNodes();
    }

    const showCheck = text.includes('[COMPREHENSION_CHECK]');
    text = text.replace(/\[COMPREHENSION_CHECK\]/g, '').trim();

    addMessage('assistant', formatMessage(text), true);

    // Update history
    if (initialUserMsg) state.messages.push({ role: 'user', content: initialUserMsg });
    state.messages.push({ role: 'assistant', content: raw });

    // Advance progress bar
    state.lessonCount++;
    progressBar.style.width = Math.min(5 + state.lessonCount * 12, 92) + '%';

    if (showCheck) {
      setTimeout(() => { comprehensionRow.style.display = 'flex'; }, 400);
    }

  } catch (err) {
    removeTypingIndicator(typingEl);
    addMessage('assistant', `Error: ${err.message}. Please try again.`);
    console.error('callAI error:', err);
  }

  state.isLoading  = false;
  sendBtn.disabled = false;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── Markdown formatter ─────────────────────────────────────────────────────
function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g,          '</p><p>')
    .replace(/\n- /g,          '<br>• ')
    .replace(/\n(\d+)\. /g,    '<br>$1. ')
    .replace(/\n/g,            '<br>');
}

// ── DOM helpers ────────────────────────────────────────────────────────────
function addMessage(role, content, isHtml = false) {
  const div    = document.createElement('div');
  div.className = `msg ${role}`;

  const sender = document.createElement('div');
  sender.className = 'msg-sender';
  sender.textContent = role === 'user' ? 'You' : 'Tutor';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (isHtml) {
    bubble.innerHTML = `<p>${content}</p>`;
  } else {
    bubble.textContent = content;
  }

  div.appendChild(sender);
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'msg assistant';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="msg-sender">Tutor</div>
    <div class="msg-bubble">
      <div class="typing-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function removeTypingIndicator(el) {
  if (el?.parentNode) el.parentNode.removeChild(el);
  $('typing-indicator')?.remove();
}

function renderNodes() {
  const all = [...state.knowledgeNodes.learned, ...state.knowledgeNodes.learning];
  if (!all.length) { nodesSection.style.display = 'none'; return; }

  nodesSection.style.display = 'block';
  nodesList.innerHTML = '';

  state.knowledgeNodes.learned.forEach(n => {
    const span = document.createElement('span');
    span.className   = 'node learned';
    span.textContent = '✓ ' + n;
    nodesList.appendChild(span);
  });

  state.knowledgeNodes.learning.forEach(n => {
    const span = document.createElement('span');
    span.className   = 'node learning';
    span.textContent = '→ ' + n;
    nodesList.appendChild(span);
  });
}

// ── Reset ──────────────────────────────────────────────────────────────────
resetBtn.addEventListener('click', resetSession);

function resetSession() {
  Object.assign(state, {
    topic: '', level: '', style: '',
    messages: [],
    knowledgeNodes: { learned: [], learning: [] },
    lessonCount: 0,
    isLoading: false,
  });

  sessionEl.style.display    = 'none';
  onboardingEl.style.display = 'flex';
  messagesEl.innerHTML       = '';
  topicInput.value           = '';
  progressBar.style.width    = '5%';

  document.querySelectorAll('.level-card, .style-card').forEach(c => c.classList.remove('active'));
  startBtn.disabled              = true;
  nodesSection.style.display     = 'none';
  comprehensionRow.style.display = 'none';
}
