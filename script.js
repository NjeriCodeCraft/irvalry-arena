// ---------- Config ----------
const MODEL = "gemini-flash-latest";
const API_URL = (key) => `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

// ---------- Elements ----------
const setupView = document.getElementById("setupView");
const loadingView = document.getElementById("loadingView");
const resultView = document.getElementById("resultView");
const loadingText = document.getElementById("loadingText");

const fighterAInput = document.getElementById("fighterA");
const fighterBInput = document.getElementById("fighterB");
const startBtn = document.getElementById("startBtn");
const errorMsg = document.getElementById("errorMsg");
const againBtn = document.getElementById("againBtn");
const impactFlash = document.getElementById("impactFlash");

const keyBtn = document.getElementById("keyBtn");
const keyModal = document.getElementById("keyModal");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const closeKeyBtn = document.getElementById("closeKeyBtn");

const voiceBtn = document.getElementById("voiceBtn");
let currentRivalry = null;
let isSpeaking = false;

const LOADING_MESSAGES = [
  "ENTERING THE ARENA…",
  "WEIGHING UP THE PASSION…",
  "WARMING UP THE CROWD…",
  "CONSULTING THE JUDGES…",
  "SHARPENING THE TRASH TALK…"
];

// ---------- API key handling ----------
let sessionKey = "";

function getKey() {
  try {
    const stored = localStorage.getItem("rivalry_gemini_key");
    if (stored) return stored;
  } catch (e) { /* storage blocked */ }
  return sessionKey;
}

function setKey(k) {
  sessionKey = k;
  try {
    localStorage.setItem("rivalry_gemini_key", k);
  } catch (e) {
    console.warn("localStorage unavailable — key will only persist for this session.");
  }
}

keyBtn.addEventListener("click", () => {
  apiKeyInput.value = getKey();
  keyModal.hidden = false;
});
closeKeyBtn.addEventListener("click", () => keyModal.hidden = true);
saveKeyBtn.addEventListener("click", () => {
  setKey(apiKeyInput.value.trim());
  keyModal.hidden = true;
});

// ---------- Start button ----------
startBtn.addEventListener("click", async () => {
  const a = fighterAInput.value.trim();
  const b = fighterBInput.value.trim();
  errorMsg.textContent = "";

  if (!a || !b) {
    errorMsg.textContent = "Give both contenders a name first.";
    return;
  }
  const key = getKey();
  if (!key) {
    errorMsg.textContent = "Add your free Google AI (Gemini) API key first — click 'API Key' above.";
    keyModal.hidden = false;
    return;
  }

  showLoading();
  try {
    const data = await generateRivalry(a, b, key);
    renderResult(a, b, data);
    showResult();
  } catch (err) {
    console.error(err);
    setupView.hidden = false;
    loadingView.hidden = true;
    errorMsg.textContent = "Something went wrong: " + err.message;
  }
});

againBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  setSpeaking(false);
  resultView.hidden = true;
  setupView.hidden = false;
  fighterAInput.value = "";
  fighterBInput.value = "";
  fighterAInput.focus();
});

function showLoading() {
  setupView.hidden = true;
  loadingView.hidden = false;
  let i = 0;
  loadingText.textContent = LOADING_MESSAGES[0];
  const interval = setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    loadingText.textContent = LOADING_MESSAGES[i];
  }, 900);
  loadingView.dataset.intervalId = interval;
}

function showResult() {
  loadingView.hidden = true;
  clearInterval(Number(loadingView.dataset.intervalId));
  resultView.hidden = false;
  impactFlash.classList.remove("flash");
  void impactFlash.offsetWidth; // restart animation
  impactFlash.classList.add("flash");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Gemini call ----------
async function generateRivalry(a, b, key) {
  const prompt = `You are a hype sports announcer AI judging a passionate rivalry between two fandoms/topics: "${a}" and "${b}".

Respond with ONLY valid JSON (no markdown fences, no commentary outside the JSON) matching this exact schema:
{
  "winner": "the exact string of either \\"${a}\\" or \\"${b}\\"",
  "stats": [
    {"label": "short stat name", "a": "value/score for ${a}", "b": "value/score for ${b}"},
    {"label": "short stat name", "a": "value/score for ${a}", "b": "value/score for ${b}"},
    {"label": "short stat name", "a": "value/score for ${a}", "b": "value/score for ${b}"},
    {"label": "short stat name", "a": "value/score for ${a}", "b": "value/score for ${b}"}
  ],
  "commentary": "2-3 punchy sentences of dramatic ringside commentary about this specific rivalry, written like a boxing announcer hyping the crowd",
  "trashTalk": [
    {"speaker": "${a}", "line": "a witty, PG-13, good-natured trash talk line"},
    {"speaker": "${b}", "line": "a witty, PG-13, good-natured trash talk line responding"},
    {"speaker": "${a}", "line": "a witty comeback"},
    {"speaker": "${b}", "line": "a final witty comeback"}
  ]
}

Make the stats genuinely creative and specific to these two topics (not generic like "power level"), keep trash talk playful and never mean-spirited or offensive, and keep everything short and punchy.`;

  const res = await fetch(API_URL(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 }
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `API request failed (${res.status})`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("No response from Gemini.");

  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Couldn't parse the AI's response. Try again.");
  }
  return parsed;
}

// ---------- Rendering ----------
function renderResult(a, b, data) {
  currentRivalry = { a, b, data };

  document.getElementById("resultA").textContent = a;
  document.getElementById("resultB").textContent = b;
  document.getElementById("verdictWinner").textContent = data.winner || "It's a draw";

  const statsGrid = document.getElementById("statsGrid");
  statsGrid.innerHTML = "";
  (data.stats || []).forEach(stat => {
    statsGrid.appendChild(statCell(`${a} — ${stat.label}`, stat.a));
    statsGrid.appendChild(statCell(`${b} — ${stat.label}`, stat.b));
  });

  document.getElementById("commentaryText").textContent = data.commentary || "";

  const trashTalkEl = document.getElementById("trashTalk");
  trashTalkEl.innerHTML = "";
  (data.trashTalk || []).forEach(t => {
    const div = document.createElement("div");
    div.className = "trash-line";
    div.innerHTML = `<span class="speaker">${escapeHtml(t.speaker)}</span><span class="line">"${escapeHtml(t.line)}"</span>`;
    trashTalkEl.appendChild(div);
  });
}

function statCell(label, value) {
  const div = document.createElement("div");
  div.className = "stat-cell";
  div.innerHTML = `<span class="stat-label">${escapeHtml(label)}</span><span class="stat-value">${escapeHtml(String(value))}</span>`;
  return div;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// Enter key triggers start
[fighterAInput, fighterBInput].forEach(input => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startBtn.click();
  });
});

// ---------- Voice playback (click to play) ----------
voiceBtn.addEventListener("click", () => {
  if (isSpeaking) {
    speechSynthesis.cancel();
    setSpeaking(false);
    return;
  }
  if (!currentRivalry) return;
  playRivalry(currentRivalry.a, currentRivalry.b, currentRivalry.data);
});

function setSpeaking(state) {
  isSpeaking = state;
  voiceBtn.textContent = state ? "⏹ Stop" : "🔊 Hear It Play Out";
  voiceBtn.classList.toggle("playing", state);
}

function pickVoices() {
  const voices = speechSynthesis.getVoices();
  const english = voices.filter(v => v.lang.startsWith("en"));
  const pool = english.length >= 3 ? english : voices;
  return {
    narrator: pool[0] || null,
    a: pool[1] || pool[0] || null,
    b: pool[2] || pool[0] || null
  };
}

function speak(text, voice, pitch, rate) {
  return new Promise(resolve => {
    if (!text) return resolve();
    const utter = new SpeechSynthesisUtterance(text);
    if (voice) utter.voice = voice;
    utter.pitch = pitch;
    utter.rate = rate;
    utter.onend = resolve;
    utter.onerror = resolve;
    speechSynthesis.speak(utter);
  });
}

async function playRivalry(a, b, data) {
  setSpeaking(true);
  const voices = pickVoices();

  await speak(`Ladies and gentlemen! Tonight's rivalry: ${a}, versus, ${b}!`, voices.narrator, 1, 0.95);
  await speak(data.commentary || "", voices.narrator, 1, 1);

  for (const line of (data.trashTalk || [])) {
    if (!isSpeaking) break; // stopped mid-way
    const isA = line.speaker === a;
    await speak(`${line.speaker} says: ${line.line}`, isA ? voices.a : voices.b, isA ? 1 : 0.8, 1);
  }

  if (isSpeaking) await speak(`And the winner is... ${data.winner}!`, voices.narrator, 1.1, 0.9);
  setSpeaking(false);
}