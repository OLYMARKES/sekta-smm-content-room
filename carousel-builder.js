(() => {
  const config = window.SEKTA_CAROUSEL_BUILDER;
  const library = window.SEKTA_LIBRARY?.items || [];
  const currentGrid = window.SEKTA_CURRENT_GRID || [];
  if (!config?.topics?.length) return;

  const ui = {
    form: document.querySelector("#builderControls"),
    ideaStrip: document.querySelector("#builderIdeaStrip"),
    refreshIdeas: document.querySelector("#builderRefreshIdeas"),
    topic: document.querySelector("#builderTopic"),
    goal: document.querySelector("#builderGoal"),
    account: document.querySelector("#builderAccount"),
    tone: document.querySelector("#builderTone"),
    hook: document.querySelector("#builderHook"),
    subtitle: document.querySelector("#builderSubtitle"),
    workspace: document.querySelector("#builderWorkspace"),
    cover: document.querySelector("#builderCoverPreview"),
    coverImage: document.querySelector("#builderCoverImage"),
    coverAccount: document.querySelector("#builderCoverAccount"),
    coverHeadline: document.querySelector("#builderCoverHeadline"),
    coverPromise: document.querySelector("#builderCoverPromise"),
    coverStatus: document.querySelector("#builderCoverStatus"),
    gridFitting: document.querySelector("#builderGridFitting"),
    liveGrid: document.querySelector("#builderLiveGrid"),
    focusX: document.querySelector("#builderFocusX"),
    focusY: document.querySelector("#builderFocusY"),
    slides: document.querySelector("#builderSlides"),
    refreshScript: document.querySelector("#builderRefreshScript"),
    mediaGrid: document.querySelector("#builderMediaGrid"),
    mediaCount: document.querySelector("#builderMediaCount"),
    mediaShown: document.querySelector("#builderMediaShown"),
    mediaSearch: document.querySelector("#builderMediaSearch"),
    mediaFolder: document.querySelector("#builderMediaFolder"),
    showAllMedia: document.querySelector("#builderShowAllMedia"),
    shuffleMedia: document.querySelector("#builderShuffleMedia"),
    expandMedia: document.querySelector("#builderExpandMedia"),
    loadMoreMedia: document.querySelector("#builderLoadMoreMedia"),
    wordCount: document.querySelector("#builderWordCount"),
    status: document.querySelector("#builderStatus"),
    download: document.querySelector("#builderDownload"),
    addGrid: document.querySelector("#builderAddGrid"),
    copyScript: document.querySelector("#builderCopyScript"),
    tasteFont: document.querySelector("#builderTasteFont"),
    toStudio: document.querySelector("#builderToStudio"),
  };

  const extraHooks = {
    "return-after-pause": [
      "Вы не откатились назад. Вы просто сделали паузу",
      "Не догоняйте пропущенные тренировки",
      "Возвращение начинается не с наказания",
      "Что делать в первую тренировку после паузы",
    ],
    "home-counts": [
      "Тренировка без формы и свободного часа всё равно считается",
      "Почему 12 минут дома — не компромисс",
      "Минимальная тренировка, которую реально повторить",
      "Движение помещается даже в очень обычный день",
    ],
    "body-neutrality": [
      "Не любить отражение сегодня — не значит быть против себя",
      "Забота о теле не требует восторга",
      "Что делать, когда бодипозитив тоже давит",
      "Отношения с телом устойчивее ежедневной любви",
    ],
    "child-movement": [
      "Секция не подошла. С ребёнком всё в порядке",
      "Как отличить лень от неподходящего формата",
      "Ребёнку можно искать свой способ двигаться",
      "Три вещи важнее дисциплины в детском спорте",
    ],
    "community-effect": [
      "Иногда тренировка начинается с того, что вас ждут",
      "Почему рядом с людьми легче не исчезнуть",
      "Группа не мотивирует. Она помогает остаться",
      "Что на самом деле дают совместные занятия",
    ],
    "life-now": [
      "Ваша жизнь уже идёт — даже между отпусками",
      "Как сделать обычный день заметным",
      "Не ждите свободной недели, чтобы снова почувствовать жизнь",
      "Три способа перестать проживать вторник на автомате",
    ],
    "movement-without-result": [
      "Движение, после которого не нужно становиться лучше",
      "Попробуйте подвигаться и ничего не измерять",
      "Три минуты танца без пользы и отчёта",
      "Тело умеет играть, а не только выполнять программу",
    ],
    "small-anchors": [
      "Не собирайте идеальный день. Найдите три опоры",
      "Что остаётся, когда режим снова развалился",
      "Маленькая система для дней, которые идут не по плану",
      "Три действия, к которым можно вернуться в любой момент",
    ],
  };

  const styleLabels = { clean: "текст на фото", plate: "компактная плашка", rail: "вертикальная полоса", footer: "нижняя полоса" };
  const fontLabels = { tempo: "PT Sans Narrow · КАПС", grotesk: "гротеск", editorial: "редакционная", taste: "из примерочной" };
  const accentColors = { sky: "#bde9f6", green: "#63dda7", yellow: "#ffe36a", pink: "#ff8fbd" };
  const accentLabels = { sky: "голубой", green: "зелёный", yellow: "жёлтый", pink: "розовый" };
  const textColors = { white: "#ffffff", ink: "#17221f" };
  const folderLabels = new Map(library.map((item) => [item.folder, item.folderLabel]).filter(([id]) => id));

  let activeTopic = config.topics[0];
  let activeStyle = "plate";
  let activePlacement = "left";
  let activeFont = "tempo";
  let activeAccent = "sky";
  let activeTextColor = "auto";
  let activePreview = "grid";
  let tasteFont = null;
  let hookIndex = 0;
  let scriptVariant = 0;
  let selectedIdeaKey = "";
  let currentIdeas = [];
  let mediaScope = "relevant";
  let mediaLimit = 24;
  let mediaOrder = [...library];
  let mediaRandomized = false;
  let mediaPool = [];
  let selectedPhoto = null;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const plural = (number, one, few, many) => {
    const mod10 = number % 10;
    const mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
  };

  function shuffle(items) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [next[index], next[target]] = [next[target], next[index]];
    }
    return next;
  }

  function readLocalJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  }

  const coverSystemKey = "sekta-builder-cover-system-v2";
  function restoreCoverSystem() {
    const saved = readLocalJson(coverSystemKey, {});
    if (["clean", "plate", "rail", "footer"].includes(saved.style)) activeStyle = saved.style;
    if (["bottom", "middle", "left", "right"].includes(saved.placement)) activePlacement = saved.placement;
    if (["tempo", "grotesk", "editorial", "taste"].includes(saved.font) && (saved.font !== "taste" || tasteFont)) activeFont = saved.font;
    if (accentColors[saved.accent]) activeAccent = saved.accent;
    if (["auto", "ink", "white", "accent"].includes(saved.textColor)) activeTextColor = saved.textColor;
  }

  function saveCoverSystem() {
    localStorage.setItem(coverSystemKey, JSON.stringify({ style: activeStyle, placement: activePlacement, font: activeFont, accent: activeAccent, textColor: activeTextColor }));
  }

  function selectedTasteFont() {
    const layoutPrefs = readLocalJson("olymarkes-text-layout-prefs-v1", {});
    const pickerPrefs = readLocalJson("olymarkes-type-studio-picker-v1", {});
    const votes = readLocalJson("olymarkes-cyrillic-font-taste-v1", {});
    const choice = layoutPrefs.choice || pickerPrefs.choice || Object.keys(votes).find((key) => key.includes("|") && votes[key] === "like");
    if (!choice) return null;
    const [family, caseKind] = choice.split("|");
    return family && ["lower", "upper"].includes(caseKind) ? { family, caseKind } : null;
  }

  function ensureTasteFont(font) {
    if (!font || document.querySelector(`link[data-taste-font="${CSS.escape(font.family)}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.tasteFont = font.family;
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family).replace(/%20/g, "+")}:wght@700;800;900&display=swap`;
    document.head.append(link);
  }

  function refreshTasteFont(activate = false) {
    tasteFont = selectedTasteFont();
    ui.tasteFont.disabled = !tasteFont;
    ui.tasteFont.textContent = tasteFont ? `${tasteFont.family} · ${tasteFont.caseKind === "upper" ? "КАПС" : "строчные"}` : "Из примерочной";
    if (!tasteFont) return false;
    fontLabels.taste = tasteFont.family;
    ensureTasteFont(tasteFont);
    if (activate) activeFont = "taste";
    return true;
  }

  function setStatus(message) {
    ui.status.textContent = message;
  }

  function ideaPool() {
    return config.topics.flatMap((topic) => [...topic.hooks, ...(extraHooks[topic.id] || [])].map((hook, index) => ({
      key: `${topic.id}-${index}-${hook}`,
      topic,
      hook,
    })));
  }

  function refreshIdeas({ initial = false } = {}) {
    const previousKeys = new Set(currentIdeas.map((idea) => idea.key));
    const fresh = shuffle(ideaPool());
    const unseen = fresh.filter((idea) => !previousKeys.has(idea.key));
    currentIdeas = [...unseen, ...fresh].slice(0, 10);
    selectedIdeaKey = "";
    renderIdeaStrip();
    if (!initial) setStatus("Собраны ещё 10 идей. Выберите любую — хук сразу появится на обложке.");
  }

  function renderIdeaStrip() {
    ui.ideaStrip.innerHTML = currentIdeas.map((idea) => `<button type="button" class="builder-idea${idea.key === selectedIdeaKey ? " is-active" : ""}" data-builder-idea="${escapeHtml(idea.key)}"><span>${escapeHtml(idea.topic.label)}</span><strong>${escapeHtml(idea.hook)}</strong><small>${escapeHtml(idea.topic.promise)}</small></button>`).join("");
  }

  function selectIdea(key) {
    const idea = currentIdeas.find((item) => item.key === key);
    if (!idea) return;
    selectedIdeaKey = idea.key;
    activeTopic = idea.topic;
    hookIndex = [...activeTopic.hooks, ...(extraHooks[activeTopic.id] || [])].indexOf(idea.hook);
    scriptVariant = 0;
    ui.topic.value = activeTopic.id;
    ui.hook.value = idea.hook;
    ui.subtitle.value = subtitleForGoal();
    mediaScope = "relevant";
    mediaLimit = 24;
    mediaRandomized = false;
    renderIdeaStrip();
    renderMedia();
    renderCover();
    renderSlides();
    setStatus(`Идея «${activeTopic.label}» перенесена в обложку и сценарий.`);
  }

  function candidateScore(item) {
    const coverRole = item.carouselRoles?.includes("01_обложка_личное_присутствие") ? 2 : 0;
    const actionRole = activeTopic.theme === "03_тело_спорт_сила_изменения" && item.carouselRoles?.includes("02_действие_и_доказательство") ? 1.6 : 0;
    const portrait = item.orientation === "portrait" ? 1 : 0;
    const beforePhotoPenalty = item.sourceFolder === "тело ДО" && activeTopic.id !== "body-neutrality" ? -5 : 0;
    return coverRole + actionRole + portrait + beforePhotoPenalty + Number(item.agentScore || 0);
  }

  function currentMediaPool() {
    const query = ui.mediaSearch.value.trim().toLocaleLowerCase("ru");
    const folder = ui.mediaFolder.value;
    let pool = mediaScope === "relevant"
      ? mediaOrder.filter((item) => item.contentThemes?.includes(activeTopic.theme))
      : [...mediaOrder];
    if (mediaScope === "relevant" && pool.length < 16) pool = [...mediaOrder];
    if (folder !== "all") pool = pool.filter((item) => item.folder === folder);
    if (query) pool = pool.filter((item) => [item.fileName, item.folderLabel, item.sourceCategory, ...(item.contentThemes || []), ...(item.carouselRoles || [])].join(" ").toLocaleLowerCase("ru").includes(query));
    if (mediaScope === "relevant" && !mediaRandomized) pool.sort((a, b) => candidateScore(b) - candidateScore(a));
    return pool;
  }

  function renderMedia() {
    mediaPool = currentMediaPool();
    const visible = mediaPool.slice(0, mediaLimit);
    if (!selectedPhoto) selectedPhoto = visible[0] || library[0] || null;
    ui.mediaCount.textContent = mediaScope === "relevant"
      ? `${mediaPool.length} ${plural(mediaPool.length, "фото по теме", "фото по теме", "фото по теме")}`
      : `${mediaPool.length} ${plural(mediaPool.length, "фото в каталоге", "фото в каталоге", "фото в каталоге")}`;
    ui.mediaGrid.innerHTML = visible.length
      ? visible.map((item) => `<button type="button" class="builder-media${item.id === selectedPhoto?.id ? " is-selected" : ""}" data-builder-media="${escapeHtml(item.id)}" data-name="${escapeHtml(item.fileName)}" aria-label="Выбрать ${escapeHtml(item.fileName)}"><img src="${escapeHtml(item.thumb)}" alt="" loading="lazy"></button>`).join("")
      : `<div class="builder-media-empty"><strong>Ничего не найдено</strong><span>Сбросьте поиск или выберите другую коллекцию.</span></div>`;
    ui.mediaShown.textContent = `Показано ${visible.length} из ${mediaPool.length}`;
    ui.loadMoreMedia.hidden = visible.length >= mediaPool.length;
    ui.showAllMedia.textContent = mediaScope === "all" ? "Только по теме" : "Показать все";
    ui.showAllMedia.classList.toggle("is-active", mediaScope === "all");
  }

  function syncMediaSelection() {
    ui.mediaGrid.querySelectorAll("[data-builder-media]").forEach((button) => button.classList.toggle("is-selected", button.dataset.builderMedia === selectedPhoto?.id));
  }

  function subtitleForGoal() {
    const labels = { save: "10 слайдов · сохрани", comment: "10 слайдов · обсудим", warmth: "10 слайдов · отправь близким", class: "10 слайдов · выбери класс" };
    return labels[ui.goal.value] || labels.save;
  }

  function renderCover() {
    ui.cover.className = `builder-cover builder-cover-${activeStyle}`;
    ui.cover.dataset.placement = activePlacement;
    ui.cover.dataset.font = activeFont;
    ui.cover.dataset.accent = activeAccent;
    ui.cover.dataset.tasteCase = tasteFont?.caseKind || "lower";
    ui.cover.style.setProperty("--builder-headline-font", tasteFont ? `"${tasteFont.family}"` : '"Golos Text"');
    ui.cover.style.setProperty("--builder-accent", accentColors[activeAccent]);
    ui.cover.dataset.textColor = activeTextColor;
    ui.cover.style.setProperty("--focus-x", `${ui.focusX.value}%`);
    ui.cover.style.setProperty("--focus-y", `${ui.focusY.value}%`);
    ui.coverImage.src = selectedPhoto?.thumb || "";
    ui.coverHeadline.textContent = ui.hook.value;
    ui.coverPromise.textContent = ui.subtitle.value;
    ui.coverAccount.textContent = ui.account.value;
    ui.coverStatus.textContent = `#Sekta · ${styleLabels[activeStyle]} · ${accentLabels[activeAccent]}`;
    document.querySelectorAll("[data-builder-style]").forEach((button) => button.classList.toggle("is-active", button.dataset.builderStyle === activeStyle));
    document.querySelectorAll("[data-builder-placement]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.builderPlacement === activePlacement);
      button.disabled = activeStyle === "rail" || activeStyle === "footer";
      button.title = button.disabled ? "Положение задано выбранной композицией" : "";
    });
    document.querySelectorAll("[data-builder-font]").forEach((button) => button.classList.toggle("is-active", button.dataset.builderFont === activeFont));
    document.querySelectorAll("[data-builder-accent]").forEach((button) => button.classList.toggle("is-active", button.dataset.builderAccent === activeAccent));
    document.querySelectorAll("[data-builder-text-color]").forEach((button) => button.classList.toggle("is-active", button.dataset.builderTextColor === activeTextColor));
    renderGridFitting();
    saveCoverSystem();
  }

  function renderGridFitting() {
    if (!ui.liveGrid) return;
    const draft = `<div class="builder-grid-cell is-draft"><div class="builder-grid-draft builder-cover builder-cover-${activeStyle}" data-placement="${escapeHtml(activePlacement)}" data-font="${escapeHtml(activeFont)}" data-accent="${escapeHtml(activeAccent)}" data-taste-case="${escapeHtml(tasteFont?.caseKind || "lower")}" data-text-color="${escapeHtml(activeTextColor)}" style="--builder-accent:${accentColors[activeAccent]};--builder-headline-font:${tasteFont ? `'${escapeHtml(tasteFont.family)}'` : `'Golos Text'`};--focus-x:${ui.focusX.value}%;--focus-y:${ui.focusY.value}%"><img src="${escapeHtml(selectedPhoto?.thumb || "")}" alt=""><span class="builder-cover-account">${escapeHtml(ui.account.value)}</span><strong>${escapeHtml(ui.hook.value)}</strong><small>${escapeHtml(ui.subtitle.value)}</small></div><span class="builder-grid-new">NEW</span></div>`;
    const existing = currentGrid.slice(0, 8).map((item) => `<div class="builder-grid-cell"><img src="${escapeHtml(item.image)}" alt="" loading="lazy"><span class="builder-grid-kind">${item.pinned ? "◆" : item.type === "Reel" ? "▶" : "▣"}</span></div>`).join("");
    ui.liveGrid.innerHTML = draft + existing;
  }

  function setPreviewMode(mode) {
    activePreview = mode === "cover" ? "cover" : "grid";
    const showCover = activePreview === "cover";
    ui.cover.classList.toggle("is-preview-hidden", !showCover);
    ui.gridFitting.classList.toggle("is-preview-hidden", showCover);
    document.querySelectorAll("[data-builder-preview]").forEach((button) => {
      const selected = button.dataset.builderPreview === activePreview;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
  }

  function middleSlides() {
    if (scriptVariant === 1) return [
      { role: "Главная мысль", title: activeTopic.promise, body: "Сначала называем новый взгляд, затем показываем, почему старый сценарий не помогает." },
      ...activeTopic.slides.slice(1),
    ];
    if (scriptVariant === 2) return [
      { role: "Вопрос", title: activeTopic.hooks[1] || activeTopic.hooks[0], body: activeTopic.promise },
      ...activeTopic.slides.slice(0, 7),
    ];
    return activeTopic.slides;
  }

  function buildSlides() {
    const goal = config.goals[ui.goal.value] || config.goals.save;
    return [
      { role: "Обложка", title: ui.hook.value, body: activeTopic.promise },
      ...middleSlides(),
      { role: "CTA", title: goal.label, body: goal.cta },
    ];
  }

  function currentSlideMedia() {
    const pool = mediaPool.length ? mediaPool : currentMediaPool();
    return [selectedPhoto, pool[2], pool[5], pool[8]].filter(Boolean);
  }

  function renderSlides() {
    const slideMedia = currentSlideMedia();
    const photoSlots = new Map([[0, slideMedia[0]], [3, slideMedia[1]], [6, slideMedia[2]], [8, slideMedia[3]]]);
    ui.slides.innerHTML = buildSlides().map((slide, index) => {
      const photo = photoSlots.get(index);
      const visual = photo ? `<div class="builder-slide-visual"><img src="${escapeHtml(photo.thumb)}" alt=""></div>` : `<div class="builder-slide-visual is-text">ТЕКСТ</div>`;
      return `<article class="builder-slide" data-builder-slide="${index + 1}"><span class="builder-slide-number">${String(index + 1).padStart(2, "0")}</span><div class="builder-slide-copy"><span class="builder-slide-role">${escapeHtml(slide.role)}</span><strong contenteditable="true" spellcheck="true">${escapeHtml(slide.title)}</strong><p contenteditable="true" spellcheck="true">${escapeHtml(slide.body)}</p></div>${visual}</article>`;
    }).join("");
    updateWordCount();
  }

  function updateSlideVisuals() {
    const slideMedia = currentSlideMedia();
    [1, 4, 7, 9].forEach((number, index) => {
      const visual = ui.slides.querySelector(`[data-builder-slide="${number}"] .builder-slide-visual`);
      const photo = slideMedia[index];
      if (!visual || !photo) return;
      visual.classList.remove("is-text");
      visual.innerHTML = `<img src="${escapeHtml(photo.thumb)}" alt="">`;
    });
  }

  function updateWordCount() {
    const words = ui.slides.textContent.trim().split(/\s+/).filter(Boolean).length;
    ui.wordCount.textContent = `${words} ${plural(words, "слово", "слова", "слов")}`;
  }

  function syncCoverToSlide() {
    const first = ui.slides.querySelector('[data-builder-slide="1"] strong');
    if (first) first.textContent = ui.hook.value;
    renderCover();
    updateWordCount();
  }

  function generateConcept({ preserveHook = false } = {}) {
    activeTopic = config.topics.find((topic) => topic.id === ui.topic.value) || config.topics[0];
    const toneHook = { warm: 0, bold: 1, expert: 2 }[ui.tone.value] ?? 0;
    hookIndex = preserveHook ? hookIndex : toneHook % activeTopic.hooks.length;
    if (!preserveHook) ui.hook.value = activeTopic.hooks[hookIndex];
    ui.subtitle.value = subtitleForGoal();
    scriptVariant = 0;
    selectedIdeaKey = "";
    mediaScope = "relevant";
    mediaLimit = 24;
    mediaRandomized = false;
    renderIdeaStrip();
    renderMedia();
    renderCover();
    renderSlides();
    setStatus(`Концепт «${activeTopic.label}» обновлён: обложка, фотографии и сценарий синхронизированы.`);
  }

  function scriptText() {
    const rows = [...ui.slides.querySelectorAll(".builder-slide")];
    const slides = rows.map((row, index) => {
      const role = row.querySelector(".builder-slide-role")?.textContent.trim();
      const title = row.querySelector("strong")?.textContent.trim();
      const body = row.querySelector("p")?.textContent.trim();
      return `${String(index + 1).padStart(2, "0")} · ${role}\n${title}\n${body}`;
    }).join("\n\n");
    return `${activeTopic.label}\nАккаунт: ${ui.account.value}\nЦель: ${config.goals[ui.goal.value]?.label}\n\n${slides}`;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = location.protocol === "file:" && !/^https?:/.test(source)
        ? `https://olymarkes.github.io/sekta-smm-content-room/${source}`
        : source;
    });
  }

  function drawCoverImage(context, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) * (Number(ui.focusX.value) / 100);
    const sourceY = (image.naturalHeight - sourceHeight) * (Number(ui.focusY.value) / 100);
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function wrapLines(context, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }

  async function makeCoverCanvas(width = 1080, height = 1350) {
    if (!selectedPhoto) throw new Error("Нет выбранной фотографии");
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const image = await loadImage(selectedPhoto.thumb);
    const scale = width / 1080;
    if (activeFont === "tempo") {
      try { await document.fonts.load(`700 ${106 * scale}px "PT Sans Narrow"`); } catch {}
    }
    if (activeFont === "taste" && tasteFont) {
      try { await document.fonts.load(`800 ${96 * scale}px "${tasteFont.family}"`); } catch {}
    }
    drawCoverImage(context, image, 0, 0, width, height);

    const gradient = activeStyle === "clean"
      ? context.createLinearGradient(0, height * .36, 0, height)
      : context.createLinearGradient(0, height * .2, width * .7, height);
    gradient.addColorStop(0, "rgba(5,12,16,0)");
    gradient.addColorStop(1, activeStyle === "clean" ? "rgba(5,12,16,.34)" : "rgba(5,12,16,.18)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const isSide = activePlacement === "left" || activePlacement === "right";
    let maxWidth = width * (activeStyle === "rail" ? .34 : activeStyle === "footer" ? .82 : isSide ? .52 : .82);
    let fontSize = (activeFont === "tempo" ? 106 : activeFont === "editorial" ? 78 : activeFont === "grotesk" || activeFont === "taste" ? 86 : 96) * scale;
    const family = activeFont === "tempo" ? '"PT Sans Narrow", "Arial Narrow", sans-serif' : activeFont === "taste" && tasteFont ? `"${tasteFont.family}", sans-serif` : activeFont === "editorial" ? "Georgia, serif" : "Arial, sans-serif";
    const headline = activeFont === "tempo" ? ui.hook.value.toLocaleUpperCase("ru-RU") : activeFont === "taste" && tasteFont?.caseKind === "upper" ? ui.hook.value.toLocaleUpperCase("ru-RU") : activeFont === "taste" && tasteFont?.caseKind === "lower" ? ui.hook.value.toLocaleLowerCase("ru-RU") : ui.hook.value;
    const headlineWeight = activeFont === "tempo" || activeFont === "editorial" ? 700 : activeFont === "taste" ? 800 : 900;
    let lines = [];
    do {
      context.font = `${headlineWeight} ${fontSize}px ${family}`;
      lines = wrapLines(context, headline, maxWidth);
      if (lines.length > 5) fontSize -= 5 * scale;
    } while (lines.length > 5 && fontSize > 50 * scale);
    if (!lines.length) lines = [""];

    const lineHeight = fontSize * (activeFont === "tempo" ? .86 : activeFont === "editorial" ? 1.03 : activeFont === "taste" ? .96 : .93);
    const textBlockHeight = lines.length * lineHeight;
    const footerHeight = Math.max(height * .31, textBlockHeight + 150 * scale);
    const x = activeStyle === "rail" ? 48 * scale : activePlacement === "right" ? width - 58 * scale : activePlacement === "middle" ? width / 2 : 58 * scale;
    const startY = activeStyle === "rail"
      ? height / 2 - ((lines.length - 1) * lineHeight) / 2
      : activeStyle === "footer"
        ? height - footerHeight + 62 * scale + fontSize * .72
        : activePlacement === "middle"
          ? height / 2 - ((lines.length - 1) * lineHeight) / 2
          : height - textBlockHeight - 118 * scale;
    context.textAlign = activeStyle === "rail" || activeStyle === "footer" ? "left" : activePlacement === "right" ? "right" : activePlacement === "middle" ? "center" : "left";

    context.fillStyle = accentColors[activeAccent];
    if (activeStyle === "rail") context.fillRect(0, 0, width * .42, height);
    if (activeStyle === "footer") context.fillRect(0, height - footerHeight, width, footerHeight);
    if (activeStyle === "plate") {
      const measuredWidth = Math.max(...lines.map((line) => context.measureText(line).width));
      const plateWidth = Math.min(maxWidth, measuredWidth) + 48 * scale;
      const plateX = activePlacement === "right" ? x - plateWidth + 24 * scale : activePlacement === "middle" ? x - plateWidth / 2 : x - 24 * scale;
      context.fillRect(plateX, startY - fontSize * .8, plateWidth, textBlockHeight + 34 * scale);
    }

    const automaticColor = activeStyle === "clean" ? accentColors[activeAccent] : "#101a1e";
    const headlineColor = activeTextColor === "auto" ? automaticColor : activeTextColor === "accent" ? accentColors[activeAccent] : textColors[activeTextColor];
    context.fillStyle = headlineColor;
    context.textBaseline = "alphabetic";
    if (activeStyle === "clean") {
      context.shadowColor = "rgba(0,0,0,.7)";
      context.shadowBlur = 22 * scale;
      context.shadowOffsetY = 4 * scale;
    }
    lines.forEach((line, index) => context.fillText(line, x, startY + index * lineHeight));
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;

    const subtitleY = Math.min(height - 42 * scale, startY + textBlockHeight + 34 * scale);
    context.font = `800 ${20 * scale}px Arial, sans-serif`;
    context.fillStyle = headlineColor;
    context.fillText(ui.subtitle.value.toUpperCase(), x, subtitleY);

    context.font = `800 ${22 * scale}px Arial, sans-serif`;
    context.fillStyle = activeStyle === "rail" ? "#101a1e" : "#ffffff";
    if (activeStyle !== "rail") {
      context.shadowColor = "rgba(0,0,0,.72)";
      context.shadowBlur = 12 * scale;
      context.shadowOffsetY = 2 * scale;
    }
    context.textAlign = "left";
    context.fillText(ui.account.value, 54 * scale, 72 * scale);
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    return canvas;
  }

  async function downloadCover() {
    try {
      ui.download.disabled = true;
      ui.download.textContent = "Собираю PNG…";
      const canvas = await makeCoverCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG не собран");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sekta-${activeTopic.id}-cover.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setStatus("Обложка 1080 × 1350 скачана в PNG со всеми настройками.");
    } catch {
      setStatus("Не удалось собрать PNG. Откройте командную версию через GitHub Pages и попробуйте снова.");
    } finally {
      ui.download.disabled = false;
      ui.download.textContent = "Скачать PNG";
    }
  }

  async function addCoverToGrid() {
    try {
      const canvas = await makeCoverCanvas(540, 675);
      const thumb = canvas.toDataURL("image/jpeg", .82);
      window.dispatchEvent(new CustomEvent("sekta:add-generated-cover", { detail: {
        id: `builder-${activeTopic.id}-${Date.now()}`,
        thumb,
        title: ui.hook.value,
        source: "Конструктор идей и обложек",
      } }));
      setStatus("Обложка добавлена в будущую сетку.");
    } catch {
      setStatus("Не удалось добавить обложку. Попробуйте в версии на GitHub Pages.");
    }
  }

  ui.topic.innerHTML = config.topics.map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.label)}</option>`).join("");
  ui.mediaFolder.innerHTML += [...folderLabels.entries()].map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join("");

  ui.form.addEventListener("submit", (event) => { event.preventDefault(); generateConcept(); });
  ui.refreshIdeas.addEventListener("click", () => refreshIdeas());
  ui.ideaStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-builder-idea]");
    if (button) selectIdea(button.dataset.builderIdea);
  });
  ui.mediaGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-builder-media]");
    if (!button) return;
    selectedPhoto = library.find((item) => item.id === button.dataset.builderMedia) || selectedPhoto;
    syncMediaSelection();
    renderCover();
    updateSlideVisuals();
    setStatus(`Фото ${selectedPhoto.fileName} выбрано для обложки.`);
  });
  document.querySelectorAll("[data-builder-style]").forEach((button) => button.addEventListener("click", () => {
    activeStyle = button.dataset.builderStyle;
    if (activeStyle === "rail") activePlacement = "left";
    if (activeStyle === "footer") activePlacement = "bottom";
    renderCover();
  }));
  document.querySelectorAll("[data-builder-preview]").forEach((button) => button.addEventListener("click", () => setPreviewMode(button.dataset.builderPreview)));
  document.querySelectorAll("[data-builder-placement]").forEach((button) => button.addEventListener("click", () => { activePlacement = button.dataset.builderPlacement; renderCover(); }));
  document.querySelectorAll("[data-builder-font]").forEach((button) => button.addEventListener("click", () => { activeFont = button.dataset.builderFont; renderCover(); }));
  window.addEventListener("sekta:apply-type-taste", () => {
    if (!refreshTasteFont(true)) return setStatus("Сначала отметьте хотя бы один шрифтовой кадр как понравившийся.");
    renderCover();
    setStatus(`${tasteFont.family} · ${tasteFont.caseKind === "upper" ? "КАПС" : "строчные"} применён к обложке.`);
  });
  document.querySelectorAll("[data-builder-accent]").forEach((button) => button.addEventListener("click", () => { activeAccent = button.dataset.builderAccent; renderCover(); }));
  document.querySelectorAll("[data-builder-text-color]").forEach((button) => button.addEventListener("click", () => { activeTextColor = button.dataset.builderTextColor; renderCover(); }));
  ui.hook.addEventListener("input", syncCoverToSlide);
  ui.subtitle.addEventListener("input", renderCover);
  ui.account.addEventListener("change", renderCover);
  ui.goal.addEventListener("change", () => generateConcept({ preserveHook: true }));
  ui.focusX.addEventListener("input", renderCover);
  ui.focusY.addEventListener("input", renderCover);
  ui.slides.addEventListener("input", updateWordCount);
  ui.refreshScript.addEventListener("click", () => {
    scriptVariant = (scriptVariant + 1) % 3;
    renderSlides();
    setStatus(`Сценарий обновлён: вариант ${scriptVariant + 1} из 3.`);
  });
  ui.copyScript.addEventListener("click", async () => { await copyText(scriptText()); setStatus("Сценарий скопирован в буфер обмена."); });
  ui.mediaSearch.addEventListener("input", () => { mediaLimit = 24; renderMedia(); });
  ui.mediaFolder.addEventListener("change", () => { mediaLimit = 24; renderMedia(); });
  ui.showAllMedia.addEventListener("click", () => {
    mediaScope = mediaScope === "all" ? "relevant" : "all";
    mediaLimit = 24;
    renderMedia();
    setStatus(mediaScope === "all" ? "Открыт весь каталог медиатеки." : "Показаны фотографии по теме карусели.");
  });
  ui.shuffleMedia.addEventListener("click", () => {
    mediaOrder = shuffle(mediaOrder);
    mediaRandomized = true;
    mediaLimit = Math.max(mediaLimit, 24);
    renderMedia();
    setStatus("Фотографии перемешаны. Выбранная обложка сохранена.");
  });
  ui.loadMoreMedia.addEventListener("click", () => { mediaLimit += 24; renderMedia(); });
  ui.expandMedia.addEventListener("click", () => {
    const expanded = ui.workspace.classList.toggle("is-media-expanded");
    ui.expandMedia.textContent = expanded ? "Вернуть обложку" : "Развернуть";
    ui.expandMedia.setAttribute("aria-expanded", String(expanded));
  });
  ui.download.addEventListener("click", downloadCover);
  ui.addGrid.addEventListener("click", addCoverToGrid);
  ui.toStudio?.addEventListener("click", () => {
    setStatus("Открыта полная типографическая примерочная: 294 гарнитуры и 588 кадров обложки.");
  });

  ui.topic.value = activeTopic.id;
  ui.hook.value = activeTopic.hooks[0];
  ui.subtitle.value = subtitleForGoal();
  refreshIdeas({ initial: true });
  selectedPhoto = currentMediaPool()[0] || library[0] || null;
  refreshTasteFont(false);
  restoreCoverSystem();
  renderMedia();
  renderCover();
  setPreviewMode(activePreview);
  renderSlides();
})();
