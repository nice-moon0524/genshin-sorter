const TOKEN_KEY = "genshin_sorter_token";
const SAVE_KEY = "genshin_sorter_state";

const QUESTION_BANK = [
  { id: "funniest", prompt: "你认为原神中最搞笑的人是谁？" },
  { id: "cutest", prompt: "你觉得原神里最可爱的角色是谁？" },
  { id: "coolest", prompt: "你觉得原神里最帅气的角色是谁？" },
  { id: "warmest", prompt: "你觉得原神里最有安全感的角色是谁？" },
  { id: "most_smart", prompt: "你觉得原神里最聪明的角色是谁？" },
  { id: "most_likable", prompt: "你觉得原神里最让人想亲近的角色是谁？" },
  { id: "most_mysterious", prompt: "你觉得原神里最神秘的角色是谁？" },
  { id: "most_reliable", prompt: "你觉得原神里最靠谱的角色是谁？" },
  { id: "most_energetic", prompt: "你觉得原神里最有活力的角色是谁？" },
  { id: "most_memorable", prompt: "你觉得原神里最让人印象深刻的角色是谁？" },
  { id: "most_classical", prompt: "你觉得原神里最有经典气质的角色是谁？" },
  { id: "most_gentle", prompt: "你觉得原神里最温柔的角色是谁？" },
];

const ICON_CACHE = new Map();

const state = {
  token: localStorage.getItem(TOKEN_KEY) || "",
  user: null,
  backend: "unknown",
  characters: [],
  question: null,
  queue: [],
  champion: null,
  challenger: null,
  eliminated: [],
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
  startBtn: $("startBtn"),
  questionBadge: $("questionBadge"),
  questionPrompt: $("questionPrompt"),
  championSpotlight: $("championSpotlight"),
  championSpotlightMeta: $("championSpotlightMeta"),
  championSpotlightAvatar: $("championSpotlightAvatar"),
  championSpotlightName: $("championSpotlightName"),
  championSpotlightLine: $("championSpotlightLine"),
  choiceSection: $("choiceSection"),
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
  summaryPanel: $("summaryPanel"),
  summaryUser: $("summaryUser"),
  summaryQuestion: $("summaryQuestion"),
  summaryChampion: $("summaryChampion"),
  summaryChampionAvatar: $("summaryChampionAvatar"),
  summaryChampionMeta: $("summaryChampionMeta"),
  championshipBody: $("championshipBody"),
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

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function saveGameState() {
  if (state.completed || !state.started) {
    localStorage.removeItem(SAVE_KEY);
    return;
  }
  const payload = {
    question: state.question ? state.question.id : null,
    queue: state.queue.map((item) => item.id),
    champion: state.champion ? state.champion.id : null,
    challenger: state.challenger ? state.challenger.id : null,
    eliminated: state.eliminated.map((item) => item.id),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

function clearGameState() {
  localStorage.removeItem(SAVE_KEY);
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
        .then((response) => {
          if (!response.ok) {
            throw new Error(`无法加载图标: ${name}`);
          }
          return response.text();
        })
        .catch(() => ""),
    );
  }
  return ICON_CACHE.get(name);
}

async function hydrateIcons() {
  const nodes = [...document.querySelectorAll("[data-icon]")];
  await Promise.all(
    nodes.map(async (node) => {
      const name = node.dataset.icon;
      if (!name) return;
      const svg = await loadIcon(name);
      if (svg) {
        node.innerHTML = svg;
      }
    }),
  );
}

function pickQuestion() {
  return QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)] || null;
}

function questionText() {
  return state.question ? state.question.prompt : "点击开始后会随机抽取一道题。";
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
  if (!state.user) {
    elements.userChip.textContent = "未登录";
    return;
  }
  elements.userChip.textContent = `用户：${state.user.username}`;
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

function renderSpotlight() {
  const visible = state.started || state.completed;
  elements.championSpotlight.classList.toggle("hidden", !visible);
  if (!visible) {
    elements.championSpotlightMeta.textContent = "等待开始";
    elements.championSpotlightAvatar.removeAttribute("src");
    elements.championSpotlightName.textContent = "";
    elements.championSpotlightLine.textContent = "";
    return;
  }

  if (!state.champion) {
    elements.championSpotlightMeta.textContent = state.completed ? "本局结束" : "等待开始";
    elements.championSpotlightAvatar.removeAttribute("src");
    elements.championSpotlightAvatar.alt = "";
    elements.championSpotlightName.textContent = "尚未出现领先角色";
    elements.championSpotlightLine.textContent = "本局题目会先出现，再从角色池里开始随机对决。";
    return;
  }

  elements.championSpotlightMeta.textContent = state.completed ? "本局胜者" : "当前领先";
  elements.championSpotlightAvatar.src = state.champion.avatar_url;
  elements.championSpotlightAvatar.alt = state.champion.name;
  elements.championSpotlightName.textContent = state.champion.name;
  elements.championSpotlightLine.textContent = state.completed
    ? `最终胜者，积分 ${state.champion.score}，冠军次数 ${state.champion.championships}`
    : "当前入选角色会保留在这里，下一位角色会继续参与比较。";
}

function renderQuestion() {
  const active = Boolean(state.question);
  elements.questionBadge.textContent = active
    ? state.started && !state.completed
      ? "本局题目"
      : state.completed
        ? "本局题目已完成"
        : "等待开始"
    : "等待开始";
  elements.questionPrompt.textContent = active ? state.question.prompt : "点击开始后会随机抽取一道题。";
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
  if (!response.ok) {
    throw new Error(formatApiError(payload));
  }
  return payload;
}

function formatApiError(payload) {
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length) {
    const messages = detail
      .map((item) => {
        const rawPath = Array.isArray(item?.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
        const path = rawPath === "username" ? "用户名" : rawPath === "password" ? "密码" : rawPath;
        const message = item?.msg || "请求参数不合法";
        return path ? `${path}：${message}` : message;
      })
      .filter(Boolean);
    if (messages.length) {
      return messages.join("；");
    }
  }
  if (detail && typeof detail === "object") {
    if (typeof detail.message === "string" && detail.message.trim()) {
      return detail.message;
    }
    return "请求失败";
  }
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  return "请求失败";
}

function renderBattle() {
  const showChoices = state.started && !state.completed;
  const showProgress = state.started;

  elements.choiceSection.classList.toggle("hidden", !showChoices);
  elements.eliminatedSection.classList.toggle("hidden", !showProgress);
  elements.summaryPanel.classList.toggle("hidden", !state.completed);

  elements.leftCard.disabled = state.busy || !showChoices || !state.champion || !state.challenger;
  elements.rightCard.disabled = state.busy || !showChoices || !state.champion || !state.challenger;
  elements.startBtn.textContent = state.started && !state.completed ? "重新开始" : "开始";

  if (!state.started) {
    elements.statusLine.textContent = "尚未开始";
    elements.battleMeta.textContent = "先点开始";
    renderPlaceholderCard(elements.leftAvatar, elements.leftName);
    renderPlaceholderCard(elements.rightAvatar, elements.rightName);
    renderSpotlight();
    return;
  }

  if (state.completed) {
    elements.statusLine.textContent = "本局已结束";
    elements.battleMeta.textContent = "请查看结算";
    renderPlaceholderCard(elements.leftAvatar, elements.leftName);
    renderPlaceholderCard(elements.rightAvatar, elements.rightName);
    renderSpotlight();
    return;
  }

  const totalRemaining = state.queue.length + 2;
  elements.statusLine.textContent = `剩余 ${totalRemaining} 位角色`;
  elements.battleMeta.textContent = state.busy ? "正在整理结果" : "选择你认为更符合题目的";
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
    elements.championshipBody.innerHTML = "";
    return;
  }

  elements.summaryUser.textContent = state.user ? state.user.username : "未登录用户";
  elements.summaryQuestion.textContent = state.question ? state.question.prompt : "";
  elements.summaryChampion.textContent = state.champion ? state.champion.name : "";
  elements.summaryChampionAvatar.src = state.champion?.avatar_url || "";
  elements.summaryChampionAvatar.alt = state.champion?.name || "";
  elements.summaryChampionMeta.textContent = state.champion
    ? `积分 ${state.champion.score} · 场次 ${state.champion.matches} · 冠军 ${state.champion.championships}`
    : "";

  const rows = [...state.characters]
    .sort((a, b) => b.championships - a.championships || b.wins - a.wins || b.matches - a.matches || a.name.localeCompare(b.name, "zh-Hans-CN"))
    .map(
      (item) => `
        <tr>
          <td class="px-3 py-2">
            <div class="flex items-center gap-2">
              <img src="${item.avatar_url}" alt="${escapeHtml(item.name)}" class="h-8 w-8 rounded border border-white/10 object-cover" />
              <div class="font-medium text-slate-100">${escapeHtml(item.name)}</div>
            </div>
          </td>
          <td class="px-3 py-2 text-right">${item.championships}</td>
        </tr>
      `,
    )
    .join("");
  elements.championshipBody.innerHTML = rows;
}

function syncCharacterStats(updated) {
  const index = state.characters.findIndex((item) => item.id === updated.id);
  if (index >= 0) {
    state.characters[index] = { ...state.characters[index], ...updated };
  }
  if (state.champion && state.champion.id === updated.id) {
    state.champion = { ...state.champion, ...updated };
  }
  if (state.challenger && state.challenger.id === updated.id) {
    state.challenger = { ...state.challenger, ...updated };
  }
  state.eliminated = state.eliminated.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
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

function startFreshGame() {
  if (!state.user) {
    elements.authMsg.textContent = "请先登录或注册，再开始选择";
    return;
  }
  const shuffled = shuffle(state.characters);
  if (shuffled.length < 2) {
    elements.authMsg.textContent = "角色数量不足，无法开始";
    state.question = null;
    renderQuestion();
    return;
  }
  state.question = pickQuestion();
  state.queue = shuffled.slice(2);
  state.champion = shuffled[0] || null;
  state.challenger = shuffled[1] || null;
  state.eliminated = [];
  state.completed = false;
  state.started = true;
  clearGameState();
  clearWinnerBanner();
  renderQuestion();
  renderBattle();
  renderEliminated();
  renderSummary();
  elements.authMsg.textContent = "";
}

function ensureGameOrIdle() {
  const restored = restoreGameState();
  if (!restored) {
    state.started = false;
    state.completed = false;
    state.question = null;
  }
}

function restoreGameState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    const byId = new Map(state.characters.map((item) => [item.id, item]));
    state.question = saved.question ? QUESTION_BANK.find((item) => item.id === saved.question) || pickQuestion() : null;
    state.queue = (saved.queue || []).map((id) => byId.get(id)).filter(Boolean);
    state.champion = saved.champion ? byId.get(saved.champion) || null : null;
    state.challenger = saved.challenger ? byId.get(saved.challenger) || null : null;
    state.eliminated = (saved.eliminated || []).map((id) => byId.get(id)).filter(Boolean);
    if (!state.champion || (!state.challenger && state.queue.length > 0)) {
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

async function loadBattle() {
  const data = await api("/api/battle/init");
  state.backend = data.backend;
  state.user = data.user;
  state.characters = data.characters;
  renderBackend();
  renderUser();
  ensureGameOrIdle();
  renderQuestion();
  renderBattle();
  renderEliminated();
  renderSummary();
}

async function choose(side) {
  if (state.busy || !state.started || state.completed || !state.champion || !state.challenger) return;
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
      renderSummary();
      renderSpotlight();
      elements.winnerBanner.classList.remove("hidden");
      elements.winnerBanner.innerHTML = `
        <div class="text-lg font-semibold">${escapeHtml(winner.name)} 是这局最符合题目的角色</div>
        <div class="mt-1 text-sm">用户 ${escapeHtml(state.user ? state.user.username : "未登录用户")} 的结算已经完成。</div>
      `;
      setTimeout(() => {
        confettiFx({
          particleCount: 180,
          spread: 80,
          origin: { y: 0.6 },
        });
      }, 40);
    } else {
      saveGameState();
    }

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

function wireEvents() {
  elements.loginBtn.addEventListener("click", () => authenticate("login"));
  elements.registerBtn.addEventListener("click", () => authenticate("register"));
  elements.logoutBtn.addEventListener("click", () => {
    state.token = "";
    state.user = null;
    state.queue = [];
    state.champion = null;
    state.challenger = null;
    state.eliminated = [];
    state.started = false;
    state.completed = false;
    state.question = null;
    localStorage.removeItem(TOKEN_KEY);
    clearGameState();
    clearWinnerBanner();
    elements.authMsg.textContent = "已退出";
    renderBackend();
    renderUser();
    renderQuestion();
    renderBattle();
    renderEliminated();
    renderSummary();
  });
  elements.startBtn.addEventListener("click", () => startFreshGame());
  elements.leftCard.addEventListener("click", () => choose("left"));
  elements.rightCard.addEventListener("click", () => choose("right"));
}

function bootstrap() {
  wireEvents();
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
