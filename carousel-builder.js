(() => {
  const config = window.SEKTA_CAROUSEL_BUILDER;
  const library = window.SEKTA_LIBRARY?.items || [];
  const currentGrid = window.SEKTA_CURRENT_GRID || [];
  if (!config?.topics?.length) return;

  const ui = {
    form: document.querySelector("#builderControls"),
    ideaStrip: document.querySelector("#builderIdeaStrip"),
    refreshIdeas: document.querySelector("#builderRefreshIdeas"),
    development: document.querySelector("#builderIdeaDevelopment"),
    developmentTitle: document.querySelector("#builderDevelopmentTitle"),
    developmentHook: document.querySelector("#builderDevelopmentHook"),
    closeDevelopment: document.querySelector("#builderCloseDevelopment"),
    topic: document.querySelector("#builderTopic"),
    slideCount: document.querySelector("#builderSlideCount"),
    goal: document.querySelector("#builderGoal"),
    account: document.querySelector("#builderAccount"),
    tone: document.querySelector("#builderTone"),
    hook: document.querySelector("#builderHook"),
    subtitle: document.querySelector("#builderSubtitle"),
    workspace: document.querySelector("#builderWorkspace"),
    quickControls: document.querySelector(".builder-design-controls"),
    mediaPanel: document.querySelector(".builder-media-panel"),
    directHint: document.querySelector("#builderDirectHint"),
    cover: document.querySelector("#builderCoverPreview"),
    coverImage: document.querySelector("#builderCoverImage"),
    coverAccount: document.querySelector("#builderCoverAccount"),
    coverHeadline: document.querySelector("#builderCoverHeadline"),
    coverPromise: document.querySelector("#builderCoverPromise"),
    layerLabel: document.querySelector("#builderLayerLabel"),
    layerTarget: document.querySelector("#builderLayerTarget"),
    layerText: document.querySelector("#builderLayerText"),
    layerRemove: document.querySelector("#builderLayerRemove"),
    layerFont: document.querySelector("#builderLayerFont"),
    layerWeight: document.querySelector("#builderLayerWeight"),
    layerWeightValue: document.querySelector("#builderLayerWeightValue"),
    layerSize: document.querySelector("#builderLayerSize"),
    layerSizeValue: document.querySelector("#builderLayerSizeValue"),
    layerLineHeight: document.querySelector("#builderLayerLineHeight"),
    layerLineHeightValue: document.querySelector("#builderLayerLineHeightValue"),
    layerTracking: document.querySelector("#builderLayerTracking"),
    layerTrackingValue: document.querySelector("#builderLayerTrackingValue"),
    layerOffsetX: document.querySelector("#builderLayerOffsetX"),
    layerOffsetXValue: document.querySelector("#builderLayerOffsetXValue"),
    layerOffsetY: document.querySelector("#builderLayerOffsetY"),
    layerOffsetYValue: document.querySelector("#builderLayerOffsetYValue"),
    coverStatus: document.querySelector("#builderCoverStatus"),
    gridFitting: document.querySelector("#builderGridFitting"),
    liveGrid: document.querySelector("#builderLiveGrid"),
    focusX: document.querySelector("#builderFocusX"),
    focusY: document.querySelector("#builderFocusY"),
    slides: document.querySelector("#builderSlides"),
    typeSystems: document.querySelector("#builderTypeSystems"),
    refreshScript: document.querySelector("#builderRefreshScript"),
    mediaGrid: document.querySelector("#builderMediaGrid"),
    mediaCount: document.querySelector("#builderMediaCount"),
    mediaShown: document.querySelector("#builderMediaShown"),
    mediaSearch: document.querySelector("#builderMediaSearch"),
    mediaFolder: document.querySelector("#builderMediaFolder"),
    showAllMedia: document.querySelector("#builderShowAllMedia"),
    shuffleMedia: document.querySelector("#builderShuffleMedia"),
    expandMedia: document.querySelector("#builderExpandMedia"),
    sendToPost: document.querySelector("#builderSendToPost"),
    wordCount: document.querySelector("#builderWordCount"),
    scriptTitle: document.querySelector("#builderScriptTitle"),
    buildCarousel: document.querySelector("#builderBuildCarousel"),
    status: document.querySelector("#builderStatus"),
    download: document.querySelector("#builderDownload"),
    addGrid: document.querySelector("#builderAddGrid"),
    copyScript: document.querySelector("#builderCopyScript"),
    tasteFont: document.querySelector("#builderTasteFont"),
    toStudio: document.querySelector("#builderToStudio"),
  };

  const narrowWorkspace = window.matchMedia("(max-width: 1100px)");

  function placeQuickControls() {
    if (!ui.quickControls || !ui.mediaPanel || !ui.directHint) return;
    const inline = narrowWorkspace.matches;
    if (inline) ui.directHint.insertAdjacentElement("afterend", ui.quickControls);
    else ui.mediaPanel.prepend(ui.quickControls);
    ui.quickControls.classList.toggle("is-inline", inline);
  }

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
  const coverTextDragSensitivity = 0.5;
  const coverTextDragAccelerationDistance = 200;
  const coverLayerOffsetLimit = 90;
  const seriesSystems = [
    { id: "tempo", label: "Tempo", family: "PT Sans Narrow", body: "Manrope", caseKind: "upper", note: "узкий капс × спокойный текст" },
    { id: "soft", label: "Мягкая", family: "Manrope", body: "Golos Text", caseKind: "upper", note: "широкий капс × нейтральный текст" },
    { id: "editorial", label: "Редакционная", family: "Commissioner", body: "Manrope", caseKind: "upper", note: "характерный заголовок × воздух" },
    { id: "human", label: "Живая", family: "Geologica", body: "Golos Text", caseKind: "lower", note: "строчные × мягкий ритм" },
  ];
  const seriesSceneLabels = { cover: "обложка + плашка", split: "фото + поле", scrim: "фото + scrim", paper: "светлая колонка", quote: "акцентная мысль", window: "фото-окно", clean: "текст на фото", cta: "цветовой финал" };
  const folderLabels = new Map(library.map((item) => [item.folder, item.folderLabel]).filter(([id]) => id));

  let activeTopic = config.topics[0];
  let activeStyle = "clean";
  let activePlacement = "bottom";
  let activeFont = "tempo";
  let activeAccent = "yellow";
  let activeTextColor = "accent";
  let activePreview = "cover";
  let tasteFont = null;
  let hookIndex = 0;
  let scriptVariant = 0;
  let selectedIdeaKey = "";
  let currentIdeas = [];
  let mediaScope = "all";
  let mediaLimit = 40;
  let mediaOrder = [...library];
  let mediaRandomized = false;
  let mediaPool = [];
  let selectedPhoto = null;
  let activeSeriesSystem = "tempo";
  let activeCoverLayer = "headline";
  const coverLayers = {
    headline: { label: "заголовок", visible: true, family: "PT Sans Narrow", weight: 700, size: 106, lineHeight: .86, tracking: -.012, x: 0, y: 0 },
    subtitle: { label: "подстрочник", visible: true, family: "Manrope", weight: 800, size: 20, lineHeight: 1, tracking: .08, x: 0, y: 0 },
    account: { label: "аккаунт", visible: true, family: "Manrope", weight: 800, size: 22, lineHeight: 1, tracking: .06, x: 0, y: 0 },
  };

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

  function writeLocalJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: keep the current session usable */ }
  }

  const coverSystemKey = "sekta-builder-cover-system-v3";
  const discoveryStateKey = "sekta-builder-discovery-v1";
  function restoreCoverSystem() {
    const saved = readLocalJson(coverSystemKey, {});
    if (["clean", "plate", "rail", "footer"].includes(saved.style)) activeStyle = saved.style;
    if (["bottom", "middle", "left", "right"].includes(saved.placement)) activePlacement = saved.placement;
    if (["tempo", "grotesk", "editorial", "taste"].includes(saved.font) && (saved.font !== "taste" || tasteFont)) activeFont = saved.font;
    if (accentColors[saved.accent]) activeAccent = saved.accent;
    if (["auto", "ink", "white", "accent"].includes(saved.textColor)) activeTextColor = saved.textColor;
    if (Number.isFinite(Number(saved.focusX))) ui.focusX.value = Math.max(0, Math.min(100, Number(saved.focusX)));
    if (Number.isFinite(Number(saved.focusY))) ui.focusY.value = Math.max(0, Math.min(100, Number(saved.focusY)));
  }

  function saveCoverSystem() {
    writeLocalJson(coverSystemKey, {
      style: activeStyle,
      placement: activePlacement,
      font: activeFont,
      accent: activeAccent,
      textColor: activeTextColor,
      focusX: Number(ui.focusX.value),
      focusY: Number(ui.focusY.value),
    });
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
    const lastDiscovery = readLocalJson(discoveryStateKey, {});
    const previousKeys = new Set(currentIdeas.map((idea) => idea.key));
    const fresh = shuffle(ideaPool());
    const unseen = fresh.filter((idea) => !previousKeys.has(idea.key) && idea.key !== lastDiscovery.ideaKey);
    currentIdeas = [...unseen, ...fresh].slice(0, 10);
    selectedIdeaKey = "";
    ui.development.hidden = true;
    renderIdeaStrip();
    if (!initial) setStatus("Собраны ещё 10 идей. Выберите любую — хук сразу появится на обложке.");
  }

  function renderIdeaStrip() {
    ui.ideaStrip.innerHTML = currentIdeas.map((idea) => `<button type="button" class="builder-idea${idea.key === selectedIdeaKey ? " is-active" : ""}" data-builder-idea="${escapeHtml(idea.key)}"><span>${escapeHtml(idea.topic.label)}</span><strong>${escapeHtml(idea.hook)}</strong><small>${escapeHtml(idea.topic.promise)}</small></button>`).join("");
  }

  function selectIdea(key, { scroll = true, revealDevelopment = true, announce = true } = {}) {
    const idea = currentIdeas.find((item) => item.key === key);
    if (!idea) return;
    selectedIdeaKey = idea.key;
    activeTopic = idea.topic;
    hookIndex = [...activeTopic.hooks, ...(extraHooks[activeTopic.id] || [])].indexOf(idea.hook);
    scriptVariant = 0;
    ui.topic.value = activeTopic.id;
    ui.hook.value = idea.hook;
    ui.subtitle.value = subtitleForGoal();
    ui.developmentTitle.textContent = idea.topic.label;
    ui.developmentHook.textContent = idea.hook;
    ui.development.hidden = !revealDevelopment;
    mediaScope = "all";
    mediaLimit = 40;
    mediaRandomized = false;
    renderIdeaStrip();
    renderMedia();
    renderCover();
    renderSlides();
    if (announce) setStatus(`Идея «${activeTopic.label}» раскрыта: выберите объём и соберите карусель.`);
    if (scroll) ui.development.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function candidateScore(item) {
    const coverRole = item.carouselRoles?.includes("01_обложка_личное_присутствие") ? 2 : 0;
    const actionRole = activeTopic.theme === "03_тело_спорт_сила_изменения" && item.carouselRoles?.includes("02_действие_и_доказательство") ? 1.6 : 0;
    const portrait = item.orientation === "portrait" ? 1 : 0;
    const beforePhotoPenalty = item.sourceFolder === "тело ДО" && activeTopic.id !== "body-neutrality" ? -5 : 0;
    return coverRole + actionRole + portrait + beforePhotoPenalty + Number(item.agentScore || 0);
  }

  function qualityShuffle(items, bandSize = 10) {
    const ranked = [...items].sort((a, b) => candidateScore(b) - candidateScore(a));
    const result = [];
    for (let index = 0; index < ranked.length; index += bandSize) result.push(...shuffle(ranked.slice(index, index + bandSize)));
    return result;
  }

  function freshCoverMediaOrder(previousPhotoId = "") {
    const collectionIds = ["neuro", "camp", "maternity", "body", "olya"];
    const collectionQueues = new Map(collectionIds.map((id) => [
      id,
      qualityShuffle(library.filter((item) => item.collections?.includes(id))).slice(0, 48),
    ]));
    const result = [];
    const used = new Set();
    const add = (item) => {
      if (!item || used.has(item.id) || item.id === previousPhotoId) return;
      used.add(item.id);
      result.push(item);
    };

    // A different collection leads each session; the strongest candidates then
    // rotate so one source never floods the first rows of the picker.
    const rotatingCollections = shuffle(collectionIds);
    for (let round = 0; round < 8; round += 1) rotatingCollections.forEach((id) => add(collectionQueues.get(id)?.[round]));
    qualityShuffle(library).forEach(add);
    const previous = library.find((item) => item.id === previousPhotoId);
    if (previous) result.push(previous);
    return result;
  }

  function refreshDiscovery({ initial = false } = {}) {
    const lastDiscovery = readLocalJson(discoveryStateKey, {});
    refreshIdeas({ initial: true });
    const idea = currentIdeas.find((item) => item.key !== lastDiscovery.ideaKey) || currentIdeas[0];
    if (!idea) return;

    selectIdea(idea.key, { scroll: false, revealDevelopment: false, announce: false });
    mediaOrder = freshCoverMediaOrder(lastDiscovery.photoId || selectedPhoto?.id || "");
    mediaRandomized = true;
    selectedPhoto = mediaOrder[0] || library[0] || null;
    mediaScope = "all";
    mediaLimit = 40;
    ui.mediaSearch.value = "";
    ui.mediaFolder.value = "all";
    renderMedia();
    renderCover();
    renderSlides();
    writeLocalJson(discoveryStateKey, { ideaKey: idea.key, photoId: selectedPhoto?.id || "", updatedAt: Date.now() });
    setStatus(initial
      ? `Новая загрузка: идея «${idea.topic.label}» и фотография для обложки обновлены.`
      : `Обновили идею, обложку и фотоподборку. Сейчас — «${idea.topic.label}».`);
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
    if (!mediaRandomized) pool.sort((a, b) => candidateScore(b) - candidateScore(a));
    return pool;
  }

  function renderMedia() {
    mediaPool = currentMediaPool();
    const visible = mediaPool.slice(0, mediaLimit);
    if (!selectedPhoto) selectedPhoto = visible[0] || library[0] || null;
    ui.mediaCount.textContent = mediaScope === "relevant"
      ? `${mediaPool.length} ${plural(mediaPool.length, "фото по теме", "фото по теме", "фото по теме")} · свежая подборка`
      : `${mediaPool.length} ${plural(mediaPool.length, "фото в каталоге", "фото в каталоге", "фото в каталоге")} · свежая подборка`;
    ui.mediaGrid.innerHTML = visible.length
      ? visible.map((item) => `<button type="button" class="builder-media${item.id === selectedPhoto?.id ? " is-selected" : ""}" data-builder-media="${escapeHtml(item.id)}" data-name="${escapeHtml(item.fileName)}" aria-label="Выбрать ${escapeHtml(item.fileName)}"><img src="${escapeHtml(item.thumb)}" alt="" loading="lazy"></button>`).join("")
      : `<div class="builder-media-empty"><strong>Ничего не найдено</strong><span>Сбросьте поиск или выберите другую коллекцию.</span></div>`;
    ui.mediaShown.textContent = `Показано ${visible.length} из ${mediaPool.length}`;
    ui.showAllMedia.textContent = mediaScope === "all" ? "Только по теме" : "Показать все";
    ui.showAllMedia.classList.toggle("is-active", mediaScope === "all");
  }

  function syncMediaSelection() {
    ui.mediaGrid.querySelectorAll("[data-builder-media]").forEach((button) => button.classList.toggle("is-selected", button.dataset.builderMedia === selectedPhoto?.id));
  }

  function subtitleForGoal() {
    const count = Number(ui.slideCount?.value || 10);
    const actions = { save: "сохрани", comment: "обсудим", warmth: "отправь близким", class: "выбери класс" };
    return `${count} ${plural(count, "слайд", "слайда", "слайдов")} · ${actions[ui.goal.value] || actions.save}`;
  }

  function layerElement(key) {
    return key === "headline" ? ui.coverHeadline : key === "subtitle" ? ui.coverPromise : ui.coverAccount;
  }

  function layerText(key) {
    return key === "headline" ? ui.hook.value : key === "subtitle" ? ui.subtitle.value : ui.account.value;
  }

  function setLayerText(key, value) {
    if (key === "headline") ui.hook.value = value;
    else if (key === "subtitle") ui.subtitle.value = value;
    else {
      const option = [...ui.account.options].find((item) => item.value === value);
      if (option) ui.account.value = value;
      else {
        const custom = document.createElement("option");
        custom.value = value;
        custom.textContent = value || "Без подписи";
        ui.account.append(custom);
        ui.account.value = value;
      }
    }
  }

  function syncLayerInspector() {
    const layer = coverLayers[activeCoverLayer];
    ui.layerTarget.value = activeCoverLayer;
    ui.layerLabel.textContent = layer.label;
    ui.layerText.value = layerText(activeCoverLayer);
    ui.layerFont.value = layer.family;
    ui.layerWeight.value = layer.weight;
    ui.layerWeightValue.textContent = layer.weight;
    ui.layerSize.value = layer.size;
    ui.layerSizeValue.textContent = `${layer.size} px`;
    ui.layerLineHeight.value = layer.lineHeight;
    ui.layerLineHeightValue.textContent = Number(layer.lineHeight).toFixed(2);
    ui.layerTracking.value = layer.tracking;
    ui.layerTrackingValue.textContent = `${layer.tracking < 0 ? "−" : layer.tracking > 0 ? "+" : ""}${Math.abs(layer.tracking).toFixed(3)} em`;
    ui.layerOffsetX.value = layer.x;
    ui.layerOffsetXValue.textContent = `${layer.x}%`;
    ui.layerOffsetY.value = layer.y;
    ui.layerOffsetYValue.textContent = `${layer.y}%`;
    ui.layerRemove.textContent = layer.visible ? "Удалить элемент" : "Вернуть элемент";
  }

  function applyCoverLayers() {
    Object.entries(coverLayers).forEach(([key, layer]) => {
      const element = layerElement(key);
      element.hidden = !layer.visible;
      element.classList.toggle("is-selected-layer", key === activeCoverLayer);
      element.style.setProperty("--builder-layer-x", `${layer.x}cqw`);
      element.style.setProperty("--builder-layer-y", `${layer.y * 1.25}cqw`);
      element.style.fontFamily = `"${layer.family}", sans-serif`;
      element.style.fontWeight = layer.weight;
      element.style.fontSize = `${Math.round(layer.size * 48) / 100}px`;
      element.style.lineHeight = layer.lineHeight;
      element.style.letterSpacing = `${layer.tracking}em`;
    });
  }

  function updateLayerFromInspector() {
    const layer = coverLayers[activeCoverLayer];
    setLayerText(activeCoverLayer, ui.layerText.value);
    layer.family = ui.layerFont.value;
    layer.weight = Number(ui.layerWeight.value);
    layer.size = Number(ui.layerSize.value);
    layer.lineHeight = Number(ui.layerLineHeight.value);
    layer.tracking = Number(ui.layerTracking.value);
    layer.x = Number(ui.layerOffsetX.value);
    layer.y = Number(ui.layerOffsetY.value);
    layer.visible = true;
    renderCover();
    syncLayerInspector();
  }

  function renderCover() {
    ui.cover.className = `builder-cover builder-cover-${activeStyle} is-direct-editing`;
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
    applyCoverLayers();
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
    syncLayerInspector();
    saveCoverSystem();
  }

  function renderGridFitting() {
    if (!ui.liveGrid) return;
    const layerMarkup = (key, tag, className, text) => {
      const layer = coverLayers[key];
      if (!layer.visible) return "";
      const style = `--builder-layer-x:${layer.x}cqw;--builder-layer-y:${layer.y * 1.25}cqw;font-family:'${escapeHtml(layer.family)}',sans-serif;font-weight:${layer.weight};font-size:${Math.round(layer.size * .144)}px;line-height:${layer.lineHeight};letter-spacing:${layer.tracking}em`;
      return `<${tag} class="${className}" style="${style}">${escapeHtml(text)}</${tag}>`;
    };
    const draft = `<div class="builder-grid-cell is-draft"><div class="builder-grid-draft builder-cover builder-cover-${activeStyle}" data-placement="${escapeHtml(activePlacement)}" data-font="${escapeHtml(activeFont)}" data-accent="${escapeHtml(activeAccent)}" data-taste-case="${escapeHtml(tasteFont?.caseKind || "lower")}" data-text-color="${escapeHtml(activeTextColor)}" style="--builder-accent:${accentColors[activeAccent]};--builder-headline-font:${tasteFont ? `'${escapeHtml(tasteFont.family)}'` : `'Golos Text'`};--focus-x:${ui.focusX.value}%;--focus-y:${ui.focusY.value}%"><img src="${escapeHtml(selectedPhoto?.thumb || "")}" alt="">${layerMarkup("account", "span", "builder-cover-account", ui.account.value)}${layerMarkup("headline", "strong", "", ui.hook.value)}${layerMarkup("subtitle", "small", "", ui.subtitle.value)}</div><span class="builder-grid-new">NEW</span></div>`;
    const existing = currentGrid.slice(0, 8).map((item) => `<div class="builder-grid-cell"><img src="${escapeHtml(item.image)}" alt="" loading="lazy"><span class="builder-grid-kind">${item.pinned ? "◆" : item.type === "Reel" ? "▶" : "▣"}</span></div>`).join("");
    ui.liveGrid.innerHTML = draft + existing;
  }

  function setPreviewMode(mode) {
    activePreview = mode === "cover" ? "cover" : "grid";
    const showCover = activePreview === "cover";
    ui.workspace.classList.toggle("is-grid-preview", !showCover);
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
    const total = Number(ui.slideCount?.value || 10);
    const requiredMiddle = Math.max(1, total - 2);
    const source = middleSlides();
    const expanded = Array.from({ length: requiredMiddle }, (_, index) => {
      if (source[index]) return source[index];
      const base = source[index % source.length] || { role: "Развитие", title: activeTopic.promise, body: activeTopic.promise };
      const additions = [
        { role: "Пример", title: `Как это выглядит в обычном дне`, body: base.body },
        { role: "Практика", title: `Один шаг, который можно сделать сегодня`, body: activeTopic.promise },
        { role: "Пауза", title: `Не нужно делать всё сразу`, body: base.body },
      ];
      return additions[(index - source.length) % additions.length];
    });
    return [
      { role: "Обложка", title: ui.hook.value, body: activeTopic.promise },
      ...expanded,
      { role: "CTA", title: goal.label, body: goal.cta },
    ];
  }

  function currentSlideMedia() {
    const pool = mediaPool.length ? mediaPool : currentMediaPool();
    const looksLikeDocument = (item) => /(скрин|снимок экрана|screenshot|screen ?shot|conference|конференц|article|статья|pdf|документ)/.test([item?.fileName, item?.folderLabel, item?.sourceCategory].join(" ").toLocaleLowerCase("ru"));
    const rankedPhotos = pool
      .filter((item) => item && !looksLikeDocument(item))
      .sort((a, b) => candidateScore(b) - candidateScore(a));
    return [selectedPhoto, ...rankedPhotos.filter((item) => item.id !== selectedPhoto?.id)].filter(Boolean);
  }

  function selectedSeriesSystem() {
    return seriesSystems.find((system) => system.id === activeSeriesSystem) || seriesSystems[0];
  }

  function paletteForAccent(accent = activeAccent, role = "accent") {
    const systems = {
      sky: { accent: "sekta-sky", neutral: "sekta-cream", dark: "ink" },
      green: { accent: "sekta-mint", neutral: "sekta-cream", dark: "ink" },
      yellow: { accent: "sekta-sun", neutral: "sekta-cream", dark: "sekta-yellow" },
      pink: { accent: "sekta-pink", neutral: "sekta-cream", dark: "ink" },
    };
    return (systems[accent] || systems.yellow)[role] || systems.yellow.accent;
  }

  function resolvedCoverLayerColors() {
    const accent = accentColors[activeAccent];
    const explicit = activeTextColor === "white" ? "#ffffff" : activeTextColor === "ink" ? "#17221f" : activeTextColor === "accent" ? accent : "";
    const surfaceText = explicit || (activeStyle === "clean" ? accent : "#101a1e");
    const account = explicit || (activeStyle === "rail" ? "#101a1e" : "#ffffff");
    return { title: surfaceText, body: surfaceText, label: account };
  }

  function renderTypeSystems() {
    if (!ui.typeSystems) return;
    ui.typeSystems.innerHTML = seriesSystems.map((system) => `<button type="button" class="builder-type-system${system.id === activeSeriesSystem ? " is-active" : ""}" data-builder-series-system="${system.id}" aria-pressed="${system.id === activeSeriesSystem}"><strong style="font-family:'${escapeHtml(system.family)}'">${escapeHtml(system.label)}</strong><span>${escapeHtml(system.family)} × ${escapeHtml(system.body)}</span><small>${escapeHtml(system.note)}</small></button>`).join("");
  }

  function visualPlanFor(index, total) {
    if (index === 0) return { scene: "cover", accent: activeAccent, withPhoto: true, studioScene: "photo-clean", studioTemplate: "imported-cover", studioPalette: paletteForAccent(activeAccent, "accent") };
    if (index === total - 1) return { scene: "cta", accent: activeAccent, withPhoto: false, studioScene: "field", studioTemplate: "color-final", studioPalette: paletteForAccent(activeAccent, "accent") };
    const cadence = [
      { scene: "paper", accent: activeAccent, withPhoto: false, studioScene: "paper", studioTemplate: "light-column", studioPalette: paletteForAccent(activeAccent, "neutral") },
      { scene: "split", accent: activeAccent, withPhoto: true, studioScene: "split", studioTemplate: "side-plaque", studioPalette: paletteForAccent(activeAccent, "accent") },
      { scene: "scrim", accent: activeAccent, withPhoto: true, studioScene: "photo-dim", studioTemplate: "photo-scrim", studioPalette: paletteForAccent(activeAccent, "dark") },
      { scene: "quote", accent: activeAccent, withPhoto: false, studioScene: "field", studioTemplate: "accent-thought", studioPalette: paletteForAccent(activeAccent, "accent") },
      { scene: "window", accent: activeAccent, withPhoto: true, studioScene: "window", studioTemplate: "photo-field", studioPalette: paletteForAccent(activeAccent, "accent") },
      { scene: "clean", accent: activeAccent, withPhoto: true, studioScene: "photo-dim", studioTemplate: "text-photo", studioPalette: paletteForAccent(activeAccent, "dark") },
    ];
    return cadence[(index - 1) % cadence.length];
  }

  function photoForSlide(index, plan, photos) {
    if (!plan.withPhoto || !photos.length) return null;
    if (index === 0) return selectedPhoto || photos[0];
    return photos[(index * 2 + scriptVariant) % photos.length];
  }

  function renderSlides() {
    const slides = buildSlides();
    const slideMedia = currentSlideMedia();
    const system = selectedSeriesSystem();
    ui.slides.style.setProperty("--series-head", `'${system.family}'`);
    ui.slides.style.setProperty("--series-body", `'${system.body}'`);
    ui.slides.dataset.case = system.caseKind;
    ui.slides.innerHTML = slides.map((slide, index) => {
      const plan = visualPlanFor(index, slides.length);
      const photo = photoForSlide(index, plan, slideMedia);
      const image = photo ? `<img class="builder-slide-photo" src="${escapeHtml(photo.thumb)}" alt="" loading="lazy">` : "";
      return `<article class="builder-slide scene-${plan.scene}" data-builder-slide="${index + 1}" data-photo-id="${escapeHtml(photo?.id || "")}" data-studio-scene="${plan.studioScene}" data-studio-template="${plan.studioTemplate}" data-studio-palette="${plan.studioPalette}" style="--slide-accent:${accentColors[plan.accent]}"><div class="builder-slide-canvas">${image}<div class="builder-slide-scrim"></div><span class="builder-slide-account">#SEKTA · ${String(index + 1).padStart(2, "0")}</span><div class="builder-slide-copy"><span class="builder-slide-role">${escapeHtml(slide.role)}</span><strong contenteditable="true" spellcheck="true">${escapeHtml(slide.title)}</strong><p contenteditable="true" spellcheck="true">${escapeHtml(slide.body)}</p></div></div><footer><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(seriesSceneLabels[plan.scene])}</strong>${photo ? `<small>${escapeHtml(photo.fileName)}</small>` : ""}<button type="button" class="builder-slide-edit" data-edit-builder-slide="${index}">Текст · фото · шрифт</button></footer></article>`;
    }).join("");
    const count = Number(ui.slideCount?.value || 10);
    ui.scriptTitle.textContent = `Карусель · ${count} ${plural(count, "слайд", "слайда", "слайдов")}`;
    updateWordCount();
  }

  function updateSlideVisuals() {
    renderSlides();
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
    mediaScope = "all";
    mediaLimit = 40;
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

  function longreadFromSlides() {
    return [...ui.slides.querySelectorAll(".builder-slide")].slice(1, -1).map((row) => {
      const title = row.querySelector("strong")?.textContent.trim();
      const body = row.querySelector("p")?.textContent.trim();
      return [title, body].filter(Boolean).join("\n");
    }).filter(Boolean).join("\n\n");
  }

  function sendToCarouselBuilder(activeSlide = 0) {
    const goal = config.goals[ui.goal.value] || config.goals.save;
    const rows = [...ui.slides.querySelectorAll(".builder-slide")];
    const coverColors = resolvedCoverLayerColors();
    const coverCase = activeFont === "tempo" ? "upper" : activeFont === "taste" ? tasteFont?.caseKind || "original" : "original";
    const coverBox = activeStyle === "rail"
      ? { titleWidth: 34, titleHeight: 62, bodyWidth: 34, bodyHeight: 12 }
      : activeStyle === "footer"
        ? { titleWidth: 91, titleHeight: 24, bodyWidth: 91, bodyHeight: 8 }
        : activeStyle === "plate"
          ? { titleWidth: 62, titleHeight: 58, bodyWidth: 90, bodyHeight: 8 }
          : { titleWidth: 91, titleHeight: 55, bodyWidth: 90, bodyHeight: 8 };
    const detail = {
      id: activeTopic.id,
      kind: "post",
      title: activeTopic.label,
      hook: ui.hook.value,
      objective: goal.label,
      asset: selectedPhoto ? `Выбранная обложка: ${selectedPhoto.fileName}` : "Выбрать фото из медиатеки",
      cta: goal.cta,
      readiness: "Черновик собран · проверить текст и визуал",
      slideCount: Number(ui.slideCount.value),
      longread: longreadFromSlides(),
      photoId: selectedPhoto?.id || null,
      font: { ...selectedSeriesSystem(), recipe: "сохранённая кириллическая пара" },
      coverDesign: {
        schema: "sekta-cover-design-v2",
        template: "imported-cover",
        style: activeStyle,
        scene: activeStyle === "clean" ? "photo-clean" : activeStyle === "plate" ? "plate" : "photo-dim",
        palette: paletteForAccent(activeAccent, "accent"),
        accent: activeAccent,
        accentColor: accentColors[activeAccent],
        titleText: ui.hook.value,
        subtitleText: ui.subtitle.value,
        labelText: ui.account.value,
        placement: activePlacement,
        focusX: Number(ui.focusX.value),
        focusY: Number(ui.focusY.value),
        photoScale: 1,
        caseKind: coverCase,
        textColor: coverColors.title,
        plaqueEnabled: activeStyle === "plate",
        plaqueColor: accentColors[activeAccent],
        plaqueOpacity: 1,
        title: { ...coverLayers.headline, color: coverColors.title, boxWidth: coverBox.titleWidth, boxHeight: coverBox.titleHeight },
        body: { ...coverLayers.subtitle, color: coverColors.body, boxWidth: coverBox.bodyWidth, boxHeight: coverBox.bodyHeight },
        label: { ...coverLayers.account, color: coverColors.label, boxWidth: 52, boxHeight: 8 },
      },
      slides: rows.map((slide, index) => ({
        role: index === 0 ? "cover" : index === rows.length - 1 ? "cta" : "longread",
        title: slide.querySelector(".builder-slide-copy strong")?.textContent.trim() || "",
        body: slide.querySelector(".builder-slide-copy p")?.textContent.trim() || "",
      })),
      visualPlan: rows.map((slide) => ({ scene: slide.dataset.studioScene, template: slide.dataset.studioTemplate, palette: slide.dataset.studioPalette, photoId: slide.dataset.photoId || null })),
      activeSlide,
      openSlides: true,
    };
    document.querySelector('[data-view="postbuilder"]')?.click();
    window.dispatchEvent(new CustomEvent("sekta:post-builder-load", { detail }));
    setStatus(`Открыт слайд ${activeSlide + 1}: можно менять фото, шрифт, кегль и положение текста.`);
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
    const image = await loadImage(selectedPhoto.exportImage || selectedPhoto.thumb);
    const scale = width / 1080;
    try { await Promise.all(Object.values(coverLayers).map((layer) => document.fonts.load(`${layer.weight} ${layer.size * scale}px "${layer.family}"`))); } catch {}
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
    const headlineLayer = coverLayers.headline;
    const subtitleLayer = coverLayers.subtitle;
    const accountLayer = coverLayers.account;
    let fontSize = headlineLayer.size * scale;
    const family = `"${headlineLayer.family}", Arial, sans-serif`;
    const headline = activeFont === "tempo" ? ui.hook.value.toLocaleUpperCase("ru-RU") : activeFont === "taste" && tasteFont?.caseKind === "upper" ? ui.hook.value.toLocaleUpperCase("ru-RU") : activeFont === "taste" && tasteFont?.caseKind === "lower" ? ui.hook.value.toLocaleLowerCase("ru-RU") : ui.hook.value;
    const headlineWeight = headlineLayer.weight;
    let lines = [];
    do {
      context.font = `${headlineWeight} ${fontSize}px ${family}`;
      if ("letterSpacing" in context) context.letterSpacing = `${headlineLayer.tracking * fontSize}px`;
      lines = wrapLines(context, headline, maxWidth);
      if (lines.length > 5) fontSize -= 5 * scale;
    } while (lines.length > 5 && fontSize > 50 * scale);
    if (!lines.length) lines = [""];

    const lineHeight = fontSize * headlineLayer.lineHeight;
    const textBlockHeight = lines.length * lineHeight;
    const footerHeight = Math.max(height * .31, textBlockHeight + 150 * scale);
    const x = (activeStyle === "rail" ? 48 * scale : activePlacement === "right" ? width - 58 * scale : activePlacement === "middle" ? width / 2 : 58 * scale) + headlineLayer.x / 100 * width;
    const startYBase = activeStyle === "rail"
      ? height / 2 - ((lines.length - 1) * lineHeight) / 2
      : activeStyle === "footer"
        ? height - footerHeight + 62 * scale + fontSize * .72
        : activePlacement === "middle"
          ? height / 2 - ((lines.length - 1) * lineHeight) / 2
          : height - textBlockHeight - 118 * scale;
    const startY = startYBase + headlineLayer.y / 100 * height;
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
    if (headlineLayer.visible) lines.forEach((line, index) => context.fillText(line, x, startY + index * lineHeight));

    const subtitleX = x + subtitleLayer.x / 100 * width;
    const subtitleY = Math.min(height - 165 * scale, startY + textBlockHeight + 34 * scale) + subtitleLayer.y / 100 * height;
    context.font = `${subtitleLayer.weight} ${subtitleLayer.size * scale}px "${subtitleLayer.family}", Arial, sans-serif`;
    if ("letterSpacing" in context) context.letterSpacing = `${subtitleLayer.tracking * subtitleLayer.size * scale}px`;
    context.fillStyle = headlineColor;
    if (subtitleLayer.visible) context.fillText(ui.subtitle.value.toUpperCase(), subtitleX, subtitleY);

    context.font = `${accountLayer.weight} ${accountLayer.size * scale}px "${accountLayer.family}", Arial, sans-serif`;
    if ("letterSpacing" in context) context.letterSpacing = `${accountLayer.tracking * accountLayer.size * scale}px`;
    context.fillStyle = activeStyle === "rail" ? "#101a1e" : "#ffffff";
    context.textAlign = "left";
    if (accountLayer.visible) context.fillText(ui.account.value, 54 * scale + accountLayer.x / 100 * width, 170 * scale + accountLayer.y / 100 * height);
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
  ui.layerTarget.addEventListener("change", () => {
    activeCoverLayer = ui.layerTarget.value;
    syncLayerInspector();
    applyCoverLayers();
  });
  [ui.layerText, ui.layerFont, ui.layerWeight, ui.layerSize, ui.layerLineHeight, ui.layerTracking, ui.layerOffsetX, ui.layerOffsetY].forEach((control) => control.addEventListener("input", updateLayerFromInspector));
  ui.layerRemove.addEventListener("click", () => {
    const layer = coverLayers[activeCoverLayer];
    layer.visible = !layer.visible;
    renderCover();
    setStatus(layer.visible ? `${layer.label} возвращён на обложку.` : `${layer.label} удалён с обложки.`);
  });
  let coverDrag = null;
  ui.cover.addEventListener("pointerdown", (event) => {
    if (event.isPrimary === false || event.button > 0) return;
    const element = event.target.closest("[data-builder-layer]");
    if (!element || !ui.cover.contains(element)) {
      if (!selectedPhoto) return;
      const rect = ui.cover.getBoundingClientRect();
      coverDrag = {
        kind: "photo",
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        focusX: Number(ui.focusX.value),
        focusY: Number(ui.focusY.value),
        width: rect.width,
        height: rect.height,
        moved: false,
      };
      event.preventDefault();
      ui.cover.classList.add("is-dragging-photo");
      ui.cover.setPointerCapture(event.pointerId);
      setStatus("Фотография выбрана · тяните мышью, чтобы изменить кадрирование.");
      return;
    }
    const key = element.dataset.builderLayer;
    activeCoverLayer = key;
    const layer = coverLayers[key];
    const rect = ui.cover.getBoundingClientRect();
    coverDrag = { kind: "layer", id: event.pointerId, key, startX: event.clientX, startY: event.clientY, x: layer.x, y: layer.y, width: rect.width, height: rect.height, moved: false };
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    syncLayerInspector();
    applyCoverLayers();
  });
  ui.cover.addEventListener("pointermove", (event) => {
    if (!coverDrag || coverDrag.id !== event.pointerId) return;
    if (coverDrag.kind === "photo") {
      const deltaX = (event.clientX - coverDrag.startX) / coverDrag.width * 100;
      const deltaY = (event.clientY - coverDrag.startY) / coverDrag.height * 100;
      const focusX = Math.max(0, Math.min(100, coverDrag.focusX - deltaX));
      const focusY = Math.max(0, Math.min(100, coverDrag.focusY - deltaY));
      ui.focusX.value = String(Math.round(focusX));
      ui.focusY.value = String(Math.round(focusY));
      ui.cover.style.setProperty("--focus-x", `${ui.focusX.value}%`);
      ui.cover.style.setProperty("--focus-y", `${ui.focusY.value}%`);
      coverDrag.moved ||= Math.abs(event.clientX - coverDrag.startX) + Math.abs(event.clientY - coverDrag.startY) > 2;
      return;
    }
    const layer = coverLayers[coverDrag.key];
    const pointerDistance = Math.hypot(event.clientX - coverDrag.startX, event.clientY - coverDrag.startY);
    const precision = event.shiftKey
      ? 0.2
      : Math.min(1, coverTextDragSensitivity + pointerDistance / coverTextDragAccelerationDistance * (1 - coverTextDragSensitivity));
    layer.x = Math.max(-coverLayerOffsetLimit, Math.min(coverLayerOffsetLimit, Math.round((coverDrag.x + (event.clientX - coverDrag.startX) / coverDrag.width * 100 * precision) * 2) / 2));
    layer.y = Math.max(-coverLayerOffsetLimit, Math.min(coverLayerOffsetLimit, Math.round((coverDrag.y + (event.clientY - coverDrag.startY) / coverDrag.height * 100 * precision) * 2) / 2));
    coverDrag.moved ||= Math.abs(event.clientX - coverDrag.startX) + Math.abs(event.clientY - coverDrag.startY) > 2;
    applyCoverLayers();
    syncLayerInspector();
  });
  const finishCoverDrag = (event) => {
    if (!coverDrag || coverDrag.id !== event.pointerId) return;
    const moved = coverDrag.moved;
    const kind = coverDrag.kind;
    const label = kind === "layer" ? coverLayers[coverDrag.key].label : "фотография";
    coverDrag = null;
    ui.cover.classList.remove("is-dragging-photo");
    renderCover();
    setStatus(kind === "photo"
      ? moved ? "Кадрирование фотографии изменено и сохранено." : "Фотография выбрана; потяните её за свободное место."
      : moved ? `${label} перемещён мышкой.` : `${label} выбран.`);
  };
  ui.cover.addEventListener("pointerup", finishCoverDrag);
  ui.cover.addEventListener("pointercancel", finishCoverDrag);
  ui.refreshIdeas.addEventListener("click", () => refreshDiscovery());
  ui.closeDevelopment.addEventListener("click", () => {
    ui.development.hidden = true;
    selectedIdeaKey = "";
    renderIdeaStrip();
  });
  ui.ideaStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-builder-idea]");
    if (button) selectIdea(button.dataset.builderIdea);
  });
  ui.typeSystems?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-builder-series-system]");
    if (!button) return;
    activeSeriesSystem = button.dataset.builderSeriesSystem;
    renderTypeSystems();
    renderSlides();
    const system = selectedSeriesSystem();
    setStatus(`${system.family} × ${system.body} применены ко всей карусели.`);
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
  document.querySelectorAll("[data-builder-font]").forEach((button) => button.addEventListener("click", () => {
    activeFont = button.dataset.builderFont;
    const layer = coverLayers.headline;
    if (activeFont === "tempo") Object.assign(layer, { family: "PT Sans Narrow", weight: 700, lineHeight: .86, tracking: -.012 });
    if (activeFont === "grotesk") Object.assign(layer, { family: "Manrope", weight: 850, lineHeight: .93, tracking: -.04 });
    if (activeFont === "editorial") Object.assign(layer, { family: "Georgia", weight: 700, lineHeight: 1.03, tracking: -.025 });
    if (activeFont === "taste" && tasteFont) Object.assign(layer, { family: tasteFont.family, weight: 800, lineHeight: .96, tracking: -.025 });
    renderCover();
  }));
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
  ui.slideCount.addEventListener("change", () => {
    ui.subtitle.value = subtitleForGoal();
    renderCover();
    renderSlides();
    setStatus(`Сценарий перестроен на ${ui.slideCount.value} слайдов.`);
  });
  ui.focusX.addEventListener("input", renderCover);
  ui.focusY.addEventListener("input", renderCover);
  ui.slides.addEventListener("input", updateWordCount);
  ui.refreshScript.addEventListener("click", () => {
    scriptVariant = (scriptVariant + 1) % 3;
    renderSlides();
    setStatus(`Сценарий обновлён: вариант ${scriptVariant + 1} из 3.`);
  });
  ui.copyScript.addEventListener("click", async () => { await copyText(scriptText()); setStatus("Сценарий скопирован в буфер обмена."); });
  ui.buildCarousel.addEventListener("click", () => sendToCarouselBuilder(0));
  ui.sendToPost.addEventListener("click", () => sendToCarouselBuilder(0));
  ui.slides.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-builder-slide]");
    if (!button) return;
    sendToCarouselBuilder(Number(button.dataset.editBuilderSlide) || 0);
  });
  ui.mediaSearch.addEventListener("input", () => { mediaLimit = 40; renderMedia(); ui.mediaGrid.scrollTop = 0; });
  ui.mediaFolder.addEventListener("change", () => { mediaLimit = 40; renderMedia(); ui.mediaGrid.scrollTop = 0; });
  ui.showAllMedia.addEventListener("click", () => {
    mediaScope = mediaScope === "all" ? "relevant" : "all";
    mediaLimit = 40;
    renderMedia();
    setStatus(mediaScope === "all" ? "Открыт весь каталог медиатеки." : "Показаны фотографии по теме карусели.");
  });
  ui.shuffleMedia.addEventListener("click", () => {
    mediaOrder = shuffle(mediaOrder);
    mediaRandomized = true;
    mediaLimit = Math.max(mediaLimit, 40);
    renderMedia();
    setStatus("Фотографии перемешаны. Выбранная обложка сохранена.");
  });
  ui.mediaGrid.addEventListener("scroll", () => {
    if (ui.mediaGrid.scrollTop + ui.mediaGrid.clientHeight < ui.mediaGrid.scrollHeight - 180 || mediaLimit >= mediaPool.length) return;
    mediaLimit = Math.min(mediaLimit + 40, mediaPool.length);
    renderMedia();
  }, { passive: true });
  window.addEventListener("sekta:library-updated", () => {
    mediaOrder = [...library];
    renderMedia();
  });
  window.addEventListener("sekta:cover-builder-direction", (event) => {
    const direction = event.detail || {};
    if (styleLabels[direction.style]) activeStyle = direction.style;
    if (["bottom", "middle", "left", "right"].includes(direction.placement)) activePlacement = direction.placement;
    else if (direction.placement === "top") activePlacement = "middle";
    if (accentColors[direction.accent]) activeAccent = direction.accent;
    if (["auto", "ink", "white", "accent"].includes(direction.textColor)) activeTextColor = direction.textColor;
    if (fontLabels[direction.font]) activeFont = direction.font === "taste" && !tasteFont ? "grotesk" : direction.font;
    const layer = coverLayers.headline;
    if (activeFont === "tempo") Object.assign(layer, { family: "PT Sans Narrow", weight: 700, lineHeight: .86, tracking: -.012 });
    if (activeFont === "grotesk") Object.assign(layer, { family: "Manrope", weight: 850, lineHeight: .93, tracking: -.04 });
    if (activeFont === "editorial") Object.assign(layer, { family: "Georgia", weight: 700, lineHeight: 1.03, tracking: -.025 });
    if (activeFont === "taste" && tasteFont) Object.assign(layer, { family: tasteFont.family, weight: 800, lineHeight: .96, tracking: -.025 });
    renderCover();
    saveCoverSystem();
    setStatus(`Применено направление: ${styleLabels[activeStyle]} · ${fontLabels[activeFont]} · ${accentLabels[activeAccent]}.`);
  });
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

  narrowWorkspace.addEventListener?.("change", placeQuickControls);
  placeQuickControls();

  refreshTasteFont(false);
  restoreCoverSystem();
  renderTypeSystems();
  refreshDiscovery({ initial: true });
  setPreviewMode(activePreview);
})();
