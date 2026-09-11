const TOKEN_KEY = "genshin_sorter_token";
const SAVE_KEY = "genshin_sorter_state";

const QUESTION_BANK = [
  { id: "funniest", prompt: "你觉得谁最容易让你笑出来？" },
  { id: "cutest", prompt: "你觉得谁是最可爱的角色？" },
  { id: "coolest", prompt: "你最喜欢谁的帅气或酷劲？" },
  { id: "safest", prompt: "如果需要依靠一个人，你最想选择谁？" },
  { id: "smartest", prompt: "你觉得谁是最聪明的角色？" },
  { id: "reliable", prompt: "如果只能选一位当队友，你最信赖谁？" },
  { id: "gentlest", prompt: "你觉得谁是最温柔的角色？" },
  { id: "mysterious", prompt: "你觉得谁最神秘、最让人想继续了解？" },
  { id: "energetic", prompt: "你觉得谁最有活力？" },
  { id: "memorable", prompt: "谁是最让你难忘的角色？" },
  { id: "travel_companion", prompt: "如果去提瓦特旅行，你最想带谁同行？" },
  { id: "daily_companion", prompt: "如果每天都能见面，你最想和谁相处？" },
  { id: "teammate", prompt: "如果只能邀请一位加入你的队伍，你会选谁？" },
  { id: "listener", prompt: "如果你想找人倾诉，你最愿意找谁？" },
  { id: "cook", prompt: "你最想尝尝谁亲手做的饭？" },
  { id: "mentor", prompt: "如果可以拜一位角色为师，你最想请教谁？" },
  { id: "festival", prompt: "你最想和谁一起过一个节日？" },
  { id: "heroic", prompt: "你觉得谁最有英雄气质？" },
  { id: "elegant", prompt: "你觉得谁最有优雅的气质？" },
  { id: "charming", prompt: "你觉得谁最有个人魅力？" },
  { id: "story", prompt: "你最想继续了解谁的故事？" },
  { id: "protective", prompt: "如果遇到危险，你最希望谁来保护你？" },
];

const GUESS_QUESTION = {
  id: "guess_character",
  prompt: "看证件照剪影，猜出这位角色是谁。",
};

const MODE_META = {
  quick: {
    label: "快速心选",
    description: "短局开始，八位角色很快就能选出结果。",
    questionNote: "这道题会贯穿本局心选。",
  },
  standard: {
    label: "标准心选",
    description: "十六位角色，适合认真比较一轮。",
    questionNote: "这道题会贯穿本局心选。",
  },
  full: {
    label: "完整心选",
    description: "全部角色都会出现，慢慢留下你的最终选择。",
    questionNote: "这道题会贯穿本局心选。",
  },
  guess: {
    label: "证件照猜角色",
    description: "十道角色剪影题，看看你能认出多少位。",
    questionNote: "这个玩法不需要选择主题题目。",
  },
};

const ICON_CACHE = new Map();
const SILHOUETTE_CACHE = new Map();

const state = {
  token: localStorage.getItem(TOKEN_KEY) || "",
  user: null,
  backend: "unknown",
  characters: [],
  mode: "quick",
  question: QUESTION_BANK[0],
  challengeCode: "",
  pendingChallenge: null,
  queue: [],
  champion: null,
  challenger: null,
  eliminated: [],
  guessItems: [],
  guessIndex: 0,
  guessCorrect: 0,
  guessFeedback: "",
  busy: false,
  started: false,
  completed: false,
};

const $ = (id) => document.getElementById(id);

const elements = {
  backendBadge: $("backendBadge"),
  userChip: $("userChip"),
  authMsg: $("authMsg"),
  usernameInput: $("usernameInput"),
  passwordInput: $("passwordInput"),
  loginBtn: $("loginBtn"),
  registerBtn: $("registerBtn"),
  logoutBtn: $("logoutBtn"),
  modeOptions: [...document.querySelectorAll("[data-mode]")],
  modeDescription: $("modeDescription"),
  questionSelect: $("questionSelect"),
  questionSelectNote: $("questionSelectNote"),
  introLine: $("introLine"),
  startBtn: $("startBtn"),
  questionBadge: $("questionBadge"),
  questionPrompt: $("questionPrompt"),
  challengeHint: $("challengeHint"),
  heroTitle: $("heroTitle"),
  championSpotlight: $("championSpotlight"),
  championSpotlightMeta: $("championSpotlightMeta"),
  championSpotlightAvatar: $("championSpotlightAvatar"),
  championSpotlightName: $("championSpotlightName"),
  championSpotlightLine: $("championSpotlightLine"),
  choiceSection: $("choiceSection"),
  guessSection: $("guessSection"),
  eliminatedSection: $("eliminatedSection"),
  statusLine: $("statusLine"),
  battleMeta: $("battleMeta"),
  leftCard: $("leftCard"),
  rightCard: $("rightCard"),
  leftAvatar: $("leftAvatar"),
  rightAvatar: $("rightAvatar"),
  leftName: $("leftName"),
  rightName: $("rightName"),
  winnerBanner: $("winnerBanner"),
  eliminatedList: $("eliminatedList"),
  guessRoundLabel: $("guessRoundLabel"),
  guessFeedback: $("guessFeedback"),
  guessAvatar: $("guessAvatar"),
  guessOptions: $("guessOptions"),
  summaryPanel: $("summaryPanel"),
  summaryUser: $("summaryUser"),
  summaryQuestion: $("summaryQuestion"),
  summaryChampionCard: $("summaryChampionCard"),
  summaryChampion: $("summaryChampion"),
  summaryChampionAvatar: $("summaryChampionAvatar"),
  summaryChampionMeta: $("summaryChampionMeta"),
  summaryGuessCard: $("summaryGuessCard"),
  summaryGuessResult: $("summaryGuessResult"),
  shareChallengeBtn: $("shareChallengeBtn"),
  shareChallengeUrl: $("shareChallengeUrl"),
  shareChallengeMsg: $("shareChallengeMsg"),
  confettiCanvas: $("confetti-canvas"),
};

const confettiFx = window.confetti
  ? window.confetti.create(elements.confettiCanvas, {
      resize: true,
      useWorker: true,
    })
  : () => {};

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shuffle(list, random = Math.random) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = hashString(seed) || 1;
  return () => {
    value = Math.imul(1664525, value) + 1013904223;
    return (value >>> 0) / 4294967296;
  };
}

function isGuessMode() {
  return state.mode === "guess";
}

function selectedQuestion() {
  if (isGuessMode()) return GUESS_QUESTION;
  return QUESTION_BANK.find((item) => item.id === elements.questionSelect.value) || QUESTION_BANK[0];
}

function setMode(mode) {
  if (!MODE_META[mode]) return;
  state.mode = mode;
  state.question = isGuessMode() ? GUESS_QUESTION : selectedQuestion();
  renderSetup();
  renderQuestion();
}

function fillQuestionOptions() {
  elements.questionSelect.innerHTML = "";
  for (const question of QUESTION_BANK) {
    const option = document.createElement("option");
    option.value = question.id;
    option.textContent = question.prompt;
    elements.questionSelect.appendChild(option);
  }
  elements.questionSelect.value = state.question.id;
}

function renderSetup() {
  const meta = MODE_META[state.mode] || MODE_META.quick;
  elements.modeDescription.textContent = meta.description;
  elements.questionSelectNote.textContent = meta.questionNote;
  elements.questionSelect.disabled = isGuessMode() || Boolean(state.pendingChallenge);
  elements.questionSelect.value = state.question?.id || QUESTION_BANK[0].id;
  elements.heroTitle.textContent = isGuessMode() ? "看证件照，猜出角色" : "你更喜欢哪一种？";

  for (const button of elements.modeOptions) {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = Boolean(state.pendingChallenge);
  }

  if (state.pendingChallenge) {
    elements.introLine.textContent = "这是朋友发来的同一局，准备好后开始挑战。";
  } else if (state.started && !state.completed) {
    elements.introLine.textContent = "重新开始会创建一局新的挑战。";
  } else {
    elements.introLine.textContent = "选择好玩法和题目后就可以开始。";
  }
}

function saveGameState() {
  if (state.completed || !state.started || !state.challengeCode) {
    localStorage.removeItem(SAVE_KEY);
    return;
  }
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      mode: state.mode,
      questionId: state.question?.id || null,
      questionPrompt: state.question?.prompt || "",
      challengeCode: state.challengeCode,
      queue: state.queue.map((item) => item.id),
      champion: state.champion?.id || null,
      challenger: state.challenger?.id || null,
      eliminated: state.eliminated.map((item) => item.id),
      guessItems: state.guessItems.map((item) => item.id),
      guessIndex: state.guessIndex,
      guessCorrect: state.guessCorrect,
    }),
  );
}

function clearGameState() {
  localStorage.removeItem(SAVE_KEY);
}

function updateUrlForChallenge(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("challenge", code);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function challengeUrl(code = state.challengeCode) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("challenge", code);
  return url.toString();
}

function clearWinnerBanner() {
  elements.winnerBanner.classList.add("hidden");
  elements.winnerBanner.innerHTML = "";
}

async function loadIcon(name) {
  if (!ICON_CACHE.has(name)) {
    ICON_CACHE.set(
      name,
      fetch(`/static/assets/icons/${name}.svg`)
        .then((response) => (response.ok ? response.text() : ""))
        .catch(() => ""),
    );
  }
  return ICON_CACHE.get(name);
}

async function hydrateIcons() {
  const nodes = [...document.querySelectorAll("[data-icon]")];
  await Promise.all(
    nodes.map(async (node) => {
      const svg = await loadIcon(node.dataset.icon);
      if (svg) node.innerHTML = svg;
    }),
  );
}

function backendLabel(value) {
  if (value === "mysql") return "MySQL 在线";
  if (value === "sqlite") return "SQLite 本地";
  if (value === "custom") return "自定义连接";
  return "连接中";
}

function renderBackend() {
  elements.backendBadge.textContent = backendLabel(state.backend);
}

function renderUser() {
  elements.userChip.textContent = state.user ? `用户：${state.user.username}` : "游客";
}

function renderPlaceholderCard(img, nameEl) {
  img.removeAttribute("src");
  img.alt = "";
  nameEl.textContent = "等待开始";
}

function fillCard(img, nameEl, character) {
  img.src = character.avatar_url;
  img.alt = character.name;
  nameEl.textContent = character.name;
}

function renderQuestion() {
  const active = Boolean(state.question) && (state.started || state.completed || state.pendingChallenge);
  elements.questionBadge.textContent = active
    ? state.pendingChallenge
      ? "好友挑战"
      : state.completed
        ? "本局已完成"
        : "本局题目"
    : "等待开始";
  elements.questionPrompt.textContent = active ? state.question.prompt : "先选择玩法和题目。";
  elements.challengeHint.textContent = state.pendingChallenge
    ? `挑战编号 ${state.pendingChallenge.code} · 角色顺序已固定，打开这条链接的人会遇到同一局。`
    : state.challengeCode
      ? "本局已生成挑战链接，完成后可以复制给朋友。"
      : "";
}

function renderSpotlight() {
  const visible = !isGuessMode() && (state.started || state.completed);
  elements.championSpotlight.classList.toggle("hidden", !visible);
  if (!visible) return;

  if (!state.champion) {
    elements.championSpotlightMeta.textContent = "等待开始";
    elements.championSpotlightAvatar.removeAttribute("src");
    elements.championSpotlightName.textContent = "尚未出现保留角色";
    elements.championSpotlightLine.textContent = "开始后，当前选择会留在这里。";
    return;
  }

  elements.championSpotlightMeta.textContent = state.completed ? "最终选择" : "当前选择";
  elements.championSpotlightAvatar.src = state.champion.avatar_url;
  elements.championSpotlightAvatar.alt = state.champion.name;
  elements.championSpotlightName.textContent = state.champion.name;
  elements.championSpotlightLine.textContent = state.completed
    ? "这是你在这道题下最后留下的角色。"
    : "下一位角色会继续和它比较。";
}

function renderBattle() {
  const selectionMode = !isGuessMode();
  const showChoices = selectionMode && state.started && !state.completed;
  const showGuess = isGuessMode() && state.started && !state.completed;
  const showProgress = selectionMode && state.started;

  elements.choiceSection.classList.toggle("hidden", !showChoices);
  elements.guessSection.classList.toggle("hidden", !showGuess);
  elements.eliminatedSection.classList.toggle("hidden", !showProgress);
  elements.summaryPanel.classList.toggle("hidden", !state.completed);
  elements.startBtn.disabled = state.busy;
  elements.leftCard.disabled = state.busy || !showChoices || !state.champion || !state.challenger;
  elements.rightCard.disabled = state.busy || !showChoices || !state.champion || !state.challenger;
  elements.startBtn.textContent = state.started && !state.completed
    ? "重新开始"
    : state.pendingChallenge
      ? "开始挑战"
      : "开始";

  if (!state.started) {
    elements.statusLine.textContent = "尚未开始";
    elements.battleMeta.textContent = "先选择玩法";
    renderPlaceholderCard(elements.leftAvatar, elements.leftName);
    renderPlaceholderCard(elements.rightAvatar, elements.rightName);
    elements.guessAvatar.removeAttribute("src");
    renderSpotlight();
    return;
  }

  if (state.completed) {
    elements.statusLine.textContent = "本局已结束";
    elements.battleMeta.textContent = "可以重新开始或分享这一局";
    renderPlaceholderCard(elements.leftAvatar, elements.leftName);
    renderPlaceholderCard(elements.rightAvatar, elements.rightName);
    elements.guessAvatar.removeAttribute("src");
    renderSpotlight();
    return;
  }

  if (isGuessMode()) {
    renderGuess();
    renderSpotlight();
    return;
  }

  const totalRemaining = state.queue.length + 2;
  elements.statusLine.textContent = `还剩 ${totalRemaining} 位角色`;
  elements.battleMeta.textContent = state.busy ? "正在整理结果" : "选择你认为更符合题目的角色";
  fillCard(elements.leftAvatar, elements.leftName, state.champion);
  fillCard(elements.rightAvatar, elements.rightName, state.challenger);
  renderSpotlight();
}

function renderEliminated() {
  if (!state.started || !state.eliminated.length) {
    elements.eliminatedList.innerHTML = `<div class="text-sm text-slate-400">暂无</div>`;
    return;
  }
  elements.eliminatedList.innerHTML = state.eliminated
    .slice(0, 12)
    .map(
      (item) => `
        <div class="eliminated-item">
          <img src="${item.avatar_url}" alt="${escapeHtml(item.name)}" class="eliminated-thumb" />
          <div class="min-w-0">
            <div class="eliminated-name truncate">${escapeHtml(item.name)}</div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderSummary() {
  if (!state.completed) {
    elements.summaryUser.textContent = "";
    elements.summaryQuestion.textContent = "";
    elements.summaryChampion.textContent = "";
    elements.summaryChampionMeta.textContent = "";
    elements.summaryChampionAvatar.removeAttribute("src");
    elements.summaryGuessResult.textContent = "";
    elements.summaryChampionCard.classList.add("hidden");
    elements.summaryGuessCard.classList.add("hidden");
    elements.shareChallengeUrl.value = "";
    elements.shareChallengeMsg.textContent = "";
    return;
  }

  elements.summaryUser.textContent = state.user ? state.user.username : "游客";
  elements.summaryQuestion.textContent = state.question?.prompt || "";
  elements.shareChallengeUrl.value = challengeUrl();
  elements.shareChallengeBtn.disabled = !state.challengeCode;

  if (isGuessMode()) {
    elements.summaryChampionCard.classList.add("hidden");
    elements.summaryGuessCard.classList.remove("hidden");
    elements.summaryGuessResult.textContent = `你认出了 ${state.guessCorrect} / ${state.guessItems.length} 位角色。`;
  } else {
    elements.summaryChampionCard.classList.remove("hidden");
    elements.summaryGuessCard.classList.add("hidden");
    elements.summaryChampion.textContent = state.champion?.name || "";
    elements.summaryChampionAvatar.src = state.champion?.avatar_url || "";
    elements.summaryChampionAvatar.alt = state.champion?.name || "";
    elements.summaryChampionMeta.textContent = "这是你在本局题目下最后留下的角色。";
  }
}

function syncCharacterStats(updated) {
  const index = state.characters.findIndex((item) => item.id === updated.id);
  if (index >= 0) {
    state.characters[index] = { ...state.characters[index], ...updated };
  }
  if (state.champion?.id === updated.id) {
    state.champion = { ...state.champion, ...updated };
  }
  if (state.challenger?.id === updated.id) {
    state.challenger = { ...state.challenger, ...updated };
  }
  state.eliminated = state.eliminated.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }
  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(formatApiError(payload));
  return payload;
}

function formatApiError(payload) {
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((item) => item?.msg || "请求参数不合法")
      .filter(Boolean)
      .join("；");
  }
  return payload?.message || "请求失败";
}

function applyChallenge(data) {
  const byId = new Map(state.characters.map((item) => [item.id, item]));
  const selected = data.character_ids.map((id) => byId.get(id)).filter(Boolean);
  if (selected.length !== data.character_ids.length) {
    throw new Error("挑战中的角色素材不完整，请重新创建挑战");
  }

  state.mode = data.mode;
  state.question = data.mode === "guess"
    ? GUESS_QUESTION
    : QUESTION_BANK.find((item) => item.id === data.question_id) || {
        id: data.question_id || "shared_question",
        prompt: data.question_prompt,
      };
  state.challengeCode = data.code;
  state.pendingChallenge = null;
  state.eliminated = [];
  state.completed = false;
  state.started = true;
  state.guessFeedback = "";
  state.guessCorrect = 0;
  state.guessIndex = 0;
  clearWinnerBanner();
  updateUrlForChallenge(data.code);

  if (isGuessMode()) {
    state.guessItems = selected;
    state.queue = [];
    state.champion = null;
    state.challenger = null;
  } else {
    state.guessItems = [];
    state.champion = selected[0] || null;
    state.challenger = selected[1] || null;
    state.queue = selected.slice(2);
  }

  saveGameState();
  renderSetup();
  renderQuestion();
  renderBattle();
  renderEliminated();
  renderSummary();
}

async function loadUser() {
  if (!state.token) {
    state.user = null;
    renderUser();
    return;
  }
  try {
    state.user = await api("/api/auth/me");
  } catch {
    state.token = "";
    localStorage.removeItem(TOKEN_KEY);
    state.user = null;
  }
  renderUser();
}

function restoreGameState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    const byId = new Map(state.characters.map((item) => [item.id, item]));
    const selectedQuestion = QUESTION_BANK.find((item) => item.id === saved.questionId);
    state.mode = MODE_META[saved.mode] ? saved.mode : "quick";
    state.question = state.mode === "guess"
      ? GUESS_QUESTION
      : selectedQuestion || { id: saved.questionId || "saved_question", prompt: saved.questionPrompt || "" };
    state.challengeCode = saved.challengeCode || "";
    state.queue = (saved.queue || []).map((id) => byId.get(id)).filter(Boolean);
    state.champion = saved.champion ? byId.get(saved.champion) || null : null;
    state.challenger = saved.challenger ? byId.get(saved.challenger) || null : null;
    state.eliminated = (saved.eliminated || []).map((id) => byId.get(id)).filter(Boolean);
    state.guessItems = (saved.guessItems || []).map((id) => byId.get(id)).filter(Boolean);
    state.guessIndex = Number(saved.guessIndex || 0);
    state.guessCorrect = Number(saved.guessCorrect || 0);
    if (isGuessMode()) {
      if (!state.guessItems.length || state.guessIndex >= state.guessItems.length) throw new Error("saved guess state is incomplete");
    } else if (!state.champion || (!state.challenger && state.queue.length > 0)) {
      throw new Error("saved state is incomplete");
    }
    state.started = true;
    state.completed = false;
    return true;
  } catch {
    clearGameState();
    return false;
  }
}

async function loadChallengeFromUrl() {
  const code = new URL(window.location.href).searchParams.get("challenge");
  if (!code) return false;
  const data = await api(`/api/challenges/${encodeURIComponent(code)}`);
  state.pendingChallenge = data;
  state.challengeCode = data.code;
  state.mode = data.mode;
  state.question = data.mode === "guess"
    ? GUESS_QUESTION
    : QUESTION_BANK.find((item) => item.id === data.question_id) || {
        id: data.question_id || "shared_question",
        prompt: data.question_prompt,
      };
  renderSetup();
  renderQuestion();
  renderBattle();
  return true;
}

async function loadBattle() {
  const data = await api("/api/battle/init");
  state.backend = data.backend;
  state.user = data.user;
  state.characters = data.characters;
  fillQuestionOptions();
  renderBackend();
  renderUser();

  const hasChallenge = await loadChallengeFromUrl().catch((error) => {
    elements.authMsg.textContent = error.message;
    return false;
  });
  if (!hasChallenge) {
    const restored = restoreGameState();
    if (!restored) {
      state.started = false;
      state.completed = false;
      state.question = selectedQuestion();
    }
  }

  renderSetup();
  renderQuestion();
  renderBattle();
  renderEliminated();
  renderSummary();
}

async function startFreshGame() {
  if (state.busy) return;
  state.busy = true;
  renderBattle();
  try {
    let data = state.pendingChallenge;
    if (!data) {
      const question = selectedQuestion();
      data = await api("/api/challenges", {
        method: "POST",
        body: {
          mode: state.mode,
          question_id: isGuessMode() ? null : question.id,
          question_prompt: question.prompt,
        },
      });
    }
    applyChallenge(data);
    elements.authMsg.textContent = "";
  } catch (error) {
    elements.authMsg.textContent = error.message;
  } finally {
    state.busy = false;
    renderBattle();
  }
}

async function choose(side) {
  if (state.busy || !state.started || state.completed || isGuessMode() || !state.champion || !state.challenger) return;
  const winner = side === "left" ? state.champion : state.challenger;
  const loser = side === "left" ? state.challenger : state.champion;
  const finalBattle = state.queue.length === 0;

  state.busy = true;
  renderBattle();
  try {
    const result = await api("/api/battle/result", {
      method: "POST",
      body: {
        winner_id: winner.id,
        loser_id: loser.id,
        tournament_complete: finalBattle,
      },
    });

    syncCharacterStats(result.winner);
    syncCharacterStats(result.loser);
    if (result.user) {
      state.user = result.user;
      renderUser();
    }

    state.eliminated.unshift(loser);
    state.champion = winner;
    state.challenger = state.queue.shift() || null;

    if (finalBattle) {
      state.completed = true;
      clearGameState();
      elements.winnerBanner.classList.remove("hidden");
      elements.winnerBanner.innerHTML = `
        <div class="text-lg font-semibold">${escapeHtml(winner.name)} 是你在这道题下最后留下的角色</div>
        <div class="mt-1 text-sm">这一局已经完成，可以把同一局分享给朋友。</div>
      `;
      confettiFx({
        particleCount: 120,
        spread: 76,
        origin: { y: 0.6 },
      });
    } else {
      saveGameState();
    }

    renderQuestion();
    renderBattle();
    renderEliminated();
    renderSummary();
  } catch (error) {
    elements.authMsg.textContent = error.message;
  } finally {
    state.busy = false;
    renderBattle();
  }
}

function guessOptions(current, index) {
  const random = seededRandom(`${state.challengeCode}:${index}`);
  const others = state.characters.filter((item) => item.id !== current.id);
  return shuffle([current, ...shuffle(others, random).slice(0, 3)], random);
}

async function loadSilhouette(character) {
  if (SILHOUETTE_CACHE.has(character.id)) return SILHOUETTE_CACHE.get(character.id);

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || 600;
        canvas.height = image.naturalHeight || 600;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const width = canvas.width;
        const height = canvas.height;
        const background = new Uint8Array(width * height);
        const pending = [];

        const isBackgroundPixel = (pixelIndex) => {
          const offset = pixelIndex * 4;
          const red = pixels.data[offset];
          const green = pixels.data[offset + 1];
          const blue = pixels.data[offset + 2];
          const alpha = pixels.data[offset + 3];
          const brightness = (red + green + blue) / 3;
          const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
          return alpha < 12 || (brightness > 245 && spread < 18);
        };

        const addBackgroundPixel = (pixelIndex) => {
          if (!background[pixelIndex] && isBackgroundPixel(pixelIndex)) {
            background[pixelIndex] = 1;
            pending.push(pixelIndex);
          }
        };

        for (let x = 0; x < width; x += 1) {
          addBackgroundPixel(x);
          addBackgroundPixel((height - 1) * width + x);
        }
        for (let y = 0; y < height; y += 1) {
          addBackgroundPixel(y * width);
          addBackgroundPixel(y * width + width - 1);
        }

        while (pending.length) {
          const pixelIndex = pending.pop();
          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);
          if (x > 0) addBackgroundPixel(pixelIndex - 1);
          if (x < width - 1) addBackgroundPixel(pixelIndex + 1);
          if (y > 0) addBackgroundPixel(pixelIndex - width);
          if (y < height - 1) addBackgroundPixel(pixelIndex + width);
        }

        for (let offset = 0; offset < pixels.data.length; offset += 4) {
          const pixelIndex = offset / 4;
          pixels.data[offset] = 8;
          pixels.data[offset + 1] = 11;
          pixels.data[offset + 2] = 20;
          pixels.data[offset + 3] = background[pixelIndex] ? 0 : 255;
        }

        context.putImageData(pixels, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("无法生成角色剪影"));
    image.src = character.avatar_url;
  });

  SILHOUETTE_CACHE.set(character.id, promise);
  return promise;
}

function renderGuess() {
  const current = state.guessItems[state.guessIndex];
  if (!current) return;

  elements.guessRoundLabel.textContent = `第 ${state.guessIndex + 1} / ${state.guessItems.length} 题`;
  elements.guessFeedback.textContent = state.guessFeedback;
  elements.guessOptions.innerHTML = state.busy
    ? ""
    : guessOptions(current, state.guessIndex)
        .map(
          (item) => `
            <button class="guess-option" type="button" data-guess-id="${item.id}">
              ${escapeHtml(item.name)}
            </button>
          `,
        )
        .join("");

  elements.guessOptions.querySelectorAll("[data-guess-id]").forEach((button) => {
    button.addEventListener("click", () => chooseGuess(Number(button.dataset.guessId)));
  });

  const currentId = current.id;
  loadSilhouette(current)
    .then((url) => {
      if (state.started && !state.completed && state.guessItems[state.guessIndex]?.id === currentId) {
        elements.guessAvatar.src = url;
      }
    })
    .catch(() => {
      elements.guessFeedback.textContent = "剪影生成失败，请重新开始";
    });
}

function chooseGuess(characterId) {
  if (state.busy || !state.started || state.completed || !isGuessMode()) return;
  const current = state.guessItems[state.guessIndex];
  if (!current) return;

  state.busy = true;
  const correct = characterId === current.id;
  if (correct) state.guessCorrect += 1;
  state.guessFeedback = correct ? "猜对了" : `答案是 ${current.name}`;
  renderBattle();

  window.setTimeout(() => {
    state.guessIndex += 1;
    state.guessFeedback = "";
    state.busy = false;
    if (state.guessIndex >= state.guessItems.length) {
      state.completed = true;
      clearGameState();
      confettiFx({
        particleCount: 100,
        spread: 72,
        origin: { y: 0.6 },
      });
    } else {
      saveGameState();
    }
    renderBattle();
    renderSummary();
  }, 650);
}

async function authenticate(mode) {
  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value;
  if (!username || !password) {
    elements.authMsg.textContent = "请输入用户名和密码";
    return;
  }
  try {
    const result = await api(`/api/auth/${mode}`, {
      method: "POST",
      body: { username, password },
    });
    state.token = result.token;
    state.user = result.user;
    localStorage.setItem(TOKEN_KEY, state.token);
    elements.authMsg.textContent = mode === "register" ? "注册成功" : "登录成功";
    renderUser();
  } catch (error) {
    elements.authMsg.textContent = error.message;
  }
}

async function shareChallenge() {
  if (!state.challengeCode) return;
  const url = challengeUrl();
  elements.shareChallengeUrl.value = url;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      elements.shareChallengeMsg.textContent = "已复制，可以发给朋友了";
      return;
    }
  } catch {
    // HTTP 地址或浏览器权限可能不允许自动写入剪贴板。
  }
  elements.shareChallengeUrl.focus();
  elements.shareChallengeUrl.select();
  elements.shareChallengeMsg.textContent = "请长按或复制输入框里的链接";
}

function resetGameState() {
  state.pendingChallenge = null;
  state.challengeCode = "";
  state.queue = [];
  state.champion = null;
  state.challenger = null;
  state.eliminated = [];
  state.guessItems = [];
  state.guessIndex = 0;
  state.guessCorrect = 0;
  state.guessFeedback = "";
  state.started = false;
  state.completed = false;
  clearGameState();
  clearWinnerBanner();
  renderSetup();
  renderQuestion();
  renderBattle();
  renderEliminated();
  renderSummary();
}

function wireEvents() {
  elements.loginBtn.addEventListener("click", () => authenticate("login"));
  elements.registerBtn.addEventListener("click", () => authenticate("register"));
  elements.logoutBtn.addEventListener("click", () => {
    state.token = "";
    state.user = null;
    localStorage.removeItem(TOKEN_KEY);
    resetGameState();
    elements.authMsg.textContent = "已退出，仍然可以游客开始";
    renderUser();
  });
  elements.modeOptions.forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.pendingChallenge) setMode(button.dataset.mode);
    });
  });
  elements.questionSelect.addEventListener("change", () => {
    if (isGuessMode()) return;
    state.question = selectedQuestion();
    renderQuestion();
  });
  elements.startBtn.addEventListener("click", () => startFreshGame());
  elements.leftCard.addEventListener("click", () => choose("left"));
  elements.rightCard.addEventListener("click", () => choose("right"));
  elements.shareChallengeBtn.addEventListener("click", () => shareChallenge());
}

function bootstrap() {
  wireEvents();
  fillQuestionOptions();
  renderSetup();
  renderBackend();
  renderUser();
  renderQuestion();
  renderBattle();
  renderEliminated();
  renderSummary();
  hydrateIcons().catch(() => {});
  loadUser()
    .then(loadBattle)
    .catch((error) => {
      elements.statusLine.textContent = `启动失败: ${error.message}`;
    });
}

bootstrap();
