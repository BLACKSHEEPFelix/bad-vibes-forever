const STORAGE_KEY = "bvf:vibes";
const SETTINGS_KEY = "bvf:settings";
const DB_NAME = "bvf-media";
const DB_STORE = "media";
const API_BASE = "/api";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const BUILT_IN_BGM = {
  bad: "./audio/Lmnl - safe again.mp3",
  good: "./audio/White Cherry - MELANCHOLY.flac"
};
const THEMES = {
  bad: {
    title: "bad vibes forever",
    tag: "BAD vibes",
    switchText: "G",
    switchLabel: "切换到 Good vibes",
    intro: "把坏情绪放在这里，不需要立刻变好",
    copy: "选一种 vibe，把今天的感觉放下来。我先听你说，也会有人路过，留下一点回应。",
    placeholder: "what's your vibe today?",
    safety: "如果你正处在危险中，先联系身边可信的人或当地紧急求助渠道。这里会陪你，但不要一个人硬扛。",
    categories: ["悲伤", "难过", "焦虑", "愤怒", "迷茫", "后悔", "遗憾", "孤独", "失落"],
    reactions: ["我听见了", "抱一下", "一起撑住"]
  },
  good: {
    title: "good vibes forever",
    tag: "GOOD vibes",
    switchText: "B",
    switchLabel: "切换到 bad vibes",
    intro: "把好情绪也认真保存，它值得被反复听见",
    copy: "记录一个亮起来的瞬间。我会接住这份好，也会有人路过，把祝福和共鸣接上。",
    placeholder: "what's your vibe today?",
    safety: "把今天值得保存的小亮光写下来。哪怕只是很小一件事，也可以成为之后回看的能量。",
    categories: ["开心", "幸福", "平静", "兴奋", "激动", "感恩", "释然", "希望", "灵感", "陪伴"],
    reactions: ["接住光", "为你开心", "继续发亮"]
  }
};

const AUTO_REPLIES = {
  bad: {
    "悲伤": "悲伤不是需要被赶走的东西。先让它坐一会儿，你能把它说出来，已经是在照顾自己。",
    "难过": "难过的时候，不用急着讲道理。先把这口气放慢，把今天过小一点。",
    "孤独": "你不是必须马上热闹起来。先让这份孤独有个位置，能被说出来，就已经不是完全一个人扛着。",
    "焦虑": "先把下一分钟过完就好。把呼吸放慢，把最小的一步写下来，其他的可以晚一点再处理。",
    "愤怒": "愤怒有时是在替边界发声。先别急着审判它，等火小一点，再决定要保护什么。",
    "失落": "失落说明你真的在乎过。今天可以不解释、不证明，只把自己稳稳放回原处。",
    "迷茫": "看不清方向的时候，不代表你走错了。先抓住一个确定的小动作，路会慢慢显影。",
    "后悔": "后悔说明你看见了新的可能。先不要反复惩罚自己，把能修的一小块写下来就好。",
    "遗憾": "遗憾会留下空位，但空位也能慢慢长出新的安排。今天先承认它存在。"
  },
  good: {
    "开心": "这份开心值得被认真保存。它不用很大，只要是真的，就能照亮一点点之后的路。",
    "幸福": "幸福出现的时候，可以不用解释太多。把它放在这里，让之后的你还能回来摸到它。",
    "平静": "平静是一种很珍贵的余地。愿这份松一点的感觉多停留一会儿。",
    "兴奋": "兴奋说明身体先一步看见了可能。先记下这股劲，之后可以慢慢把它变成行动。",
    "激动": "这份激动很鲜活。让它被看见，也让它有地方安放。",
    "感恩": "这份被你注意到的好意，会在心里留下纹理。谢谢你把它放到这里。",
    "释然": "能松开一点，已经很不容易。愿这口气继续替你腾出空间。",
    "希望": "希望不用很大，一点点也能照路。你正在把它养出来。",
    "灵感": "灵感来过就值得被记下。先别急着完美，给它一个粗糙但真实的开头。",
    "陪伴": "被陪着的时刻会让人重新有力气。愿这份连接在你需要时还能回来。"
  }
};

const SHEEP_COMPANION_LINES = {
  bad: {
    "悲伤": "小羊会慢慢陪你，不催你变好。",
    "难过": "难过可以先放在这里，我替你看着。",
    "焦虑": "先把下一口气放慢一点。",
    "愤怒": "这份火气也许在保护你。",
    "迷茫": "看不清也没关系，先停一小会儿。",
    "后悔": "不用一直惩罚自己，我们先回到现在。",
    "遗憾": "遗憾有重量，小羊帮你托一角。",
    "孤独": "你不是一个人在这里。",
    "失落": "今天可以先不用解释。"
  },
  good: {
    "开心": "这份开心我帮你收进小口袋。",
    "幸福": "这是一颗亮亮的小糖。",
    "平静": "这种安稳值得被记住。",
    "兴奋": "这股劲儿在发光。",
    "激动": "心跳快一点也很好。",
    "感恩": "被看见的好意会留下痕迹。",
    "释然": "松开一点，也是一种抵达。",
    "希望": "这点光很小，但真的在。",
    "灵感": "先把火花留下来。",
    "陪伴": "被陪着的感觉也可以存档。"
  }
};

const NOTE_COLORS = ["fog", "sad", "sorrow", "blue", "anger", "violet", "regret", "green", "joy", "happy", "calm", "excited", "pulse"];
const THEME_NOTE_COLORS = {
  bad: ["fog", "sad", "sorrow", "blue", "anger", "violet", "regret"],
  good: ["green", "joy", "happy", "calm", "excited", "pulse"]
};

const CATEGORY_NOTE_COLORS = {
  "悲伤": "sad",
  "难过": "sorrow",
  "焦虑": "blue",
  "愤怒": "anger",
  "迷茫": "violet",
  "后悔": "regret",
  "遗憾": "violet",
  "孤独": "fog",
  "失落": "sad",
  "开心": "joy",
  "幸福": "happy",
  "平静": "calm",
  "兴奋": "excited",
  "激动": "pulse",
  "感恩": "green",
  "释然": "calm",
  "希望": "joy",
  "灵感": "violet",
  "陪伴": "green"
};

const REACTION_EMOJI = {
  "我听见了": "👂",
  "抱一下": "🫂",
  "一起撑住": "🤝",
  "接住光": "✨",
  "为你开心": "🎉",
  "继续发亮": "🌱"
};

const $ = (selector) => document.querySelector(selector);

let state = {
  vibes: [],
  settings: {
    activeTheme: "bad",
    badBgmMediaId: null,
    goodBgmMediaId: null,
    reducedMotion: false,
    activeNoteColor: "fog",
    clearedThemes: {}
  },
  session: {
    authenticated: false,
    canManage: false,
    role: null,
    user: null
  },
  sharedData: false
};

let lastFocusedElement = null;
let splashFinished = false;
let bgmUnlockBound = false;

const elements = {
  body: document.body,
  splashScreen: $("#splashScreen"),
  sideSheep: $("#sideSheep"),
  sheepCompanion: $("#sheepCompanion"),
  siteTitle: $("#siteTitle"),
  themeSwitch: $("#themeSwitch"),
  motionToggle: $("#motionToggle"),
  modeTag: $("#modeTag"),
  introTitle: $("#introTitle"),
  introCopy: $("#introCopy"),
  wallPulseKicker: $("#wallPulseKicker"),
  wallPulseValue: $("#wallPulseValue"),
  wallPulseLabel: $("#wallPulseLabel"),
  wallPulseLine: $("#wallPulseLine"),
  wallPulseBad: $("#wallPulseBad"),
  wallPulseGood: $("#wallPulseGood"),
  wallPulseReplies: $("#wallPulseReplies"),
  bgmPlayer: $("#bgmPlayer"),
  form: $("#vibe-form"),
  categoryInput: $("#categoryInput"),
  categoryTrigger: $("#categoryTrigger"),
  categorySelected: $("#categorySelected"),
  categoryPanel: $("#categoryPanel"),
  authorInput: $("#authorInput"),
  bodyInput: $("#bodyInput"),
  bodyCount: $("#bodyCount"),
  safetyNote: $("#safetyNote"),
  imageInput: $("#imageInput"),
  audioInput: $("#audioInput"),
  linkInput: $("#linkInput"),
  noteColorInputs: document.querySelectorAll("input[name='noteColor']"),
  sheepActionButtons: document.querySelectorAll("[data-sheep-action]"),
  feedList: $("#feedList"),
  clearButton: $("#clearButton"),
  template: $("#vibeTemplate"),
  detailOverlay: $("#detailOverlay"),
  detailContent: $("#detailContent"),
  detailClose: $("#detailClose"),
  loginForm: $("#loginForm"),
  inviteCode: $("#inviteCode"),
  loginButton: $("#loginButton"),
  logoutButton: $("#logoutButton"),
  authStatus: $("#authStatus"),
  canvas: $("#moodCanvas")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.settings = { ...state.settings, ...loadSettings() };
  state.session = await loadSession();
  state.vibes = await loadVibes();
  if (!state.sharedData) restoreMissingSeedVibes();

  applyTheme(state.settings.activeTheme);
  applyMotionPreference(state.settings.reducedMotion);
  applyNoteColor(state.settings.activeNoteColor || "fog", { persist: false });
  updateAuthUi();
  bindEvents();
  drawMoodCanvas();
  await refreshBgm();
  scheduleSplashExit();
  await renderFeed();
}

function bindEvents() {
  elements.themeSwitch.addEventListener("click", async () => {
    const next = state.settings.activeTheme === "bad" ? "good" : "bad";
    state.settings.activeTheme = next;
    applyTheme(next);
    saveSettings();
    await refreshBgm({ autoplay: splashFinished });
    await renderFeed();
  });

  elements.motionToggle.addEventListener("click", () => {
    state.settings.reducedMotion = !state.settings.reducedMotion;
    saveSettings();
    applyMotionPreference(state.settings.reducedMotion);
  });

  elements.form.addEventListener("submit", submitVibe);
  elements.loginForm.addEventListener("submit", login);
  elements.logoutButton.addEventListener("click", logout);
  elements.bodyInput.addEventListener("input", updateBodyCount);
  elements.categoryTrigger.addEventListener("click", toggleCategoryPanel);
  elements.noteColorInputs.forEach((input) => {
    input.addEventListener("change", (event) => {
      applyNoteColor(event.currentTarget.value);
      markTapped(event.currentTarget.closest("label"));
    });
  });
  elements.sheepActionButtons.forEach((button) => {
    button.addEventListener("click", () => triggerSheepAction(button.dataset.sheepAction));
  });
  elements.clearButton.addEventListener("click", clearVibes);
  elements.detailClose.addEventListener("click", closeVibeModal);
  elements.detailOverlay.addEventListener("click", (event) => {
    if (event.target === elements.detailOverlay) closeVibeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.categoryPanel.hidden) closeCategoryPanel();
    if (event.key === "Escape" && !elements.detailOverlay.hidden) closeVibeModal();
  });
  window.addEventListener("resize", drawMoodCanvas);
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".category-field")) closeCategoryPanel();
    const target = event.target.closest("button, .vibe-card");
    if (target) markTapped(target);
  });
}

async function login(event) {
  event.preventDefault();
  const code = elements.inviteCode.value.trim();

  try {
    state.session = await apiRequest("/login", {
      method: "POST",
      body: { code }
    });
    elements.inviteCode.value = "";
    updateAuthUi();
    showToast(state.session.canManage ? "管理员已进入，可以管理共享墙。" : "口令通过，可以写入共享墙。");
    await reloadSharedVibes();
  } catch {
    showToast("口令不对，请检查后再试。");
  }
}

async function logout() {
  try {
    state.session = await apiRequest("/logout", { method: "POST" });
  } catch {
    state.session = getEmptySession();
  }
  updateAuthUi();
  await renderFeed();
  showToast("已退出，当前为公开浏览。");
}

function updateAuthUi() {
  const isShared = state.sharedData;
  const isAuthed = state.session.authenticated;
  const canManage = state.session.canManage;
  elements.body.classList.toggle("is-authenticated", isAuthed);
  elements.authStatus.textContent = isShared
    ? getAuthStatusText()
    : "本地模式";
  elements.inviteCode.hidden = isAuthed;
  elements.loginButton.hidden = isAuthed;
  elements.logoutButton.hidden = !isAuthed;
  elements.clearButton.textContent = isShared ? "清空共享留言" : "清空本地留言";
  elements.clearButton.disabled = isShared && !canManage;
  elements.form.classList.toggle("requires-login", isShared && !isAuthed);
}

function getAuthStatusText() {
  if (!state.session.authenticated) return "公开浏览，输入口令后可留言";
  return state.session.canManage ? "管理员模式，可留言和清空" : "已通过口令，可留言";
}

function requireWriteAccess() {
  if (!state.sharedData || state.session.authenticated) return true;
  showToast("请先输入邀请口令，再写入共享墙。");
  elements.inviteCode.focus();
  return false;
}

function requireManageAccess() {
  if (!state.sharedData || state.session.canManage) return true;
  showToast("清空共享留言需要管理员口令。");
  if (!state.session.authenticated) elements.inviteCode.focus();
  return false;
}

function applyTheme(themeName) {
  const theme = THEMES[themeName];
  elements.body.dataset.theme = themeName;
  document.title = theme.title;
  elements.siteTitle.textContent = theme.title;
  elements.themeSwitch.textContent = theme.switchText;
  elements.themeSwitch.title = theme.switchLabel;
  elements.themeSwitch.setAttribute("aria-label", theme.switchLabel);
  elements.themeSwitch.setAttribute("aria-pressed", String(themeName === "good"));
  elements.modeTag.textContent = theme.tag;
  elements.introTitle.textContent = theme.intro;
  elements.introCopy.textContent = theme.copy;
  elements.bodyInput.placeholder = theme.placeholder;
  elements.safetyNote.textContent = theme.safety;
  updateBodyCount();
  elements.categoryInput.replaceChildren(
    ...theme.categories.map((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      return option;
    })
  );
  renderCategoryOptions(theme.categories);
  syncNoteColorOptions(themeName);
  applyNoteColor(getSafeThemeNoteColor(state.settings.activeNoteColor, themeName), { persist: false });
  updateSheepCompanion(elements.categoryInput.value || theme.categories[0], { animate: false });
  drawMoodCanvas();
}

function renderCategoryOptions(categories) {
  elements.categoryPanel.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category-option";
      button.setAttribute("role", "option");
      button.textContent = category;
      button.dataset.category = category;
      button.dataset.noteColor = CATEGORY_NOTE_COLORS[category] || "fog";
      button.setAttribute("aria-selected", String(category === elements.categoryInput.value));
      button.addEventListener("click", () => selectCategory(category));
      return button;
    })
  );
  updateCategoryDisplay(elements.categoryInput.value || categories[0]);
}

function toggleCategoryPanel() {
  const nextOpen = elements.categoryPanel.hidden;
  elements.categoryPanel.hidden = !nextOpen;
  elements.categoryTrigger.setAttribute("aria-expanded", String(nextOpen));
}

function closeCategoryPanel() {
  elements.categoryPanel.hidden = true;
  elements.categoryTrigger.setAttribute("aria-expanded", "false");
}

function selectCategory(category) {
  elements.categoryInput.value = category;
  updateCategoryDisplay(category);
  applyNoteColor(getCategoryNoteColor(category));
  updateSheepCompanion(category);
  markTapped(elements.categoryTrigger);
  closeCategoryPanel();
}

function updateCategoryDisplay(category) {
  elements.categorySelected.textContent = category;
  elements.categoryPanel.querySelectorAll(".category-option").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.category === category));
  });
}

function updateSheepCompanion(category, options = {}) {
  const themeName = state.settings.activeTheme;
  const message = options.message || SHEEP_COMPANION_LINES[themeName]?.[category] || "小羊在这里陪你。";
  setSheepCompanion(message, options);
}

function setSheepCompanion(message, options = {}) {
  if (!elements.sheepCompanion) return;
  elements.sheepCompanion.textContent = message;
  if (options.animate === false || state.settings.reducedMotion) return;
  elements.sheepCompanion.classList.remove("is-updated");
  void elements.sheepCompanion.offsetWidth;
  elements.sheepCompanion.classList.add("is-updated");
  window.setTimeout(() => elements.sheepCompanion.classList.remove("is-updated"), 380);
}

function applyMotionPreference(reduced) {
  elements.body.classList.toggle("reduce-motion", reduced);
  elements.motionToggle.setAttribute("aria-pressed", String(reduced));
  elements.motionToggle.title = reduced ? "恢复动态效果" : "减少动态效果";
  elements.motionToggle.querySelector(".sr-only").textContent = reduced ? "恢复动态效果" : "减少动态效果";
}

function updateBodyCount() {
  elements.bodyCount.textContent = `${elements.bodyInput.value.length}/600`;
}

function applyNoteColor(color, options = {}) {
  const nextColor = getSafeThemeNoteColor(color);
  elements.body.dataset.noteColor = nextColor;
  state.settings.activeNoteColor = nextColor;
  const selectedInput = document.querySelector(`input[name="noteColor"][value="${nextColor}"]`);
  if (selectedInput) selectedInput.checked = true;
  drawMoodCanvas();
  if (options.persist !== false) saveSettings();
}

function getThemeNoteColors(themeName = state.settings.activeTheme) {
  return THEME_NOTE_COLORS[themeName] || NOTE_COLORS;
}

function getCategoryNoteColor(category, themeName = state.settings.activeTheme) {
  const allowedColors = getThemeNoteColors(themeName);
  const categoryColor = CATEGORY_NOTE_COLORS[category];
  return allowedColors.includes(categoryColor) ? categoryColor : allowedColors[0] || "fog";
}

function getSafeThemeNoteColor(color, themeName = state.settings.activeTheme) {
  const allowedColors = getThemeNoteColors(themeName);
  if (allowedColors.includes(color)) return color;
  return getCategoryNoteColor(elements.categoryInput.value, themeName);
}

function syncNoteColorOptions(themeName = state.settings.activeTheme) {
  const allowedColors = getThemeNoteColors(themeName);
  elements.noteColorInputs.forEach((input) => {
    const isAllowed = allowedColors.includes(input.value);
    const option = input.closest(".color-field label");
    input.disabled = !isAllowed;
    if (option) option.hidden = !isAllowed;
  });
}

function scheduleSplashExit() {
  if (!elements.splashScreen || state.settings.reducedMotion) {
    hideSplash();
    return;
  }

  window.setTimeout(hideSplash, 2500);
}

function hideSplash() {
  if (elements.splashScreen) elements.splashScreen.hidden = true;
  splashFinished = true;
  playBackgroundMusic();
}

function markTapped(element) {
  if (!element) return;
  element.classList.remove("is-tapped");
  void element.offsetWidth;
  element.classList.add("is-tapped");
  window.setTimeout(() => element.classList.remove("is-tapped"), 280);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function triggerSheepAction(action) {
  if (!elements.sideSheep) return;
  const className = `sheep-action-${action}`;
  elements.sideSheep.classList.remove("sheep-action-pet", "sheep-action-jump", "sheep-action-calm");
  void elements.sideSheep.offsetWidth;
  elements.sideSheep.classList.add(className);

  const messages = {
    pet: "小羊收到了摸摸头。",
    jump: "小羊轻轻蹦了一下。",
    calm: "小羊在旁边安静陪你。"
  };
  showToast(messages[action] || "小羊回应了你。");

  window.setTimeout(() => {
    elements.sideSheep.classList.remove(className);
  }, action === "calm" ? 1400 : 760);
}

async function submitVibe(event) {
  event.preventDefault();
  if (!requireWriteAccess()) return;

  const body = elements.bodyInput.value.trim();
  if (!body) {
    showToast("先写下一点内容，再把 vibe 放上墙。");
    elements.bodyInput.focus();
    return;
  }

  const theme = state.settings.activeTheme;
  const category = elements.categoryInput.value;
  const mediaIds = [];
  const linkAttachments = [];

  const imageFile = elements.imageInput.files[0];
  const audioFile = elements.audioInput.files[0];
  if (!validateUploadFile(imageFile, "图片") || !validateUploadFile(audioFile, "音频")) return;

  if (state.sharedData) {
    try {
      if (imageFile) linkAttachments.push(await fileToAttachment(imageFile, "image"));
      if (audioFile) linkAttachments.push(await fileToAttachment(audioFile, "audio"));
    } catch {
      showToast("附件读取失败，先用链接发布会更稳。");
      return;
    }
  } else {
    if (imageFile) mediaIds.push(await saveMedia(imageFile, "image"));
    if (audioFile) mediaIds.push(await saveMedia(audioFile, "audio"));
  }

  const link = elements.linkInput.value.trim();
  if (link) linkAttachments.push({ url: link, type: inferLinkType(link) });

  const vibe = {
    id: crypto.randomUUID(),
    theme,
    category,
    body,
    author: elements.authorInput.value.trim() || "匿名",
    createdAt: new Date().toISOString(),
    mediaIds,
    linkAttachments,
    noteColor: getSafeThemeNoteColor(new FormData(elements.form).get("noteColor"), theme),
    autoReply: AUTO_REPLIES[theme][category],
    reactions: Object.fromEntries(THEMES[theme].reactions.map((reaction) => [reaction, 0])),
    replies: []
  };

  let savedVibe = vibe;
  if (state.sharedData) {
    try {
      savedVibe = await apiRequest("/vibes", {
        method: "POST",
        body: vibe
      });
    } catch (error) {
      showToast(getSubmitErrorMessage(error));
      return;
    }
  }

  state.vibes.unshift(savedVibe);
  state.settings.clearedThemes[theme] = false;
  if (!state.sharedData) saveVibes();
  saveSettings();
  elements.form.reset();
  applyTheme(theme);
  applyNoteColor(state.settings.activeNoteColor, { persist: false });
  await renderFeed();
  updateSheepCompanion(category, {
    message: theme === "good" ? "这份好我收好啦，之后也能回来看看。" : "这张便签我收好啦，你可以先轻一点。",
  });
  showToast("你的 vibe 已经被放上墙。");
}

function getSubmitErrorMessage(error) {
  if (error.message === "attachment_too_large") return `附件不能超过 ${formatFileSize(MAX_UPLOAD_BYTES)}。`;
  if (error.message === "request_too_large") return "这条 vibe 的附件总量太大了，请减少一个附件再试。";
  if (error.message === "link_too_long") return "链接太长了，换一个短一点的链接试试。";
  return "发布失败，请稍后再试。";
}

function validateUploadFile(file, label) {
  if (!file || file.size <= MAX_UPLOAD_BYTES) return true;
  showToast(`${label}不能超过 ${formatFileSize(MAX_UPLOAD_BYTES)}。`);
  return false;
}

async function renderFeed() {
  updateWallPulse();
  const activeTheme = state.settings.activeTheme;
  const visibleVibes = state.vibes.filter((vibe) => vibe.theme === activeTheme);
  elements.feedList.replaceChildren();

  if (!visibleVibes.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = activeTheme === "bad"
      ? "这里暂时很安静。你可以成为第一个把坏情绪放下来的人。"
      : "这里还没有新的好消息。你可以先点亮这面墙。";
    elements.feedList.append(empty);
    return;
  }

  for (const vibe of visibleVibes) {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    node.dataset.id = vibe.id;
    node.dataset.noteColor = vibe.noteColor || "fog";
    node.querySelector(".card-category").textContent = vibe.category;
    node.querySelector(".card-author").textContent = vibe.author;
    node.querySelector("time").dateTime = vibe.createdAt;
    node.querySelector("time").textContent = formatTime(vibe.createdAt);
    const openButton = node.querySelector(".card-open");
    openButton.setAttribute("aria-label", `查看 ${vibe.author} 的完整 vibe`);
    openButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      markTapped(openButton);
      await wait(90);
      openVibeModal(vibe.id);
    });
    node.querySelector(".card-body").textContent = truncateText(vibe.body, 74);
    await renderCardPreviewMedia(node, vibe);
    renderCardBack(node, vibe);
    renderReactions(node, vibe);
    node.querySelector(".auto-reply").hidden = true;
    node.querySelector(".reply-form").hidden = true;
    node.querySelector(".reply-list").hidden = true;
    bindCardEvents(node, vibe, { compact: true });
    node.addEventListener("click", async (event) => {
      if (event.target.closest("button, input, a, audio")) return;
      markTapped(node);
      await wait(90);
      openVibeModal(vibe.id);
    });
    elements.feedList.append(node);
  }
}

function updateWallPulse() {
  const activeTheme = state.settings.activeTheme;
  const activeVibes = state.vibes.filter((vibe) => vibe.theme === activeTheme);
  const badCount = state.vibes.filter((vibe) => vibe.theme === "bad").length;
  const goodCount = state.vibes.filter((vibe) => vibe.theme === "good").length;
  const replyCount = state.vibes.reduce((total, vibe) => total + (Array.isArray(vibe.replies) ? vibe.replies.length : 0), 0);
  const latest = activeVibes[0];

  elements.wallPulseKicker.textContent = activeTheme === "good" ? "亮光存档" : "墙面温度";
  elements.wallPulseValue.textContent = String(activeVibes.length);
  elements.wallPulseLabel.textContent = activeTheme === "good" ? "good vibes" : "bad vibes";
  elements.wallPulseBad.textContent = String(badCount);
  elements.wallPulseGood.textContent = String(goodCount);
  elements.wallPulseReplies.textContent = String(replyCount);
  elements.wallPulseLine.textContent = latest
    ? `${latest.category} · ${truncateText(latest.body, 28)}`
    : activeTheme === "good"
      ? "亮光还在路上。"
      : "墙面暂时很安静。";
}

function renderCardBack(node, vibe) {
  const back = node.querySelector(".card-back");
  if (!back) return;
  const autoReply = back.querySelector("p");
  const replyList = back.querySelector(".back-reply-list");
  autoReply.textContent = vibe.autoReply || "我收到了。你可以慢慢说，不需要一次说完。";
  replyList.replaceChildren();

  const replies = Array.isArray(vibe.replies) ? vibe.replies : [];
  if (!replies.length) {
    const empty = document.createElement("p");
    empty.className = "reply-item is-empty";
    empty.textContent = "还没有路人留言。";
    replyList.append(empty);
  } else {
    replies.forEach((reply) => {
      const item = document.createElement("p");
      item.className = "reply-item";
      const author = document.createElement("strong");
      author.textContent = `${reply.author}: `;
      const body = document.createElement("span");
      body.textContent = reply.body;
      item.append(author, body);
      replyList.append(item);
    });
  }
  back.setAttribute("aria-hidden", "true");
}

function toggleCardFlip(node) {
  const next = !node.classList.contains("is-flipped");
  node.classList.toggle("is-flipped", next);
  const back = node.querySelector(".card-back");
  const button = node.querySelector(".card-flip");
  if (back) back.setAttribute("aria-hidden", String(!next));
  if (button) {
    button.setAttribute("aria-pressed", String(next));
    button.textContent = next ? "正面" : "翻面";
  }
}

function renderReactions(node, vibe) {
  const row = node.querySelector(".reaction-row");
  const reactions = Object.keys(vibe.reactions);
  row.replaceChildren(...reactions.map((reaction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.reaction = reaction;
    button.textContent = `${REACTION_EMOJI[reaction] || reaction} · ${toSymbolCount(vibe.reactions[reaction])}`;
    button.title = `${reaction}，已有 ${vibe.reactions[reaction]} 次回应`;
    button.setAttribute("aria-label", `${reaction}，已有 ${vibe.reactions[reaction]} 次回应。点击增加一次。`);
    button.disabled = state.sharedData && !state.session.authenticated;
    return button;
  }));
}

async function renderCardPreviewMedia(node, vibe) {
  const imageUrl = await getFirstImageUrl(vibe);
  const audioZone = node.querySelector(".audio-zone");
  const imageZone = node.querySelector(".image-zone");

  if (imageZone) imageZone.hidden = true;
  if (imageUrl) {
    node.classList.add("has-image-preview");
    node.style.setProperty("--preview-image", `url("${escapeCssUrl(imageUrl)}")`);
  }

  if (audioZone) {
    await renderAudioMedia(audioZone, vibe);
  }
}

async function renderDetailMedia(node, vibe) {
  const imageZone = node.querySelector(".image-zone");
  const audioZone = node.querySelector(".audio-zone");
  if (imageZone) await renderImageMedia(imageZone, vibe);
  if (audioZone) await renderAudioMedia(audioZone, vibe, { includeLinks: true });
}

async function renderImageMedia(zone, vibe) {
  zone.replaceChildren();

  for (const id of vibe.mediaIds) {
    const media = await getMedia(id);
    if (!media || media.type !== "image") continue;
    const url = URL.createObjectURL(media.blob);
    appendImage(zone, url, `${vibe.author} 上传的 vibe 图片`, true);
  }

  for (const attachment of vibe.linkAttachments) {
    if (attachment.type !== "image") continue;
    appendImage(zone, attachment.url, `${vibe.author} 添加的链接图片`);
  }

  zone.hidden = zone.childElementCount === 0;
}

async function renderAudioMedia(zone, vibe, options = {}) {
  zone.replaceChildren();

  for (const id of vibe.mediaIds) {
    const media = await getMedia(id);
    if (!media || media.type !== "audio") continue;
    const url = URL.createObjectURL(media.blob);
    appendAudio(zone, url, true);
  }

  for (const attachment of vibe.linkAttachments) {
    if (attachment.type === "audio") {
      appendAudio(zone, attachment.url);
    } else if (options.includeLinks && attachment.type === "link") {
      appendLink(zone, attachment.url);
    }
  }

  zone.hidden = zone.childElementCount === 0;
}

async function getFirstImageUrl(vibe) {
  for (const id of vibe.mediaIds) {
    const media = await getMedia(id);
    if (media?.type === "image") return URL.createObjectURL(media.blob);
  }

  const attachment = vibe.linkAttachments.find((item) => item.type === "image");
  return attachment?.url || "";
}

function appendImage(zone, url, alt, revokeOnLoad = false) {
  const image = document.createElement("img");
  image.src = url;
  image.alt = alt;
  if (revokeOnLoad) image.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
  zone.append(image);
}

function appendAudio(zone, url, revokeOnLoad = false) {
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;
  if (revokeOnLoad) audio.addEventListener("loadeddata", () => URL.revokeObjectURL(url), { once: true });
  zone.append(audio);
}

function appendLink(zone, url) {
  const link = document.createElement("a");
  link.className = "media-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = url;
  zone.append(link);
}

function escapeCssUrl(url) {
  return String(url).replace(/["\\\n\r]/g, "\\$&");
}

function renderReplies(node, vibe) {
  const list = node.querySelector(".reply-list");
  list.replaceChildren(...vibe.replies.map((reply) => {
    const item = document.createElement("p");
    item.className = "reply-item";
    const author = document.createElement("strong");
    author.textContent = `${reply.author}: `;
    const body = document.createElement("span");
    body.textContent = reply.body;
    item.append(author, body);
    return item;
  }));
}

function syncReplyFormAccess(node) {
  const shouldDisable = state.sharedData && !state.session.authenticated;
  const form = node.querySelector(".reply-form");
  form.querySelectorAll("input, button").forEach((control) => {
    control.disabled = shouldDisable;
  });
}

function bindCardEvents(node, vibe, options = {}) {
  const flipButton = node.querySelector(".card-flip");
  if (flipButton) {
    flipButton.addEventListener("click", (event) => {
      event.stopPropagation();
      markTapped(flipButton);
      toggleCardFlip(node);
    });
  }

  node.querySelector(".reaction-row").addEventListener("click", async (event) => {
    event.stopPropagation();
    const button = event.target.closest("button[data-reaction]");
    if (!button) return;
    if (!requireWriteAccess()) return;
    markTapped(button);
    if (state.sharedData) {
      try {
        const updatedVibe = await apiRequest(`/vibes/${encodeURIComponent(vibe.id)}/reactions`, {
          method: "PATCH",
          body: { reaction: button.dataset.reaction }
        });
        replaceVibe(updatedVibe);
      } catch {
        showToast("回应失败，请稍后再试。");
        return;
      }
    } else {
      vibe.reactions[button.dataset.reaction] += 1;
      saveVibes();
    }
    showToast("回应已收到。");
    await wait(140);
    await renderFeed();
    if (!elements.detailOverlay.hidden) openVibeModal(vibe.id);
  });

  node.querySelector(".reply-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (options.compact) return;
    if (!requireWriteAccess()) return;
    const input = event.currentTarget.querySelector("input");
    const body = input.value.trim();
    if (!body) return;
    if (state.sharedData) {
      try {
        const updatedVibe = await apiRequest(`/vibes/${encodeURIComponent(vibe.id)}/replies`, {
          method: "POST",
          body: { body }
        });
        replaceVibe(updatedVibe);
      } catch {
        showToast("回复失败，请稍后再试。");
        return;
      }
    } else {
      vibe.replies.push({
        id: crypto.randomUUID(),
        author: "路过的人",
        body,
        createdAt: new Date().toISOString()
      });
      saveVibes();
    }
    input.value = "";
    await renderFeed();
    openVibeModal(vibe.id);
  });
}

async function openVibeModal(vibeId) {
  const vibe = state.vibes.find((item) => item.id === vibeId);
  if (!vibe) return;

  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  elements.detailContent.replaceChildren();
  const node = elements.template.content.firstElementChild.cloneNode(true);
  node.classList.add("vibe-detail");
  node.dataset.id = vibe.id;
  node.dataset.noteColor = vibe.noteColor || "fog";
  node.querySelector(".card-category").textContent = vibe.category;
  node.querySelector(".card-author").id = "detailTitle";
  node.querySelector(".card-author").textContent = vibe.author;
  node.querySelector("time").dateTime = vibe.createdAt;
  node.querySelector("time").textContent = formatTime(vibe.createdAt);
  node.querySelector(".card-body").textContent = vibe.body;
  renderCardBack(node, vibe);
  renderReactions(node, vibe);
  await renderDetailMedia(node, vibe);
  renderReplies(node, vibe);
  node.querySelector(".auto-reply").hidden = true;
  node.querySelector(".reply-list").hidden = true;
  syncReplyFormAccess(node);
  bindCardEvents(node, vibe);

  elements.detailContent.append(node);
  elements.detailOverlay.hidden = false;
  requestAnimationFrame(() => elements.detailOverlay.classList.add("is-open"));
  elements.detailClose.focus();
}

function closeVibeModal() {
  elements.detailOverlay.classList.remove("is-open");
  window.setTimeout(() => {
    elements.detailOverlay.hidden = true;
    elements.detailContent.replaceChildren();
    if (lastFocusedElement?.isConnected) lastFocusedElement.focus();
  }, state.settings.reducedMotion ? 0 : 180);
}

async function refreshBgm(options = {}) {
  elements.bgmPlayer.pause();
  elements.bgmPlayer.removeAttribute("src");
  const source = BUILT_IN_BGM[state.settings.activeTheme];
  if (!source) return;
  elements.bgmPlayer.src = source;
  elements.bgmPlayer.load();
  if (options.autoplay) await playBackgroundMusic();
}

async function playBackgroundMusic() {
  if (!elements.bgmPlayer.src) return;

  try {
    await elements.bgmPlayer.play();
    bgmUnlockBound = false;
  } catch {
    bindBackgroundMusicUnlock();
  }
}

function bindBackgroundMusicUnlock() {
  if (bgmUnlockBound) return;
  bgmUnlockBound = true;

  const unlock = () => {
    if (!splashFinished) return;
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
    bgmUnlockBound = false;
    playBackgroundMusic();
  };

  document.addEventListener("pointerdown", unlock);
  document.addEventListener("keydown", unlock);
}

async function clearVibes() {
  if (!requireManageAccess()) return;
  if (!confirm(state.sharedData ? "确定清空当前界面的共享留言吗？" : "确定清空当前界面的本地留言吗？这个操作只会影响本机。")) return;
  const activeTheme = state.settings.activeTheme;
  if (state.sharedData) {
    try {
      state.vibes = await apiRequest(`/vibes?theme=${encodeURIComponent(activeTheme)}`, {
        method: "DELETE"
      });
    } catch {
      showToast("清空失败，请稍后再试。");
      return;
    }
  } else {
    state.vibes = state.vibes.filter((vibe) => vibe.theme !== activeTheme);
    saveVibes();
  }
  state.settings.clearedThemes[activeTheme] = true;
  saveSettings();
  renderFeed();
  showToast(state.sharedData ? "当前界面的共享留言已清空。" : "当前界面的本地留言已清空。");
}

function drawMoodCanvas() {
  const canvas = elements.canvas;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);

  const good = state.settings.activeTheme === "good";
  ctx.globalAlpha = good ? 0.18 : 0.28;
  ctx.strokeStyle = good ? "#2e6b4e" : "#11100e";
  ctx.lineWidth = good ? 1.5 : 2.5;

  const count = state.settings.reducedMotion ? 26 : 58;
  for (let index = 0; index < count; index += 1) {
    const x = random(index * 11) * width;
    const y = random(index * 17) * height;
    const length = 28 + random(index * 23) * (good ? 76 : 120);
    const angle = random(index * 29) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  ctx.globalAlpha = good ? 0.12 : 0.18;
  ctx.fillStyle = good ? "#f7f0d9" : "#ebe3d0";
  for (let index = 0; index < 420; index += 1) {
    const x = random(index * 37) * width;
    const y = random(index * 41) * height;
    ctx.fillRect(x, y, 1, 1);
  }
}

function random(seed) {
  const x = Math.sin(seed + 9.37) * 10000;
  return x - Math.floor(x);
}

async function loadSession() {
  try {
    const session = await apiRequest("/session");
    state.sharedData = true;
    return session;
  } catch {
    state.sharedData = false;
    return getEmptySession();
  }
}

async function reloadSharedVibes() {
  if (!state.sharedData) return;
  state.vibes = await apiRequest("/vibes");
  await renderFeed();
}

async function apiRequest(path, options = {}) {
  const fetchOptions = {
    method: options.method || "GET",
    credentials: "same-origin",
    headers: {}
  };

  if (options.body !== undefined) {
    fetchOptions.headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, fetchOptions);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      state.session = getEmptySession();
      updateAuthUi();
    }
    throw new Error(data.error || "api_error");
  }
  return data;
}

function getEmptySession() {
  return { authenticated: false, canManage: false, role: null, user: null };
}

function replaceVibe(updatedVibe) {
  state.vibes = state.vibes.map((item) => item.id === updatedVibe.id ? updatedVibe : item);
}

function saveVibes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.vibes));
}

async function loadVibes() {
  try {
    const vibes = await apiRequest("/vibes");
    state.sharedData = true;
    return vibes;
  } catch {
    state.sharedData = false;
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function fileToAttachment(file, type) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve({ url: reader.result, type });
    reader.readAsDataURL(file);
  });
}

function saveMedia(file, type) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const id = crypto.randomUUID();
      const tx = request.result.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put({
        id,
        type,
        name: file.name,
        mime: file.type,
        blob: file
      });
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    };
  });
}

function getMedia(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE, { keyPath: "id" });
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const tx = request.result.transaction(DB_STORE, "readonly");
      const getRequest = tx.objectStore(DB_STORE).get(id);
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => resolve(null);
    };
  });
}

function inferLinkType(url) {
  const lower = url.toLowerCase();
  if (lower.startsWith("data:image/")) return "image";
  if (lower.startsWith("data:audio/")) return "audio";
  if (/\.(png|jpe?g|gif|webp|avif)(\?|#|$)/.test(lower)) return "image";
  if (/\.(mp3|wav|ogg|m4a|flac)(\?|#|$)/.test(lower)) return "audio";
  return "link";
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatFileSize(bytes) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 3000);
}

function toSymbolCount(count) {
  if (count <= 0) return "0";
  if (count <= 5) return "•".repeat(count);
  return `•×${count}`;
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function seedVibes() {
  return [
    {
      id: crypto.randomUUID(),
      theme: "bad",
      category: "迷茫",
      body: "今天像一张被揉皱的纸，很多线都看不清。",
      author: "匿名",
      createdAt: new Date().toISOString(),
      mediaIds: [],
      linkAttachments: [],
      noteColor: "fog",
      autoReply: AUTO_REPLIES.bad["迷茫"],
      reactions: { "我听见了": 2, "抱一下": 1, "一起撑住": 1 },
      replies: [{ id: crypto.randomUUID(), author: "路过的人", body: "先不用把线理直，能说出来就很好。", createdAt: new Date().toISOString() }]
    },
    {
      id: crypto.randomUUID(),
      theme: "good",
      category: "希望",
      body: "傍晚的时候突然觉得，明天也许会比今天轻一点。",
      author: "匿名",
      createdAt: new Date().toISOString(),
      mediaIds: [],
      linkAttachments: [],
      noteColor: "green",
      autoReply: AUTO_REPLIES.good["希望"],
      reactions: { "接住光": 3, "为你开心": 1, "继续发亮": 2 },
      replies: []
    }
  ];
}

function restoreMissingSeedVibes() {
  const seeds = seedVibes();
  let changed = false;

  for (const theme of Object.keys(THEMES)) {
    const hasThemeVibe = state.vibes.some((vibe) => vibe.theme === theme);
    const wasIntentionallyCleared = state.settings.clearedThemes?.[theme];
    if (!hasThemeVibe && !wasIntentionallyCleared) {
      const seed = seeds.find((vibe) => vibe.theme === theme);
      if (seed) {
        state.vibes.push(seed);
        changed = true;
      }
    }
  }

  if (changed) saveVibes();
}
