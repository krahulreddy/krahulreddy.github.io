const FALLBACK = {
  pulse: [
    { title: "Open-source multimodal models improve local inference speed", url: "https://news.ycombinator.com/", points: 129, ago: "fallback" },
    { title: "Agentic workflows: where production reliability still breaks", url: "https://news.ycombinator.com/", points: 98, ago: "fallback" },
    { title: "RAG evaluation beyond hit-rate: usefulness and latency", url: "https://news.ycombinator.com/", points: 76, ago: "fallback" }
  ],
  models: [
    { id: "meta-llama/Llama-3.1-8B-Instruct", tags: ["text-generation", "llama"], likes: 1240 },
    { id: "mistralai/Mistral-7B-Instruct-v0.3", tags: ["chat", "instruct"], likes: 860 },
    { id: "google/gemma-2-9b-it", tags: ["gemma", "instruction-tuned"], likes: 740 }
  ],
  research: [
    { title: "Scaling Laws for Inference-Time Compute", venue: "arXiv", year: 2025, url: "https://arxiv.org/" },
    { title: "Efficient Agent Planning with Tool-Use Constraints", venue: "OpenReview", year: 2025, url: "https://openreview.net/" },
    { title: "Multimodal Alignment in Small Open Models", venue: "ACL Findings", year: 2025, url: "https://aclanthology.org/" }
  ]
};

const API_STATUS = {
  pulse: false,
  models: false,
  research: false
};

const escapeHtml = (s = "") =>
  s.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function fetchJsonWithTimeout(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function setStatus(id, text, type = "warn") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `status ${type}`;
}

async function loadPulse() {
  const list = document.getElementById("pulse-list");
  setStatus("pulse-status", "Fetching latest AI discussions...", "warn");
  try {
    const data = await fetchJsonWithTimeout(
      "https://hn.algolia.com/api/v1/search_by_date?query=AI%20LLM%20agents&tags=story&hitsPerPage=6"
    );
    const hits = (data.hits || []).slice(0, 6).map((h) => ({
      title: h.title || "Untitled",
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points || 0,
      ago: h.created_at || ""
    }));
    renderPulse(hits);
    API_STATUS.pulse = true;
    setStatus("pulse-status", "Live feed active", "ok");
  } catch {
    renderPulse(FALLBACK.pulse);
    setStatus("pulse-status", "API unavailable — showing curated fallback", "warn");
  }
}

function renderPulse(items) {
  const list = document.getElementById("pulse-list");
  list.innerHTML = items
    .map(
      (x) => `
      <li>
        <a href="${escapeHtml(x.url)}" target="_blank" rel="noreferrer">${escapeHtml(x.title)}</a>
        <span class="sub">${x.points} points · ${escapeHtml(x.ago)}</span>
      </li>`
    )
    .join("");
}

async function loadModels() {
  setStatus("models-status", "Fetching model metadata...", "warn");
  try {
    const data = await fetchJsonWithTimeout(
      "https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=6"
    );
    const models = (data || []).slice(0, 6).map((m) => ({
      id: m.id || "unknown",
      tags: (m.tags || []).slice(0, 3),
      likes: m.likes || 0
    }));
    renderModels(models);
    API_STATUS.models = true;
    setStatus("models-status", "Live model radar active", "ok");
  } catch {
    renderModels(FALLBACK.models);
    setStatus("models-status", "API unavailable — showing curated fallback", "warn");
  }
}

function renderModels(items) {
  const list = document.getElementById("models-list");
  list.innerHTML = items
    .map(
      (x) => `
      <li>
        <a href="https://huggingface.co/${encodeURIComponent(x.id).replace("%2F", "/")}" target="_blank" rel="noreferrer">${escapeHtml(x.id)}</a>
        <span class="sub">likes: ${x.likes} · tags: ${escapeHtml((x.tags || []).join(", "))}</span>
      </li>`
    )
    .join("");
}

async function loadResearch() {
  setStatus("research-status", "Scanning open research index...", "warn");
  try {
    const data = await fetchJsonWithTimeout(
      "https://api.openalex.org/works?search=large%20language%20model&per-page=5&sort=publication_year:desc"
    );
    const items = (data.results || []).slice(0, 5).map((r) => ({
      title: r.title || "Untitled",
      venue: r.primary_location?.source?.display_name || "Unknown venue",
      year: r.publication_year || "n/a",
      url: r.primary_location?.landing_page_url || "https://openalex.org/"
    }));
    renderResearch(items);
    API_STATUS.research = true;
    setStatus("research-status", "Live research scanner active", "ok");
  } catch {
    renderResearch(FALLBACK.research);
    setStatus("research-status", "API unavailable — showing curated fallback", "warn");
  }
}

function renderResearch(items) {
  const wrap = document.getElementById("research-list");
  wrap.innerHTML = items
    .map(
      (x) => `
      <article class="research-item">
        <div class="title"><a href="${escapeHtml(x.url)}" target="_blank" rel="noreferrer">${escapeHtml(x.title)}</a></div>
        <div class="sub">${escapeHtml(x.venue)} · ${x.year}</div>
      </article>`
    )
    .join("");
}

function countApproxTokens(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.33));
}

function initCostLab() {
  const pricing = {
    small: { in: 0.15, out: 0.6 },
    mid: { in: 3.0, out: 15.0 },
    large: { in: 15.0, out: 75.0 }
  };

  document.getElementById("estimate-cost").addEventListener("click", () => {
    const text = document.getElementById("cost-text").value;
    const tier = document.getElementById("cost-model").value;
    const tokenIn = countApproxTokens(text || " ");
    const tokenOut = Math.round(tokenIn * 1.4);
    const inputCost = (tokenIn / 1_000_000) * pricing[tier].in;
    const outputCost = (tokenOut / 1_000_000) * pricing[tier].out;
    const total = inputCost + outputCost;
    document.getElementById("cost-output").innerHTML = `
      <strong>Estimated tokens:</strong> input ${tokenIn.toLocaleString()} · output ${tokenOut.toLocaleString()}<br>
      <strong>Estimated cost:</strong> $${total.toFixed(5)}<br>
      <small>Formula: input($/1M) + output($/1M), approximate tokenization for quick planning.</small>
    `;
  });
}

function initPromptRefiner() {
  document.getElementById("refine-prompt").addEventListener("click", () => {
    const raw = document.getElementById("prompt-input").value.trim();
    const mode = document.getElementById("prompt-mode").value;
    if (!raw) return;

    const roleMap = {
      engineer: "You are a senior software engineer focused on reliability, performance, and clear implementation detail.",
      product: "You are a product strategy assistant focused on user value, prioritization, and measurable outcomes.",
      research: "You are an AI research assistant focused on assumptions, evidence quality, and tradeoff analysis."
    };

    const refined = [
      roleMap[mode],
      "",
      "Task:",
      raw,
      "",
      "Requirements:",
      "1. State assumptions before proposing a solution.",
      "2. Provide a structured answer with: approach, risks, and next actions.",
      "3. Use concise, high-signal language and avoid generic statements.",
      "4. Include at least one measurable success criterion.",
      "",
      "Output format:",
      "- Summary",
      "- Step-by-step plan",
      "- Risks and mitigations",
      "- Metrics to track"
    ].join("\n");

    document.getElementById("prompt-output").value = refined;
  });
}

function initCapabilities() {
  const checks = [
    ["WebGPU", !!navigator.gpu],
    ["WebAssembly", typeof WebAssembly !== "undefined"],
    ["Web Workers", typeof Worker !== "undefined"],
    ["Speech Recognition", "webkitSpeechRecognition" in window || "SpeechRecognition" in window],
    ["Speech Synthesis", "speechSynthesis" in window],
    ["Camera API", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)],
    ["Local Storage", (() => { try { localStorage.setItem("__x", "1"); localStorage.removeItem("__x"); return true; } catch { return false; } })()]
  ];

  const list = document.getElementById("cap-list");
  list.innerHTML = checks
    .map(([name, ok]) => `<li>${name}: <strong style="color:${ok ? "var(--good)" : "var(--bad)"}">${ok ? "available" : "not available"}</strong></li>`)
    .join("");

  const count = checks.filter(([, ok]) => ok).length;
  document.getElementById("metric-capabilities").textContent = String(count);
}

function updateSummaryMetrics() {
  const active = Object.values(API_STATUS).filter(Boolean).length;
  document.getElementById("metric-apis").textContent = String(active);
  document.getElementById("metric-last-refresh").textContent = nowTime();
}

async function refreshAll() {
  await Promise.allSettled([loadPulse(), loadModels(), loadResearch()]);
  updateSummaryMetrics();
}

document.getElementById("refresh-all").addEventListener("click", refreshAll);

initPromptRefiner();
initCostLab();
initCapabilities();
refreshAll();
