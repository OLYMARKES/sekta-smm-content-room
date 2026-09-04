(() => {
const ALL_FONTS = window.CYRILLIC_FONT_DATA || [];
const MEDIA_LIBRARY = window.OLYMARKES_MEDIA_LIBRARY || { total: 0, categories: [], photos: [] };
const STORAGE_KEY = "olymarkes-cyrillic-font-taste-v1";
const COVER_STORAGE_KEY = "olymarkes-cover-builder-v1";
const CASE_STORAGE_KEY = "olymarkes-type-case-mode-v1";
const PREFERRED_PHOTO_ID = "карусель много крутых/0BF49366-1FDD-4DB2-9844-BEE3895EFB78.JPG";
const DEFAULT_SAMPLE = "Мне важно жить свою жизнь";
const COVER_CAPTION = "Почему чужие ожидания незаметно становятся нашим планом на жизнь";
const $ = id => document.getElementById(id);
const loadedFonts = new Set(["Onest", "Manrope", "Golos Text", "Geologica", "Commissioner", "Unbounded", "Literata", "Prata", "Cormorant", "Shantell Sans"]);
const storageSnapshots = new Map();
const storageFailures = new Map();
let votes = loadVotes();
let coverSettings = loadCoverSettings();
let caseMode = loadCaseMode();
let customPhoto = null;
let mediaLastFocus = null;
let stateFilter = "all";
let currentView = "grid";
let currentList = [];
let focusIndex = 0;
let shuffledOrder = null;
let resetArmed = false;

function showStorageNotice() {
  const notice = $("storageNotice");
  notice.hidden = storageFailures.size === 0;
  notice.textContent = storageFailures.size
    ? "Изменения в этой вкладке могут не сохраниться. " + [...new Set(storageFailures.values())].join(" ") + " Экспортируйте оценки перед закрытием."
    : "";
}

function readStored(key, fallback, json = true) {
  try {
    const raw = localStorage.getItem(key);
    storageSnapshots.set(key, raw);
    return raw === null ? fallback : json ? JSON.parse(raw) : raw;
  } catch {
    storageFailures.set(key, "Сохранённые данные недоступны или повреждены; запись приостановлена.");
    showStorageNotice();
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    if (storageFailures.has(key)) { showStorageNotice(); return false; }
    if (localStorage.getItem(key) !== storageSnapshots.get(key)) {
      storageFailures.set(key, "Данные изменились в другой вкладке. Перезагрузите страницу перед сохранением.");
      showStorageNotice();
      return false;
    }
    localStorage.setItem(key, value);
    storageSnapshots.set(key, value);
    return true;
  } catch {
    storageFailures.set(key, "Хранилище недоступно или заполнено.");
    showStorageNotice();
    return false;
  }
}

function loadVotes() {
  try {
    const stored = readStored(STORAGE_KEY, {});
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) throw new Error("Invalid votes");
    const migrated = {};
    Object.entries(stored).forEach(([key, value]) => {
      if (key.endsWith("|lower") || key.endsWith("|upper")) migrated[key] = value;
      else { migrated[`${key}|lower`] = value; migrated[`${key}|upper`] = value; }
    });
    // Opening the page must not rewrite the user's stored votes.
    return migrated;
  }
  catch {
    storageFailures.set(STORAGE_KEY, "Оценки повреждены; сохранённая копия не перезаписана.");
    showStorageNotice();
    return {};
  }
}
function saveVotes() { return writeStored(STORAGE_KEY, JSON.stringify(votes)); }
function loadCaseMode() {
  const saved = readStored(CASE_STORAGE_KEY, "both", false);
  return ["lower", "upper", "both"].includes(saved) ? saved : "both";
}
function applyCaseMode() {
  document.documentElement.dataset.caseMode = caseMode;
  document.querySelectorAll(".case-button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.caseMode === caseMode)));
  writeStored(CASE_STORAGE_KEY, caseMode);
}
function validHex(value, fallback) { return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : fallback; }
function hexToRgba(hex, opacity) {
  const value = validHex(hex, "#171815").slice(1);
  const [red, green, blue] = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
  return `rgba(${red}, ${green}, ${blue}, ${Math.min(1, Math.max(0, opacity))})`;
}
function relativeLuminance(hex) {
  const value = validHex(hex, "#171815").slice(1);
  const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255).map(channel => channel <= .04045 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4));
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}
function contrastRatio(first, second) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + .05) / (luminances[1] + .05);
}
function updateContrastStatus() {
  const status = $("contrastStatus");
  if (!status) return;
  if (coverSettings.backdrop === "none") {
    status.dataset.level = "neutral";
    status.textContent = "Фото меняется — проверь мелкую сетку";
    return;
  }
  const ratio = contrastRatio(coverSettings.textColor, coverSettings.surfaceColor);
  const approximate = coverSettings.backdrop === "scrim" || (coverSettings.backdrop === "plate" && coverSettings.surfaceOpacity < 100);
  if (ratio >= 4.5) {
    status.dataset.level = "good";
    status.textContent = `Контраст ${ratio.toFixed(1)}:1 · ${approximate ? "предварительно читается" : "читается"}`;
  } else if (ratio >= 3) {
    status.dataset.level = "warn";
    status.textContent = `Контраст ${ratio.toFixed(1)}:1 · на границе${approximate ? " до фото" : ""}`;
  } else {
    status.dataset.level = "bad";
    status.textContent = `Контраст ${ratio.toFixed(1)}:1 · слабый — поменяй цвета`;
  }
}
function loadCoverSettings() {
  const fallbackId = MEDIA_LIBRARY.photos.some(photo => photo.id === PREFERRED_PHOTO_ID) ? PREFERRED_PHOTO_ID : MEDIA_LIBRARY.photos[0]?.id || "";
  try {
    const saved = readStored(COVER_STORAGE_KEY, {}) || {};
    return {
      photoId: MEDIA_LIBRARY.photos.some(photo => photo.id === saved.photoId) ? saved.photoId : fallbackId,
      y: Number.isFinite(Number(saved.y)) ? Math.min(100, Math.max(0, Number(saved.y))) : 50,
      textColor: validHex(saved.textColor, saved.tone === "dark" ? "#171815" : "#ffffff"),
      surfaceColor: validHex(saved.surfaceColor, "#171815"),
      backdrop: ["none", "scrim", "plate", "solid"].includes(saved.backdrop) ? saved.backdrop : "none",
      surfaceOpacity: Number.isFinite(Number(saved.surfaceOpacity)) ? Math.min(100, Math.max(20, Number(saved.surfaceOpacity))) : 82,
      titleSize: Number.isFinite(Number(saved.titleSize)) ? Math.min(135, Math.max(75, Number(saved.titleSize))) : 100,
      titlePlacement: ["top", "middle", "bottom"].includes(saved.titlePlacement) ? saved.titlePlacement : "top",
      titleAlign: ["left", "center", "right"].includes(saved.titleAlign) ? saved.titleAlign : "left"
    };
  } catch { return { photoId: fallbackId, y: 50, textColor: "#ffffff", surfaceColor: "#171815", backdrop: "none", surfaceOpacity: 82, titleSize: 100, titlePlacement: "top", titleAlign: "left" }; }
}
function saveCoverSettings() {
  if (customPhoto && coverSettings.photoId === customPhoto.id) return;
  writeStored(COVER_STORAGE_KEY, JSON.stringify(coverSettings));
}
function activePhoto() {
  if (customPhoto && coverSettings.photoId === customPhoto.id) return customPhoto;
  return MEDIA_LIBRARY.photos.find(photo => photo.id === coverSettings.photoId) || MEDIA_LIBRARY.photos[0] || null;
}
function applyCoverSettings() {
  const photo = activePhoto();
  const root = document.documentElement;
  root.style.setProperty("--cover-image", photo ? `url("${String(photo.src).replace(/"/g, "%22")}")` : "none");
  root.style.setProperty("--cover-y", `${coverSettings.y}%`);
  root.style.setProperty("--cover-surface", coverSettings.surfaceColor);
  root.style.setProperty("--surface-alpha", hexToRgba(coverSettings.surfaceColor, coverSettings.surfaceOpacity / 100));
  root.style.setProperty("--headline-color", coverSettings.textColor);
  root.style.setProperty("--headline-size-lower", `${(11.1 * coverSettings.titleSize / 100).toFixed(2)}cqw`);
  root.style.setProperty("--headline-size-upper", `${(9.35 * coverSettings.titleSize / 100).toFixed(2)}cqw`);
  root.dataset.backdrop = coverSettings.backdrop;
  root.dataset.titlePlacement = coverSettings.titlePlacement;
  root.dataset.titleAlign = coverSettings.titleAlign;
  $("cropRange").value = String(coverSettings.y);
  $("titleSizeRange").value = String(coverSettings.titleSize);
  $("titleSizeValue").textContent = `${coverSettings.titleSize}%`;
  $("surfaceOpacity").value = String(coverSettings.surfaceOpacity);
  $("surfaceOpacityValue").textContent = `${coverSettings.surfaceOpacity}%`;
  $("customTextColor").value = coverSettings.textColor;
  $("customSurfaceColor").value = coverSettings.surfaceColor;
  $("selectedPhotoName").textContent = photo?.name || "Медиатека не найдена";
  $("selectedPhotoCategory").textContent = photo?.category || "Запусти обновление медиатеки";
  $("mediaCount").textContent = MEDIA_LIBRARY.total;
  $("mediaTotalLabel").textContent = MEDIA_LIBRARY.total;
  document.querySelectorAll("[data-backdrop]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.backdrop === coverSettings.backdrop)));
  document.querySelectorAll("[data-title-placement]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.titlePlacement === coverSettings.titlePlacement)));
  document.querySelectorAll("[data-title-align]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.titleAlign === coverSettings.titleAlign)));
  document.querySelectorAll("[data-text-color]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.textColor === coverSettings.textColor)));
  document.querySelectorAll("[data-surface-color]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.surfaceColor === coverSettings.surfaceColor)));
  document.querySelectorAll(".media-item").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.photoId === coverSettings.photoId)));
  updateContrastStatus();
}
function filteredMedia() {
  const query = $("mediaSearch").value.trim().toLocaleLowerCase("ru");
  const category = $("mediaCategory").value;
  return MEDIA_LIBRARY.photos.filter(photo => {
    if (category !== "all" && photo.category !== category) return false;
    return !query || `${photo.name} ${photo.category} ${photo.id}`.toLocaleLowerCase("ru").includes(query);
  });
}
function renderMediaGrid() {
  const photos = filteredMedia();
  $("mediaResultCount").textContent = `Показано ${photos.length} из ${MEDIA_LIBRARY.total}`;
  $("mediaEmpty").hidden = photos.length > 0;
  $("mediaGrid").innerHTML = photos.map(photo => `<button class="media-item" type="button" data-photo-id="${escapeAttr(photo.id)}" aria-pressed="${photo.id === coverSettings.photoId}" title="${escapeAttr(photo.category)} — ${escapeAttr(photo.name)}"><img src="${escapeAttr(photo.src)}" alt="" loading="lazy" decoding="async"><span>${escapeHtml(photo.name)}</span></button>`).join("");
}
function openMedia() {
  mediaLastFocus = document.activeElement;
  renderMediaGrid();
  $("mediaModal").hidden = false;
  document.body.style.overflow = "hidden";
  $("mediaSearch").focus();
}
function closeMedia() {
  $("mediaModal").hidden = true;
  document.body.style.overflow = "";
  mediaLastFocus?.focus();
}
function sampleText() { return $("sampleInput").value.trim() || DEFAULT_SAMPLE; }
function caseText(kind) { return kind === "upper" ? sampleText().toLocaleUpperCase("ru-RU") : sampleText().toLocaleLowerCase("ru-RU"); }
function previewWeight(font) {
  if ((font.category === "Display" || font.category === "Sans Serif") && font.weights.includes(700)) return 700;
  return font.weights.includes(400) ? 400 : font.weights[0];
}
function companionFont(font) {
  if (font.family === "Onest") return "Literata";
  if (font.category === "Sans Serif" || font.category === "Monospace") return "Literata";
  return "Onest";
}
function pairLabel(font) { return `${font.family} × ${companionFont(font)}`; }
function caseLabel(kind) { return kind === "upper" ? "КАПС" : "строчные"; }
function voteKey(family, kind) { return `${family}|${kind}`; }
function voteFor(family, kind) { return votes[voteKey(family, kind)] || ""; }
function activeCases() { return caseMode === "both" ? ["lower", "upper"] : [caseMode]; }
function matchesState(family, kind) { const vote = voteFor(family, kind); return stateFilter === "all" || (stateFilter === "unseen" ? !vote : vote === stateFilter); }
function familyUrl(font) {
  const family = encodeURIComponent(font.family).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${previewWeight(font)}&display=swap`;
}
function ensureFont(font, target) {
  if (loadedFonts.has(font.family)) {
    target.dataset.fontStatus = "ready";
    return;
  }
  loadedFonts.add(font.family);
  target.dataset.fontStatus = "loading";
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = familyUrl(font);
  link.onload = () => { target.dataset.fontStatus = "ready"; };
  link.onerror = () => { target.dataset.fontStatus = "error"; };
  document.head.append(link);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const card = entry.target;
    const font = ALL_FONTS.find(item => item.family === card.dataset.family);
    if (font) ensureFont(font, card);
    observer.unobserve(card);
  });
}, { rootMargin: "500px 0px" });

function filteredFonts() {
  const query = $("searchInput").value.trim().toLocaleLowerCase("ru");
  const category = $("categorySelect").value;
  let result = ALL_FONTS.filter(font => {
    if (category !== "all" && font.category !== category) return false;
    if (query && !`${font.family} ${font.designer}`.toLocaleLowerCase("ru").includes(query)) return false;
    return activeCases().some(kind => matchesState(font.family, kind));
  });
  if (shuffledOrder) {
    const rank = new Map(shuffledOrder.map((name, index) => [name, index]));
    result.sort((a, b) => rank.get(a.family) - rank.get(b.family));
  } else {
    const sort = $("sortSelect").value;
    if (sort === "popular") result.sort((a, b) => a.popularity - b.popularity);
    if (sort === "newest") result.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    if (sort === "az") result.sort((a, b) => a.family.localeCompare(b.family, "ru"));
  }
  return result;
}

function cardMarkup(font) {
  const weight = previewWeight(font);
  const companion = companionFont(font);
  const candidate = kind => {
    const vote = voteFor(font.family, kind);
    if (!matchesState(font.family, kind) || !activeCases().includes(kind)) return "";
    return `<div class="case-candidate" data-case="${kind}" data-state="${vote}">
      <div class="cover-preview" data-case="${kind}">
        <span class="cover-kicker">Личный опыт</span><span class="cover-number">01 / 10</span><span class="case-badge">${caseLabel(kind)}</span>
        <div class="font-sample" data-case="${kind}" style="font-family:'${escapeAttr(font.family)}',sans-serif;font-weight:${weight}">${escapeHtml(caseText(kind))}</div>
        <p class="cover-caption" style="font-family:'${escapeAttr(companion)}',serif">${COVER_CAPTION}</p>
        <span class="cover-pair">${escapeHtml(font.family)}<br>× ${escapeHtml(companion)}</span>
      </div>
      <div class="card-actions" aria-label="Оценить ${kind === "upper" ? "капсовый" : "строчный"} кадр">
        <button class="vote" data-vote="no" type="button" aria-pressed="${vote === "no"}">Не моё</button>
        <button class="vote" data-vote="maybe" type="button" aria-pressed="${vote === "maybe"}">Возможно</button>
        <button class="vote" data-vote="like" type="button" aria-pressed="${vote === "like"}">Нравится</button>
      </div>
    </div>`;
  };
  return `<article class="font-card" data-family="${escapeHtml(font.family)}">
    <div class="card-head"><strong>${escapeHtml(pairLabel(font))}</strong><span>${font.category}${font.cyrillicExt ? " · Cyr+" : ""}</span></div>
    <div class="cover-variants">${candidate("lower")}${candidate("upper")}</div>
  </article>`;
}

function visibleFrameCount(fonts = currentList) { return fonts.reduce((total, font) => total + activeCases().filter(kind => matchesState(font.family, kind)).length, 0); }
function updateResultLabel() { $("resultLabel").textContent = `Показано ${visibleFrameCount(filteredFonts())} из ${ALL_FONTS.length * activeCases().length} кадров`; }

function renderGrid() {
  currentList = filteredFonts();
  updateResultLabel();
  observer.disconnect();
  $("fontGrid").innerHTML = currentList.map(cardMarkup).join("");
  $("emptyState").hidden = currentList.length > 0;
  $("fontGrid").querySelectorAll(".font-card").forEach(card => observer.observe(card));
  if (focusIndex >= currentList.length) focusIndex = Math.max(0, currentList.length - 1);
  renderFocus();
}

function renderFocus() {
  if (!currentList.length) {
    $("focusCard").hidden = true;
    return;
  }
  $("focusCard").hidden = false;
  const font = currentList[focusIndex];
  const companion = companionFont(font);
  $("focusName").textContent = pairLabel(font);
  $("focusMeta").textContent = `${font.category} · заголовок ${previewWeight(font)} · подпись ${companion} 400`;
  $("focusPosition").textContent = `${focusIndex + 1} / ${currentList.length}`;
  [["focusSampleLower", "lower"], ["focusSampleUpper", "upper"]].forEach(([id, kind]) => {
    $(id).textContent = caseText(kind);
    $(id).style.fontFamily = `'${font.family}', sans-serif`;
    $(id).style.fontWeight = previewWeight(font);
  });
  document.querySelectorAll(".focus-caption").forEach(node => { node.textContent = COVER_CAPTION; node.style.fontFamily = `'${companion}', serif`; });
  document.querySelectorAll(".focus-pair").forEach(node => node.textContent = pairLabel(font));
  $("focusCard").dataset.family = font.family;
  $("focusCard").querySelectorAll(".focus-candidate").forEach(candidate => {
    const kind = candidate.dataset.case;
    const vote = voteFor(font.family, kind);
    candidate.dataset.state = vote;
    candidate.querySelectorAll(".focus-vote").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.vote === vote)));
  });
  ensureFont(font, $("focusCard"));
}

function setVote(family, kind, nextVote) {
  const key = voteKey(family, kind);
  if (votes[key] === nextVote) delete votes[key];
  else votes[key] = nextVote;
  saveVotes();
  const card = [...document.querySelectorAll(".font-card")].find(item => item.dataset.family === family);
  if (card) {
    const candidate = card.querySelector(`.case-candidate[data-case="${kind}"]`);
    const vote = voteFor(family, kind);
    if (candidate) {
      candidate.dataset.state = vote;
      candidate.querySelectorAll(".vote").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.vote === vote)));
      if (stateFilter !== "all" && !matchesState(family, kind)) candidate.remove();
    }
    if (!card.querySelector(".case-candidate")) card.remove();
  }
  updateTaste();
  renderFocus();
  updateResultLabel();
}

function updateTaste() {
  const entries = Object.entries(votes);
  const liked = entries.filter(([, value]) => value === "like").map(([key]) => key).sort((a,b) => a.localeCompare(b, "ru"));
  const maybe = entries.filter(([, value]) => value === "maybe").length;
  const no = entries.filter(([, value]) => value === "no").length;
  $("reviewedTop").textContent = entries.length;
  $("likedTop").textContent = liked.length;
  $("panelLike").textContent = liked.length;
  $("panelMaybe").textContent = maybe;
  $("panelReviewed").textContent = entries.length;
  $("countAll").textContent = ALL_FONTS.length * 2;
  $("countLike").textContent = liked.length;
  $("countMaybe").textContent = maybe;
  $("countNo").textContent = no;
  $("countUnseen").textContent = ALL_FONTS.length * 2 - entries.length;
  $("likedList").innerHTML = liked.length
    ? liked.map(key => { const split = key.lastIndexOf("|"); const family = key.slice(0, split); const kind = key.slice(split + 1); const font = ALL_FONTS.find(item => item.family === family); const label = `${font ? pairLabel(font) : family} · ${caseLabel(kind)}`; return `<div class="liked-chip"><span>${escapeHtml(label)}</span><button type="button" data-remove-like="${escapeAttr(key)}" aria-label="Убрать ${escapeAttr(label)} из любимых">×</button></div>`; }).join("")
    : `<div class="taste-empty">Здесь появятся кадры, которые ты отметишь как «Нравится».</div>`;
  $("copyFavorites").disabled = liked.length === 0;
  $("sendToMontage").disabled = false;
  $("sendToMontage").textContent = `Открыть Типографику в SMM · ${liked.length} отмечено`;
}

function setView(view) {
  currentView = view;
  document.querySelectorAll(".view-button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
  $("gridView").hidden = view !== "grid";
  $("focusView").hidden = view !== "focus";
  renderFocus();
}

function shuffle() {
  const names = ALL_FONTS.map(font => font.family);
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  shuffledOrder = names;
  renderGrid();
}

function exportProfile() {
  const profile = {
    exportedAt: new Date().toISOString(), sourceFamilies: ALL_FONTS.length, sample: sampleText(), caseMode,
    likedFrames: Object.keys(votes).filter(key => votes[key] === "like").sort(),
    maybeFrames: Object.keys(votes).filter(key => votes[key] === "maybe").sort(),
    notForMeFrames: Object.keys(votes).filter(key => votes[key] === "no").sort()
  };
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "olymarkes-cyrillic-font-taste.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function readTransferJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function sendTasteToMontage(event) {
  const button = event.currentTarget;
  const montageBase = ["127.0.0.1", "localhost"].includes(location.hostname) ? `${location.origin}/` : "https://olymarkes.github.io/sekta-smm-content-room/";
  button.textContent = "Открываю полный раздел…";
  window.top.location.assign(`${montageBase}#typography`);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
  }
  const buffer = document.createElement("textarea");
  buffer.value = text; buffer.setAttribute("readonly", ""); buffer.style.position = "fixed"; buffer.style.left = "-9999px";
  document.body.append(buffer); buffer.select(); const copied = document.execCommand("copy"); buffer.remove(); return copied;
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]); }
function escapeAttr(value) { return escapeHtml(value); }

$("mediaCategory").innerHTML += MEDIA_LIBRARY.categories.map(category => `<option value="${escapeAttr(category)}">${escapeHtml(category)}</option>`).join("");
$("openMediaButton").addEventListener("click", openMedia);
$("closeMediaButton").addEventListener("click", closeMedia);
$("mediaModal").addEventListener("click", event => { if (event.target === $("mediaModal")) closeMedia(); });
$("mediaSearch").addEventListener("input", renderMediaGrid);
$("mediaCategory").addEventListener("input", renderMediaGrid);
$("mediaGrid").addEventListener("click", event => {
  const button = event.target.closest(".media-item");
  if (!button) return;
  coverSettings.photoId = button.dataset.photoId;
  if (customPhoto?.src?.startsWith("blob:")) URL.revokeObjectURL(customPhoto.src);
  customPhoto = null;
  saveCoverSettings();
  applyCoverSettings();
  closeMedia();
});
$("customPhotoInput").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 20 * 1024 * 1024) {
    alert("Выберите JPEG, PNG или WebP до 20 МБ.");
    event.target.value = "";
    return;
  }
  if (customPhoto?.src?.startsWith("blob:")) URL.revokeObjectURL(customPhoto.src);
  customPhoto = { id: `custom:${file.name}:${file.lastModified}`, name: file.name.replace(/\.[^.]+$/, ""), category: "С компьютера", src: URL.createObjectURL(file) };
  coverSettings.photoId = customPhoto.id;
  applyCoverSettings();
  closeMedia();
  event.target.value = "";
});
$("cropRange").addEventListener("input", event => {
  coverSettings.y = Number(event.currentTarget.value);
  applyCoverSettings();
  saveCoverSettings();
});
$("titleSizeRange").addEventListener("input", event => { coverSettings.titleSize = Number(event.currentTarget.value); applyCoverSettings(); saveCoverSettings(); });
$("surfaceOpacity").addEventListener("input", event => { coverSettings.surfaceOpacity = Number(event.currentTarget.value); applyCoverSettings(); saveCoverSettings(); });
$("customTextColor").addEventListener("input", event => { coverSettings.textColor = validHex(event.currentTarget.value, "#ffffff"); applyCoverSettings(); saveCoverSettings(); });
$("customSurfaceColor").addEventListener("input", event => { coverSettings.surfaceColor = validHex(event.currentTarget.value, "#171815"); applyCoverSettings(); saveCoverSettings(); });
document.querySelectorAll("[data-backdrop]").forEach(button => button.addEventListener("click", () => { coverSettings.backdrop = button.dataset.backdrop; applyCoverSettings(); saveCoverSettings(); }));
document.querySelectorAll("[data-title-placement]").forEach(button => button.addEventListener("click", () => { coverSettings.titlePlacement = button.dataset.titlePlacement; applyCoverSettings(); saveCoverSettings(); }));
document.querySelectorAll("[data-title-align]").forEach(button => button.addEventListener("click", () => { coverSettings.titleAlign = button.dataset.titleAlign; applyCoverSettings(); saveCoverSettings(); }));
document.querySelectorAll("[data-text-color]").forEach(button => button.addEventListener("click", () => { coverSettings.textColor = button.dataset.textColor; applyCoverSettings(); saveCoverSettings(); }));
document.querySelectorAll("[data-surface-color]").forEach(button => button.addEventListener("click", () => { coverSettings.surfaceColor = button.dataset.surfaceColor; applyCoverSettings(); saveCoverSettings(); }));
document.querySelectorAll(".case-button").forEach(button => button.addEventListener("click", () => {
  caseMode = button.dataset.caseMode;
  applyCaseMode();
  focusIndex = 0;
  renderGrid();
}));

$("fontGrid").addEventListener("click", event => {
  const card = event.target.closest(".font-card");
  if (!card) return;
  const voteButton = event.target.closest(".vote");
  if (voteButton) { setVote(card.dataset.family, voteButton.closest(".case-candidate").dataset.case, voteButton.dataset.vote); return; }
  const index = currentList.findIndex(font => font.family === card.dataset.family);
  if (index >= 0) focusIndex = index;
  setView("focus");
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("likedList").addEventListener("click", event => { const button = event.target.closest("[data-remove-like]"); if (!button) return; const split = button.dataset.removeLike.lastIndexOf("|"); setVote(button.dataset.removeLike.slice(0, split), button.dataset.removeLike.slice(split + 1), "like"); });
document.querySelectorAll(".focus-vote").forEach(button => button.addEventListener("click", () => { const font = currentList[focusIndex]; const candidate = button.closest(".focus-candidate"); if (font && candidate) setVote(font.family, candidate.dataset.case, button.dataset.vote); }));
$("prevButton").addEventListener("click", () => { if (currentList.length) { focusIndex = (focusIndex - 1 + currentList.length) % currentList.length; renderFocus(); } });
$("nextButton").addEventListener("click", () => { if (currentList.length) { focusIndex = (focusIndex + 1) % currentList.length; renderFocus(); } });
document.querySelectorAll(".view-button").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
document.querySelectorAll(".state-tab").forEach(button => button.addEventListener("click", () => {
  stateFilter = button.dataset.filter;
  document.querySelectorAll(".state-tab").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  focusIndex = 0; renderGrid();
}));
["searchInput", "categorySelect", "sortSelect"].forEach(id => $(id).addEventListener("input", () => { shuffledOrder = null; focusIndex = 0; renderGrid(); }));
$("sampleInput").addEventListener("input", () => {
  document.querySelectorAll(".font-sample").forEach(node => node.textContent = caseText(node.dataset.case || "lower"));
});
$("shuffleButton").addEventListener("click", shuffle);
$("copyFavorites").addEventListener("click", async event => {
  const names = Object.keys(votes).filter(key => votes[key] === "like").map(key => { const split = key.lastIndexOf("|"); const family = key.slice(0, split); const kind = key.slice(split + 1); const font = ALL_FONTS.find(item => item.family === family); return `${font ? pairLabel(font) : family} · ${caseLabel(kind)}`; }).sort((a,b) => a.localeCompare(b,"ru"));
  const button = event.currentTarget; const copied = await copyText(names.join("\n"));
  button.textContent = copied ? "Список скопирован" : "Не удалось скопировать";
  setTimeout(() => button.textContent = "Скопировать любимые", 1500);
});
$("exportProfile").addEventListener("click", exportProfile);
$("sendToMontage").addEventListener("click", sendTasteToMontage);
window.addEventListener("focus", updateTaste);
$("resetVotes").addEventListener("click", event => {
  const button = event.currentTarget;
  if (!resetArmed) {
    resetArmed = true; button.textContent = "Нажми ещё раз для сброса";
    setTimeout(() => { resetArmed = false; button.textContent = "Сбросить оценки"; }, 3000);
    return;
  }
  votes = {}; const saved = saveVotes(); resetArmed = false;
  button.textContent = saved ? "Оценки сброшены" : "Сброшены только в этой вкладке";
  updateTaste(); renderGrid();
  setTimeout(() => button.textContent = "Сбросить оценки", 1500);
});
document.addEventListener("keydown", event => {
  if (!$("mediaModal").hidden) {
    if (event.key === "Escape") closeMedia();
    return;
  }
  if (currentView !== "focus" || ["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) return;
  if (event.key === "ArrowLeft") $("prevButton").click();
  if (event.key === "ArrowRight") $("nextButton").click();
});

applyCoverSettings();
applyCaseMode();
updateTaste();
renderGrid();

})();
