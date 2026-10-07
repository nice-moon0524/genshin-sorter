const TOKEN_KEY = "genshin_sorter_token";
const SAVE_KEY = "genshin_sorter_state";
const MUSIC_TRACK_KEY = "genshin_sorter_music_track";
const MUSIC_VOLUME_KEY = "genshin_sorter_music_volume";

const MUSIC_TRACKS = [
  { name: "皎洁的笑颜", mood: "Moonlike Smile · HOYO-MiX", src: "/static/music/track-01.ogg" },
  { name: "让风告诉你", mood: "演唱曲 · Genshin Impact", src: "/static/music/track-02.ogg" },
  { name: "我不曾忘记", mood: "演唱曲 · Genshin Impact", src: "/static/music/track-03.ogg" },
  { name: "风的来信", mood: "A Letter From the Wind · HOYO-MiX", src: "/static/music/track-04.ogg" },
  { name: "献向镜水的月光", mood: "Song to the Mirrored Moon · HOYO-MiX", src: "/static/music/track-05.ogg" },
  { name: "奥黛塔，快陪我去堆个雪人吧", mood: "Dear Odette, Come and Build a Snowman With Me", src: "/static/music/track-06.ogg" },
  { name: "白夜洇润", mood: "Unfurling Night · HOYO-MiX", src: "/static/music/track-07.ogg" },
  { name: "轻涟", mood: "La vaguelette · HOYO-MiX", src: "/static/music/track-08.ogg" },
  { name: "神女劈观·唤情", mood: "Devastation and Redemption · HOYO-MiX", src: "/static/music/track-09.ogg" },
  { name: "几初的智愿", mood: "For Riddles, for Wonders · HOYO-MiX", src: "/static/music/track-10.ogg" },
  { name: "和合大梦的曲调", mood: "Melody of Brave Seeds · HOYO-MiX", src: "/static/music/track-11.ogg" },
];

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

function customQuestionId(id) {
  return `custom_${id}`;
}

const GUESS_QUESTION = {
  id: "guess_character",
  prompt: "看证件照剪影，猜出这位角色是谁。",
};

const HARD_GUESS_QUESTION = {
  id: "guess_character_hard",
  prompt: "辨认被遮挡 30% 的证件照剪影，猜出这位角色是谁。",
};

const GUESS_MODES = new Set(["guess", "guess_hard"]);
const GUESS_EXCLUDED_NAMES = new Set(["埃洛伊"]);

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
  guess_hard: {
    label: "困难剪影挑战",
    description: "剪影会随机遮挡 30%，辨认角色会更有挑战。",
    questionNote: "困难版会为同一挑战固定遮挡位置。",
  },
};

const ICON_CACHE = new Map();
const SILHOUETTE_CACHE = new Map();

const savedMusicTrack = Number.parseInt(localStorage.getItem(MUSIC_TRACK_KEY) || "0", 10);
const savedMusicVolume = Number.parseInt(localStorage.getItem(MUSIC_VOLUME_KEY) || "58", 10);

const musicState = {
  audio: null,
  trackIndex: Number.isInteger(savedMusicTrack) && savedMusicTrack >= 0 && savedMusicTrack < MUSIC_TRACKS.length
    ? savedMusicTrack
    : 0,
  volume: Number.isInteger(savedMusicVolume) ? Math.min(100, Math.max(0, savedMusicVolume)) : 42,
  playing: false,
  panelOpen: false,
};

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
  notes: {},
  gameCharacters: [],
  questionSubmitting: false,
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
  musicDiscBtn: $("musicDiscBtn"),
  musicPlayBtn: $("musicPlayBtn"),
  musicPlayIcon: $("musicPlayIcon"),
  musicPanel: $("musicPanel"),
  musicCloseBtn: $("musicCloseBtn"),
  musicPanelDisc: $("musicPanelDisc"),
  musicTrackName: $("musicTrackName"),
  musicTrackMood: $("musicTrackMood"),
  musicEqualizer: $("musicEqualizer"),
  musicPrevBtn: $("musicPrevBtn"),
  musicPanelPlayBtn: $("musicPanelPlayBtn"),
  musicPanelPlayIcon: $("musicPanelPlayIcon"),
  musicNextBtn: $("musicNextBtn"),
  musicVolume: $("musicVolume"),
  musicProgress: $("musicProgress"),
  musicCurrentTime: $("musicCurrentTime"),
  musicDuration: $("musicDuration"),
  musicPlaylist: $("musicPlaylist"),
  modeOptions: [...document.querySelectorAll("[data-mode]")],
  modeDescription: $("modeDescription"),
  questionSelect: $("questionSelect"),
  questionSelectNote: $("questionSelectNote"),
  customQuestionPanel: $("customQuestionPanel"),
  customQuestionInput: $("customQuestionInput"),
  addQuestionBtn: $("addQuestionBtn"),
  customQuestionMsg: $("customQuestionMsg"),
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
  leftNote: $("leftNote"),
  rightNote: $("rightNote"),
  winnerBanner: $("winnerBanner"),
  eliminatedList: $("eliminatedList"),
  guessRoundLabel: $("guessRoundLabel"),
  guessTitle: $("guessTitle"),
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
  exportRecordPanel: $("exportRecordPanel"),
  exportImageBtn: $("exportImageBtn"),
  exportCsvBtn: $("exportCsvBtn"),
  exportRecordMsg: $("exportRecordMsg"),
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

function isGuessMode(mode = state.mode) {
  return GUESS_MODES.has(mode);
}

function isHardGuessMode(mode = state.mode) {
  return mode === "guess_hard";
}

function questionForMode(mode) {
  if (mode === "guess_hard") return HARD_GUESS_QUESTION;
  if (mode === "guess") return GUESS_QUESTION;
  return null;
}

function selectedQuestion() {
  if (isGuessMode()) return questionForMode(state.mode);
  return QUESTION_BANK.find((item) => item.id === elements.questionSelect.value) || QUESTION_BANK[0];
}

function setMode(mode) {
  if (!MODE_META[mode]) return;
  state.mode = mode;
  state.question = isGuessMode() ? questionForMode(mode) : selectedQuestion();
  renderSetup();
  renderQuestion();
}

function fillQuestionOptions() {
  elements.questionSelect.innerHTML = "";
  for (const question of QUESTION_BANK) {
    const option = document.createElement("option");
    option.value = question.id;
    option.textContent = question.custom ? `[自定义] ${question.prompt}` : question.prompt;
    elements.questionSelect.appendChild(option);
  }
  elements.questionSelect.value = state.question.id;
}

function renderSetup() {
  const meta = MODE_META[state.mode] || MODE_META.quick;
  elements.modeDescription.textContent = meta.description;
  elements.questionSelectNote.textContent = meta.questionNote;
  elements.questionSelect.disabled = isGuessMode() || Boolean(state.pendingChallenge);
  elements.customQuestionPanel.classList.toggle("hidden", isGuessMode() || Boolean(state.pendingChallenge));
  elements.customQuestionInput.disabled = state.questionSubmitting || state.busy || Boolean(state.pendingChallenge);
  elements.addQuestionBtn.disabled = state.questionSubmitting || state.busy || Boolean(state.pendingChallenge);
  elements.questionSelect.value = state.question?.id || QUESTION_BANK[0].id;
  elements.heroTitle.textContent = isHardGuessMode()
    ? "残缺的剪影，你还能认出吗？"
    : isGuessMode()
      ? "看证件照，猜出角色"
      : "你更喜欢哪一种？";

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
      notes: state.notes,
      gameCharacters: state.gameCharacters.map((item) => item.id),
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

async function setIcon(node, name) {
  const svg = await loadIcon(name);
  if (svg) node.innerHTML = svg;
}

function ensureAudioTrack() {
  const track = MUSIC_TRACKS[musicState.trackIndex];
  if (!musicState.audio) {
    musicState.audio = new Audio();
    musicState.audio.preload = "metadata";
    musicState.audio.addEventListener("ended", () => {
      selectMusicTrack(musicState.trackIndex + 1, true);
    });
    musicState.audio.addEventListener("timeupdate", updateMusicProgress);
    musicState.audio.addEventListener("loadedmetadata", updateMusicProgress);
    musicState.audio.addEventListener("error", () => {
      musicState.playing = false;
      renderMusicPlayer();
    });
  }
  if (musicState.audio.src !== new URL(track.src, window.location.href).href) {
    musicState.audio.src = track.src;
    musicState.audio.load();
  }
  musicState.audio.volume = musicState.volume / 100;
}

function formatMusicTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function updateMusicProgress() {
  const audio = musicState.audio;
  const duration = Number.isFinite(audio?.duration) ? audio.duration : 0;
  const currentTime = Number.isFinite(audio?.currentTime) ? audio.currentTime : 0;
  elements.musicProgress.max = String(duration);
  elements.musicProgress.value = String(Math.min(currentTime, duration || 0));
  elements.musicCurrentTime.textContent = formatMusicTime(currentTime);
  elements.musicDuration.textContent = formatMusicTime(duration);
}

function renderMusicPlayer() {
  const track = MUSIC_TRACKS[musicState.trackIndex];
  ensureAudioTrack();
  elements.musicTrackName.textContent = track.name;
  elements.musicTrackMood.textContent = track.mood;
  elements.musicVolume.value = String(musicState.volume);
  updateMusicProgress();
  elements.musicPanel.classList.toggle("hidden", !musicState.panelOpen);
  elements.musicPanel.setAttribute("aria-hidden", String(!musicState.panelOpen));
  elements.musicDiscBtn.setAttribute("aria-expanded", String(musicState.panelOpen));
  elements.musicDiscBtn.classList.toggle("is-playing", musicState.playing);
  elements.musicPanelDisc.classList.toggle("is-playing", musicState.playing);
  elements.musicEqualizer.classList.toggle("is-playing", musicState.playing);

  const iconName = musicState.playing ? "pause" : "play";
  const label = musicState.playing ? "暂停音乐" : "播放音乐";
  elements.musicPlayBtn.setAttribute("aria-label", label);
  elements.musicPlayBtn.title = label;
  elements.musicPanelPlayBtn.setAttribute("aria-label", label);
  elements.musicPanelPlayBtn.title = label;
  setIcon(elements.musicPlayIcon, iconName).catch(() => {});
  setIcon(elements.musicPanelPlayIcon, iconName).catch(() => {});

  elements.musicPlaylist.innerHTML = MUSIC_TRACKS.map(
    (item, index) => `
      <button class="music-track-button ${index === musicState.trackIndex ? "is-active" : ""}" type="button" data-music-track="${index}">
        <span class="music-track-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="music-track-button-copy">
          <span class="music-track-button-name">${escapeHtml(item.name)}</span>
          <span class="music-track-button-mood">${escapeHtml(item.mood)}</span>
        </span>
      </button>
    `,
  ).join("");
  elements.musicPlaylist.querySelectorAll("[data-music-track]").forEach((button) => {
    button.addEventListener("click", () => selectMusicTrack(Number(button.dataset.musicTrack)));
  });
}

async function playMusic() {
  ensureAudioTrack();
  if (!musicState.audio) return;
  await musicState.audio.play();
  musicState.playing = true;
  renderMusicPlayer();
}

function pauseMusic() {
  musicState.playing = false;
  musicState.audio?.pause();
  renderMusicPlayer();
}

function toggleMusic() {
  if (musicState.playing) pauseMusic();
  else playMusic().catch(() => {});
}

function selectMusicTrack(index, autoplay = false) {
  const wasPlaying = musicState.playing;
  musicState.trackIndex = (index + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
  localStorage.setItem(MUSIC_TRACK_KEY, String(musicState.trackIndex));
  ensureAudioTrack();
  musicState.audio.currentTime = 0;
  if (wasPlaying || autoplay) playMusic().catch(() => {});
  else renderMusicPlayer();
}

function setMusicPanel(open) {
  musicState.panelOpen = open;
  renderMusicPlayer();
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
  elements.customQuestionInput.placeholder = state.user ? "输入新的心选题目" : "登录后可添加自定义题目";
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
    elements.championSpotlightName.textContent = "尚未有保留角色";
    elements.championSpotlightLine.textContent = "开始后，当前保留的角色会显示在这里。";
    return;
  }

  elements.championSpotlightMeta.textContent = state.completed ? "最终选择" : "当前选择";
  elements.championSpotlightAvatar.src = state.champion.avatar_url;
  elements.championSpotlightAvatar.alt = state.champion.name;
  elements.championSpotlightName.textContent = state.champion.name;
  elements.championSpotlightLine.textContent = state.completed
    ? "这是你在这道题下最后保留的角色。"
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
  const cardsDisabled = state.busy || !showChoices || !state.champion || !state.challenger;
  elements.leftCard.classList.toggle("is-disabled", cardsDisabled);
  elements.rightCard.classList.toggle("is-disabled", cardsDisabled);
  elements.leftCard.setAttribute("aria-disabled", String(cardsDisabled));
  elements.rightCard.setAttribute("aria-disabled", String(cardsDisabled));
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
    renderChoiceNote(elements.leftNote, null);
    renderChoiceNote(elements.rightNote, null);
    elements.guessAvatar.removeAttribute("src");
    renderSpotlight();
    return;
  }

  if (state.completed) {
    elements.statusLine.textContent = "本局已结束";
    elements.battleMeta.textContent = "可以重新开始或分享这一局";
    renderPlaceholderCard(elements.leftAvatar, elements.leftName);
    renderPlaceholderCard(elements.rightAvatar, elements.rightName);
    renderChoiceNote(elements.leftNote, null);
    renderChoiceNote(elements.rightNote, null);
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
  renderChoiceNote(elements.leftNote, state.champion);
  renderChoiceNote(elements.rightNote, state.challenger);
  renderSpotlight();
}

function renderChoiceNote(noteElement, character) {
  noteElement.value = character ? state.notes[character.id] || "" : "";
  noteElement.disabled = !character || state.busy;
  noteElement.dataset.characterId = character ? String(character.id) : "";
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
    elements.exportRecordPanel.classList.add("hidden");
    elements.exportRecordMsg.textContent = "";
    return;
  }

  elements.summaryUser.textContent = state.user ? state.user.username : "游客";
  elements.summaryQuestion.textContent = state.question?.prompt || "";
  elements.shareChallengeUrl.value = challengeUrl();
  elements.shareChallengeBtn.disabled = !state.challengeCode;
  elements.exportRecordPanel.classList.toggle("hidden", isGuessMode());

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

function recordCharacters() {
  if (state.gameCharacters.length) return state.gameCharacters;
  return [...state.eliminated, state.champion].filter(Boolean);
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilenamePart(value, fallback) {
  const cleaned = String(value || fallback)
    .replace(/[\\/:*?"<>|\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

function exportFilename(extension, page = "") {
  const username = safeFilenamePart(state.user?.username || "游客", "游客");
  const questionIndex = QUESTION_BANK.findIndex((item) => item.id === state.question?.id);
  const questionNumber = questionIndex >= 0
    ? String(questionIndex + 1).padStart(2, "0")
    : safeFilenamePart(state.question?.id || "自定义", "自定义").replace(/^custom_/, "自定义");
  return `提瓦特心选_${username}_题目${questionNumber}${page ? `_${page}` : ""}.${extension}`;
}

function exportCsv() {
  const rows = recordCharacters().map((character, index) => [
    index + 1,
    character.name,
    state.notes[character.id] || "",
  ]);
  const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = [
    ["提瓦特心选记录", "", ""],
    ["题目", state.question?.prompt || "", ""],
    [],
    ["序号", "角色", "评价"],
    ...rows,
  ].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  downloadFile(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), exportFilename("csv"));
  elements.exportRecordMsg.textContent = "表格已开始下载";
}

function loadExportImage(character) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载 ${character.name} 的图片`));
    image.src = character.avatar_url;
  });
}

function wrapCanvasText(context, text, maxWidth) {
  const characters = [...String(text || "")];
  const lines = [];
  let line = "";
  for (const character of characters) {
    const next = line + character;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = character;
    } else {
      line = next;
    }
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}

async function exportImage() {
  const characters = recordCharacters();
  if (!characters.length) return;
  elements.exportImageBtn.disabled = true;
  elements.exportRecordMsg.textContent = "正在生成图片...";
  try {
    const width = 1200;
    const rowHeight = 166;
    const headerHeight = 208;
    const scale = 2;
    const maxRowsPerPage = 20;
    const images = await Promise.all(characters.map((character) => loadExportImage(character)));
    const pageCount = Math.ceil(characters.length / maxRowsPerPage);

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const start = pageIndex * maxRowsPerPage;
      const pageCharacters = characters.slice(start, start + maxRowsPerPage);
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = (headerHeight + pageCharacters.length * rowHeight + 42) * scale;
      const context = canvas.getContext("2d");
      context.scale(scale, scale);
      context.fillStyle = "#f5faf9";
      context.fillRect(0, 0, width, canvas.height / scale);
      context.fillStyle = "#24343d";
      context.fillRect(0, 0, width, 14);
      context.fillStyle = "#24343d";
      context.font = "700 42px system-ui, sans-serif";
      context.fillText("提瓦特心选记录", 66, 76);
      context.fillStyle = "#637983";
      context.font = "22px system-ui, sans-serif";
      const questionLines = wrapCanvasText(context, state.question?.prompt || "本局记录", 1000);
      questionLines.slice(0, 2).forEach((line, index) => context.fillText(line, 68, 124 + index * 30));
      context.fillStyle = "#d6544d";
      context.font = "600 17px system-ui, sans-serif";
      context.fillText(
        `共 ${characters.length} 位角色 · 第 ${pageIndex + 1} / ${pageCount} 页 · ${new Date().toLocaleDateString("zh-CN")}`,
        68,
        188,
      );

      pageCharacters.forEach((character, pageRowIndex) => {
        const index = start + pageRowIndex;
        const y = headerHeight + pageRowIndex * rowHeight;
        context.fillStyle = index % 2 ? "#ffffff" : "#ecf8f5";
        context.fillRect(42, y, width - 84, rowHeight - 14);
        context.strokeStyle = "#cfe0e2";
        context.strokeRect(42, y, width - 84, rowHeight - 14);
        const image = images[index];
        const imageSize = 144;
        const imageX = 58;
        const imageY = y + 3;
        context.fillStyle = "#ffffff";
        context.fillRect(imageX, imageY, imageSize, imageSize);
        const imageScale = Math.min(imageSize / image.naturalWidth, imageSize / image.naturalHeight);
        const drawWidth = image.naturalWidth * imageScale;
        const drawHeight = image.naturalHeight * imageScale;
        context.drawImage(image, imageX + (imageSize - drawWidth) / 2, imageY + (imageSize - drawHeight) / 2, drawWidth, drawHeight);
        context.fillStyle = "#24343d";
        context.font = "700 26px system-ui, sans-serif";
        context.fillText(`${index + 1}. ${character.name}`, 230, y + 48);
        context.fillStyle = "#637983";
        context.font = "21px system-ui, sans-serif";
        const note = state.notes[character.id] || "未记录评价";
        wrapCanvasText(context, note, 850).slice(0, 3).forEach((line, lineIndex) => {
          context.fillText(line, 230, y + 84 + lineIndex * 28);
        });
      });

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("图片生成失败");
      const pageSuffix = pageCount > 1 ? String(pageIndex + 1).padStart(2, "0") : "";
      downloadFile(blob, exportFilename("png", pageSuffix));
    }
    elements.exportRecordMsg.textContent = pageCount > 1 ? `图片已开始下载，共 ${pageCount} 张` : "图片已开始下载";
  } catch (error) {
    elements.exportRecordMsg.textContent = error.message;
  } finally {
    elements.exportImageBtn.disabled = false;
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

function questionFromApi(item) {
  return {
    id: customQuestionId(item.id),
    prompt: item.prompt,
    custom: true,
    creator: item.creator,
  };
}

async function loadCustomQuestions() {
  const questions = await api("/api/questions");
  for (const item of questions) {
    const question = questionFromApi(item);
    if (!QUESTION_BANK.some((existing) => existing.id === question.id)) {
      QUESTION_BANK.push(question);
    }
  }
}

async function addCustomQuestion() {
  const prompt = elements.customQuestionInput.value.replace(/\s+/g, " ").trim();
  if (!state.user) {
    elements.customQuestionMsg.textContent = "请先登录，再添加自定义题目";
    return;
  }
  if (isGuessMode() || state.pendingChallenge) return;
  if (prompt.length < 4) {
    elements.customQuestionMsg.textContent = "题目至少需要 4 个字符";
    return;
  }
  if (QUESTION_BANK.some((item) => item.prompt.toLocaleLowerCase() === prompt.toLocaleLowerCase())) {
    elements.customQuestionMsg.textContent = "这道题已经在题库中了";
    return;
  }

  state.questionSubmitting = true;
  renderSetup();
  elements.customQuestionMsg.textContent = "正在加入题库...";
  try {
    const created = await api("/api/questions", {
      method: "POST",
      body: { prompt },
    });
    const question = questionFromApi(created);
    QUESTION_BANK.push(question);
    state.question = question;
    fillQuestionOptions();
    elements.questionSelect.value = question.id;
    elements.customQuestionInput.value = "";
    elements.customQuestionMsg.textContent = "已加入题库并自动选中";
    renderQuestion();
  } catch (error) {
    elements.customQuestionMsg.textContent = error.message;
  } finally {
    state.questionSubmitting = false;
    renderSetup();
  }
}

function applyChallenge(data) {
  const byId = new Map(state.characters.map((item) => [item.id, item]));
  const loaded = data.character_ids.map((id) => byId.get(id)).filter(Boolean);
  if (loaded.length !== data.character_ids.length) {
    throw new Error("挑战中的角色素材不完整，请重新创建挑战");
  }
  const selected = isGuessMode(data.mode)
    ? loaded.filter((item) => !GUESS_EXCLUDED_NAMES.has(item.name))
    : loaded;

  state.mode = data.mode;
  state.question = isGuessMode(data.mode)
    ? questionForMode(data.mode)
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
  state.notes = {};
  state.gameCharacters = selected;
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
    state.question = isGuessMode(state.mode)
      ? questionForMode(state.mode)
      : selectedQuestion || { id: saved.questionId || "saved_question", prompt: saved.questionPrompt || "" };
    state.challengeCode = saved.challengeCode || "";
    state.queue = (saved.queue || []).map((id) => byId.get(id)).filter(Boolean);
    state.gameCharacters = (saved.gameCharacters || [])
      .map((id) => byId.get(id))
      .filter(Boolean);
    state.notes = saved.notes && typeof saved.notes === "object" ? saved.notes : {};
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
  state.question = isGuessMode(data.mode)
    ? questionForMode(data.mode)
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
  await loadCustomQuestions().catch((error) => {
    elements.customQuestionMsg.textContent = `自定义题库加载失败：${error.message}`;
  });
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
        <div class="text-lg font-semibold">${escapeHtml(winner.name)} 是你在这道题下最后保留的角色</div>
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
  const others = state.characters.filter(
    (item) => item.id !== current.id && !GUESS_EXCLUDED_NAMES.has(item.name),
  );
  return shuffle([current, ...shuffle(others, random).slice(0, 7)], random);
}

function applyObscuringMask(context, width, height, seed) {
  const columns = 6;
  const rows = 5;
  const cells = Array.from({ length: columns * rows }, (_, index) => index);
  const hiddenCells = shuffle(cells, seededRandom(seed)).slice(0, 9);
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  for (const cell of hiddenCells) {
    const column = cell % columns;
    const row = Math.floor(cell / columns);
    context.clearRect(
      Math.floor(column * cellWidth),
      Math.floor(row * cellHeight),
      Math.ceil(cellWidth) + 1,
      Math.ceil(cellHeight) + 1,
    );
  }
}

async function loadSilhouette(character, index) {
  const hardMode = isHardGuessMode();
  const cacheKey = hardMode
    ? `${character.id}:hard:${state.challengeCode}:${index}`
    : `${character.id}:normal`;
  if (SILHOUETTE_CACHE.has(cacheKey)) return SILHOUETTE_CACHE.get(cacheKey);

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
        if (hardMode) {
          applyObscuringMask(
            context,
            canvas.width,
            canvas.height,
            `${state.challengeCode}:${index}:${character.id}:mask`,
          );
        }
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("无法生成角色剪影"));
    image.src = character.avatar_url;
  });

  SILHOUETTE_CACHE.set(cacheKey, promise);
  return promise;
}

function renderGuess() {
  const current = state.guessItems[state.guessIndex];
  if (!current) return;
  const imageKey = `${state.mode}:${state.challengeCode}:${state.guessIndex}:${current.id}`;
  if (elements.guessAvatar.dataset.guessKey !== imageKey) {
    elements.guessAvatar.dataset.guessKey = imageKey;
    elements.guessAvatar.removeAttribute("src");
    elements.guessAvatar.classList.remove("image-arrive");
  }

  elements.guessRoundLabel.textContent = `第 ${state.guessIndex + 1} / ${state.guessItems.length} 题`;
  elements.guessTitle.textContent = isHardGuessMode() ? "困难剪影挑战" : "证件照猜角色";
  elements.guessFeedback.textContent = state.guessFeedback;
  elements.guessSection.classList.toggle("is-answering", state.busy);
  elements.guessAvatar.classList.toggle("is-revealed", state.busy);
  if (state.busy) elements.guessAvatar.classList.remove("image-arrive");
  elements.guessOptions.innerHTML = state.busy
    ? ""
    : guessOptions(current, state.guessIndex)
        .map(
          (item, optionIndex) => `
            <button class="guess-option" style="--option-index: ${optionIndex}" type="button" data-guess-id="${item.id}">
              ${escapeHtml(item.name)}
            </button>
          `,
        )
        .join("");

  elements.guessOptions.querySelectorAll("[data-guess-id]").forEach((button) => {
    button.addEventListener("click", () => chooseGuess(Number(button.dataset.guessId)));
  });

  if (state.busy) {
    elements.guessAvatar.src = current.avatar_url;
    elements.guessAvatar.alt = `${current.name}的彩色证件照`;
    return;
  }

  const currentId = current.id;
  elements.guessAvatar.alt = "角色剪影";
  loadSilhouette(current, state.guessIndex)
    .then((url) => {
      if (state.started && !state.completed && !state.busy && state.guessItems[state.guessIndex]?.id === currentId) {
        elements.guessAvatar.src = url;
        elements.guessAvatar.classList.remove("image-arrive");
        void elements.guessAvatar.offsetWidth;
        elements.guessAvatar.classList.add("image-arrive");
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
  state.guessFeedback = correct ? `猜对了，这是 ${current.name}` : `答案是 ${current.name}`;
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
  }, 1000);
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
  state.notes = {};
  state.gameCharacters = [];
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
  elements.addQuestionBtn.addEventListener("click", () => addCustomQuestion());
  elements.customQuestionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addCustomQuestion();
  });
  elements.startBtn.addEventListener("click", () => startFreshGame());
  elements.leftCard.addEventListener("click", (event) => {
    if (!event.target.closest("textarea")) choose("left");
  });
  elements.rightCard.addEventListener("click", (event) => {
    if (!event.target.closest("textarea")) choose("right");
  });
  elements.leftCard.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target === elements.leftCard) {
      event.preventDefault();
      choose("left");
    }
  });
  elements.rightCard.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target === elements.rightCard) {
      event.preventDefault();
      choose("right");
    }
  });
  const bindChoiceNote = (noteElement) => {
    noteElement.addEventListener("click", (event) => event.stopPropagation());
    noteElement.addEventListener("keydown", (event) => event.stopPropagation());
    noteElement.addEventListener("input", () => {
      const characterId = Number(noteElement.dataset.characterId);
      if (!characterId) return;
      state.notes[characterId] = noteElement.value;
      saveGameState();
    });
  };
  bindChoiceNote(elements.leftNote);
  bindChoiceNote(elements.rightNote);
  elements.shareChallengeBtn.addEventListener("click", () => shareChallenge());
  elements.exportImageBtn.addEventListener("click", () => exportImage());
  elements.exportCsvBtn.addEventListener("click", () => exportCsv());
  elements.musicDiscBtn.addEventListener("click", () => setMusicPanel(!musicState.panelOpen));
  elements.musicCloseBtn.addEventListener("click", () => setMusicPanel(false));
  elements.musicPlayBtn.addEventListener("click", toggleMusic);
  elements.musicPanelPlayBtn.addEventListener("click", toggleMusic);
  elements.musicPrevBtn.addEventListener("click", () => selectMusicTrack(musicState.trackIndex - 1));
  elements.musicNextBtn.addEventListener("click", () => selectMusicTrack(musicState.trackIndex + 1));
  elements.musicVolume.addEventListener("input", () => {
    musicState.volume = Number(elements.musicVolume.value);
    localStorage.setItem(MUSIC_VOLUME_KEY, String(musicState.volume));
    if (musicState.audio) musicState.audio.volume = musicState.volume / 100;
  });
  elements.musicProgress.addEventListener("input", () => {
    if (!musicState.audio || !Number.isFinite(musicState.audio.duration)) return;
    musicState.audio.currentTime = Number(elements.musicProgress.value);
    elements.musicCurrentTime.textContent = formatMusicTime(musicState.audio.currentTime);
  });
  document.addEventListener("click", (event) => {
    if (!musicState.panelOpen) return;
    const eventPath = event.composedPath();
    const clickedPlayer = eventPath.includes(elements.musicPanel)
      || eventPath.some((node) => node?.classList?.contains("music-dock"));
    if (clickedPlayer) return;
    setMusicPanel(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && musicState.panelOpen) setMusicPanel(false);
  });
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
  renderMusicPlayer();
  hydrateIcons().catch(() => {});
  loadUser()
    .then(loadBattle)
    .catch((error) => {
      elements.statusLine.textContent = `启动失败: ${error.message}`;
    });
}

bootstrap();
