(() => {
  const currentGrid = window.SEKTA_CURRENT_GRID || [];
  const snapshotAsOf = window.SEKTA_CURRENT_GRID_META?.asOf;
  const snapshotDate = new Date(`${snapshotAsOf}T00:00:00Z`);
  const hasSnapshotDate = Number.isFinite(snapshotDate.getTime());
  const snapshotDateLabel = hasSnapshotDate
    ? snapshotDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : "дата не указана";
  const weekPlan = window.SEKTA_SEED_PLAN || [];
  const idealGrid = window.SEKTA_IDEAL_GRID || [];
  const growthRoom = window.SEKTA_GROWTH_ROOM || { principles: [], next: [], ideas: [] };
  const growthIdeas = growthRoom.ideas || [];
  const libraryPayload = window.SEKTA_LIBRARY || { items: [], uniqueCount: 0, duplicateCount: 0, sourceCount: 0 };
  const library = libraryPayload.items || [];
  const driveOriginals = window.SEKTA_DRIVE_ORIGINALS || { items: {} };
  const peopleOverrideStorageKey = "sekta-media-people-overrides-v1";
  const { safeLink, createSandbox } = window.SEKTA_WORKSPACE_SAFETY;
  const canonicalPeopleOverrides = window.MEDIA_LIBRARY_MANUAL_OVERRIDES?.records || {};
  const mediaOverrides = window.SEKTA_MEDIA_OVERRIDES.create({
    getStorage: () => localStorage, key: peopleOverrideStorageKey,
    write: async () => { throw new Error("Общая синхронизация не настроена."); },
  });
  library.forEach((item) => {
    try {
      const canonicalRecord = canonicalPeopleOverrides[item.id];
      if (Array.isArray(canonicalRecord?.people)) applyPeopleToItem(item, canonicalRecord.people);
      if (typeof canonicalRecord?.top === "boolean") applyTopToItem(item, canonicalRecord.top);
      const localRecord = mediaOverrides.get(item.id);
      if (Array.isArray(localRecord?.people)) applyPeopleToItem(item, localRecord.people);
      if (typeof localRecord?.top === "boolean") applyTopToItem(item, localRecord.top);
    } catch {
      // Leave malformed stored records untouched; never erase a user's copy on startup.
    }
  });
  const viewLabels = { overview: "Рабочий обзор", ideal: "Идеальная сетка", growth: "Рост и идеи", builder: "Идеи и обложки", typography: "Типографика обложки", current: "Текущая сетка", library: "Медиатека", planner: "План недели" };
  const statusClass = (status) => status === "Готово" ? "status-ready" : status === "На ревью" || status === "Текст готов" ? "status-review" : "status-shoot";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

  const ui = {
    viewTitle: document.querySelector("#viewTitle"),
    sidebar: document.querySelector("#sidebar"),
    overviewGrid: document.querySelector("#overviewGrid"),
    currentGrid: document.querySelector("#currentGrid"),
    coverModeNote: document.querySelector("#coverModeNote"),
    gridVersionLabel: document.querySelector("#gridVersionLabel"),
    overviewWeek: document.querySelector("#overviewWeek"),
    calendarList: document.querySelector("#calendarList"),
    mediaGrid: document.querySelector("#mediaGrid"),
    librarySearch: document.querySelector("#librarySearch"),
    projectFilter: document.querySelector("#projectFilter"),
    materialTypeFilter: document.querySelector("#materialTypeFilter"),
    publicationFilter: document.querySelector("#publicationFilter"),
    themeFilter: document.querySelector("#themeFilter"),
    orientationFilter: document.querySelector("#orientationFilter"),
    librarySort: document.querySelector("#librarySort"),
    libraryNewestFirst: document.querySelector("#libraryNewestFirst"),
    libraryClearFilters: document.querySelector("#libraryClearFilters"),
    libraryResultCount: document.querySelector("#libraryResultCount"),
    libraryDuplicateSummary: document.querySelector("#libraryDuplicateSummary"),
    libraryShuffle: document.querySelector("#libraryShuffle"),
    scrollSentinel: document.querySelector("#libraryScrollSentinel"),
    sandboxGrid: document.querySelector("#sandboxGrid"),
    sandboxCount: document.querySelector("#sandboxCount"),
    idealFeedGrid: document.querySelector("#idealFeedGrid"),
    idealPosterGrid: document.querySelector("#idealPosterGrid"),
    idealDetail: document.querySelector("#idealDetail"),
    idealPosterDialog: document.querySelector("#idealPosterDialog"),
    growthPrinciples: document.querySelector("#growthPrinciples"),
    growthNext: document.querySelector("#growthNext"),
    growthIdeaGrid: document.querySelector("#growthIdeaGrid"),
    growthDetail: document.querySelector("#growthDetail"),
    growthAsset: document.querySelector("#growthAsset"),
    growthResultCount: document.querySelector("#growthResultCount"),
    detailDialog: document.querySelector("#detailDialog"),
    dialogContent: document.querySelector("#dialogContent"),
    carouselDialog: document.querySelector("#carouselDialog"),
    carouselImage: document.querySelector("#carouselImage"),
    carouselCounter: document.querySelector("#carouselCounter"),
    carouselDots: document.querySelector("#carouselDots"),
    returnCarouselDialog: document.querySelector("#returnCarouselDialog"),
    returnCarouselImage: document.querySelector("#returnCarouselImage"),
    returnCarouselCounter: document.querySelector("#returnCarouselCounter"),
    returnCarouselDots: document.querySelector("#returnCarouselDots"),
    toast: document.querySelector("#toast"),
  };

  let sectionFilter = "all";
  let visibleMedia = 42;
  let libraryOrder = [...library];
  let carouselSlide = 1;
  let returnCarouselSlide = 1;
  let activeIdealId = "2026-08-23";
  let activeIdealTab = "concept";
  let activeGrowthRoomTab = "ideas";
  let activeGrowthGoal = "all";
  let activeGrowthId = growthRoom.next?.[0] || growthIdeas[0]?.id;
  let currentCoverMode = "current";
  let toastTimer;
  const sandboxStore = createSandbox({ getStorage: () => localStorage, fallback: [
    { id: "approved-carousel", thumb: "assets/approved-carousel/slide-01.png", title: "Мои главные победы", source: "Готовая карусель" },
  ] });
  let sandbox = sandboxStore.get();

  function normalizePeople(values) {
    const people = [];
    const seen = new Set();
    for (const rawValue of values || []) {
      const value = String(rawValue).trim();
      if (!value || value === "Не определено") continue;
      if (value.length > 80) throw new Error("Одно имя не может быть длиннее 80 символов.");
      const key = value.toLocaleLowerCase("ru");
      if (!seen.has(key)) people.push(value);
      seen.add(key);
    }
    if (people.length > 12) throw new Error("Можно указать не больше 12 имён.");
    return people;
  }

  function parsePeople(value) {
    return normalizePeople(String(value || "").split(/[,;\n]+/));
  }

  function applyPeopleToItem(item, values) {
    const people = normalizePeople(values);
    const previous = new Set((item.people || []).map((value) => String(value).toLocaleLowerCase("ru")));
    item.people = people.length ? people : ["Не определено"];
    item.searchAliases = (item.searchAliases || []).filter((value) => !previous.has(String(value).toLocaleLowerCase("ru")));
    item.searchAliases.push(...people.filter((value) => !item.searchAliases.some((alias) => String(alias).toLocaleLowerCase("ru") === value.toLocaleLowerCase("ru"))));
  }

  function applyTopToItem(item, value) {
    item.isTop = Boolean(value);
    item.searchAliases ||= [];
    item.searchAliases = item.searchAliases.filter((alias) => String(alias).toLocaleLowerCase("ru") !== "топ");
    if (item.isTop) item.searchAliases.push("топ");
  }

  function mediaSaveStatus(id) {
    const error = mediaOverrides.storageError();
    if (error) return { message: error, state: "error" };
    const record = mediaOverrides.get(id);
    if (!record) return { message: "", state: "" };
    return { message: "Сохранено только в этом браузере. Общая синхронизация не настроена.", state: "success" };
  }

  function refreshMediaSaveStatus(id) {
    const editor = ui.dialogContent.querySelector(`[data-people-editor="${CSS.escape(id)}"]`);
    // Do not replace an editor or its error message while the user is typing.
    if (!editor || !editor.querySelector("form")?.hidden) return;
    const status = editor.querySelector(".people-save-status");
    if (!status) return;
    const saved = mediaSaveStatus(id);
    status.textContent = saved.message;
    status.dataset.state = saved.state;
  }

  function saveSandbox(next) {
    try {
      sandbox = sandboxStore.commit(next);
      renderSandbox();
      return true;
    } catch (error) {
      document.querySelector("#sandboxSaveStatus").textContent = error.message;
      toast(error.message, 8000);
      return false;
    }
  }

  function toast(message, duration = 2200) {
    clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => ui.toast.classList.remove("is-visible"), duration);
  }

  function setView(view) {
    if (!Object.hasOwn(viewLabels, view)) view = "overview";
    document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.viewPanel === view));
    document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    ui.viewTitle.textContent = viewLabels[view] || viewLabels.overview;
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (view === "library") ui.librarySearch.focus({ preventScroll: true });
    else {
      const heading = document.querySelector(`[data-view-panel="${view}"] h1`);
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
  }

  function feedTile(item, mode = "current") {
    const isProposed = mode === "proposed" && item.proposedImage;
    const image = isProposed ? item.proposedImage : item.image;
    const badge = isProposed ? "NEW" : item.pinned ? "◆" : item.type === "Reel" ? "▶" : "▣";
    return `<button class="feed-tile${isProposed ? " feed-tile-proposed" : ""}" data-current-id="${escapeHtml(item.id)}" data-label="${escapeHtml(item.title)}" aria-label="${escapeHtml(item.title)}, ${escapeHtml(item.type)}${isProposed ? ", новая обложка" : ""}"><img src="${escapeHtml(image)}" alt="" loading="lazy"><span class="feed-badge">${badge}</span></button>`;
  }

  function renderCurrent() {
    ui.overviewGrid.innerHTML = currentGrid.slice(0, 9).map((item) => feedTile(item)).join("");
    ui.currentGrid.innerHTML = currentGrid.map((item) => feedTile(item, currentCoverMode)).join("");
    const proposedCount = currentGrid.filter((item) => item.proposedImage).length;
    document.querySelectorAll("[data-cover-mode]").forEach((button) => {
      const active = button.dataset.coverMode === currentCoverMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.disabled = button.dataset.coverMode === "proposed" && proposedCount === 0;
      button.title = button.disabled ? "Новые обложки пока не подключены" : "";
    });
    if (ui.gridVersionLabel) ui.gridVersionLabel.textContent = currentCoverMode === "proposed" ? `примерка · ${proposedCount} новых обложек` : `снимок Instagram · ${snapshotDateLabel}`;
    if (ui.coverModeNote) ui.coverModeNote.textContent = currentCoverMode === "proposed" ? "Предлагаемая примерка: публикации остаются на месте, меняется только то, что человек видит в профиле." : `Сохранённая сетка Instagram · ${snapshotDateLabel}. Не обновляется автоматически.`;
  }

  function renderAppInfo() {
    const date = document.querySelector("#snapshotDate");
    date.textContent = snapshotDateLabel;
    if (hasSnapshotDate) date.dateTime = snapshotAsOf;
    const release = window.SEKTA_APP_VERSION;
    const version = document.querySelector("#appVersion");
    version.textContent = release?.version ? `v${release.version}` : "Версия не указана";
    const stage = document.querySelector("#appVersionStage");
    stage.hidden = release?.stage === "released";
    stage.textContent = release?.stage === "preview" ? "· превью" : "· статус не указан";
  }

  function weekItem(item) {
    return `<div class="week-item"><span class="week-day">${escapeHtml(item.day)}</span><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.type)}</span></div><span class="status ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`;
  }

  function renderWeek() {
    ui.overviewWeek.innerHTML = weekPlan.map(weekItem).join("");
    ui.calendarList.innerHTML = weekPlan.map((item) => `<article class="calendar-card"><div class="calendar-date">${escapeHtml(item.day)}</div><div class="calendar-main"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.type)}</span><div class="calendar-meta"><span>Задача: ${escapeHtml(item.objective)}</span><span>CTA: ${escapeHtml(item.cta)}</span></div></div><span class="status ${statusClass(item.status)}">${escapeHtml(item.status)}</span></article>`).join("");
  }

  function idealCoverMarkup(item, interactive = true) {
    const tag = interactive ? "button" : "div";
    const typeIcon = item.format.startsWith("Reel") ? "▶" : "▣";
    const image = item.cover ? `<img src="${escapeHtml(item.cover)}" alt="" loading="lazy">` : "";
    const selected = item.id === activeIdealId ? " is-selected" : "";
    const attrs = interactive ? `data-ideal-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.day)}: ${escapeHtml(item.headline)}"` : "";
    return `<${tag} class="ideal-cover ${escapeHtml(item.coverClass)}${selected}" ${attrs}>${image}<span class="cover-date">${escapeHtml(item.day.replace(/,.*$/, ""))} · ${escapeHtml(item.kind)}</span><span class="cover-type">${typeIcon}</span><span class="cover-headline">${escapeHtml(item.shortHeadline)}</span></${tag}>`;
  }

  function renderIdealGrid() {
    const newestFirst = [...idealGrid].reverse();
    ui.idealFeedGrid.innerHTML = newestFirst.map((item) => idealCoverMarkup(item)).join("");
    ui.idealPosterGrid.innerHTML = newestFirst.map((item) => idealCoverMarkup(item, false)).join("");
    renderIdealDetail();
  }

  function idealPanel(item) {
    if (activeIdealTab === "visual") {
      return `<h3>Визуальная режиссура</h3><ul>${item.visual.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>`;
    }
    if (activeIdealTab === "content") {
      return `<h3>Содержание по кадрам / слайдам</h3><ul>${item.content.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul><div class="ideal-cta"><span>CTA</span><strong>${escapeHtml(item.cta)}</strong></div>`;
    }
    if (activeIdealTab === "production") {
      return `<h3>Что нужно произвести</h3><div class="ideal-role">${escapeHtml(item.production)}</div><div class="ideal-cta"><span>Готовность</span><strong>${item.cover ? "Визуальное направление зафиксировано; проверить или заменить исходник по рекомендации." : "Обложка собирается графически; фотография не нужна."}</strong></div>`;
    }
    return `<h3>Зачем этот пост в ленте</h3><div class="ideal-role">${escapeHtml(item.role)}</div><blockquote class="ideal-quote">«${escapeHtml(item.caption)}»</blockquote><div class="ideal-cta"><span>CTA</span><strong>${escapeHtml(item.cta)}</strong></div>`;
  }

  function renderIdealDetail() {
    const item = idealGrid.find((post) => post.id === activeIdealId) || idealGrid[0];
    if (!item) return;
    const tabs = [
      ["concept", "Концепт"],
      ["visual", "Визуал"],
      ["content", "Содержание"],
      ["production", "Производство"],
    ];
    const index = idealGrid.findIndex((post) => post.id === item.id);
    const previous = idealGrid[(index - 1 + idealGrid.length) % idealGrid.length];
    const next = idealGrid[(index + 1) % idealGrid.length];
    ui.idealDetail.innerHTML = `<div class="ideal-detail-cover">${idealCoverMarkup(item, false)}<div class="ideal-detail-intro"><p class="eyebrow">${escapeHtml(item.day)} · ${escapeHtml(item.kind)}</p><h2>${escapeHtml(item.headline)}</h2><p>${escapeHtml(item.format)}</p></div></div><div class="ideal-tabs" role="tablist">${tabs.map(([id, label]) => `<button class="ideal-tab${activeIdealTab === id ? " is-active" : ""}" data-ideal-tab="${id}" role="tab" aria-selected="${activeIdealTab === id}">${label}</button>`).join("")}</div><div class="ideal-tab-panel">${idealPanel(item)}</div><div class="ideal-detail-foot"><button data-ideal-id="${previous.id}">← ${escapeHtml(previous.day.replace(/^... /, ""))}</button><span>${index + 1} из ${idealGrid.length}</span><button data-ideal-id="${next.id}">${escapeHtml(next.day.replace(/^... /, ""))} →</button></div>`;
    ui.idealFeedGrid.querySelectorAll("[data-ideal-id]").forEach((cover) => cover.classList.toggle("is-selected", cover.dataset.idealId === activeIdealId));
  }

  function goalLabel(goal) {
    return ({ reach: "Новые люди", warmth: "Теплота", saves: "Сохранения", comments: "Комментарии", conversion: "Переходы" })[goal] || goal;
  }

  function assetLabel(asset) {
    return ({ home: "Домашняя тренировка", body: "Тело / движение", community: "Команда / люди" })[asset] || asset;
  }

  function growthCover(item, size = "card") {
    return `<div class="growth-cover growth-cover-${escapeHtml(item.tone)} growth-cover-${size}"><img src="${escapeHtml(item.image)}" alt="" loading="lazy"><span class="growth-cover-kicker">REEL · ${escapeHtml(goalLabel(item.goal))}</span><strong>${escapeHtml(item.cover)}</strong><i>▶</i></div>`;
  }

  function renderGrowthPrinciples() {
    if (!ui.growthPrinciples) return;
    ui.growthPrinciples.innerHTML = growthRoom.principles.map((item, index) => `<article><span>0${index + 1}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></article>`).join("");
  }

  function renderGrowthNext() {
    if (!ui.growthNext) return;
    ui.growthNext.innerHTML = growthRoom.next.map((id, index) => growthIdeas.find((item) => item.id === id)).filter(Boolean).map((item, index) => `<button class="next-bet" data-growth-id="${escapeHtml(item.id)}"><span class="next-bet-number">0${index + 1}</span><div><small>${escapeHtml(goalLabel(item.goal))} · ${escapeHtml(item.duration)}</small><strong>${escapeHtml(item.title)}</strong><em>${escapeHtml(item.readiness)}</em></div><b>→</b></button>`).join("");
  }

  function filteredGrowthIdeas() {
    const asset = ui.growthAsset?.value || "all";
    return growthIdeas.filter((item) => (activeGrowthGoal === "all" || item.goal === activeGrowthGoal) && (asset === "all" || item.asset === asset));
  }

  function renderGrowthIdeas() {
    if (!ui.growthIdeaGrid) return;
    const filtered = filteredGrowthIdeas();
    if (!filtered.some((item) => item.id === activeGrowthId)) activeGrowthId = filtered[0]?.id;
    ui.growthResultCount.textContent = `${filtered.length} ${plural(filtered.length, "идея", "идеи", "идей")}`;
    ui.growthIdeaGrid.innerHTML = filtered.length ? filtered.map((item) => `<button class="growth-idea-card${item.id === activeGrowthId ? " is-selected" : ""}" data-growth-id="${escapeHtml(item.id)}">${growthCover(item)}<div class="growth-idea-copy"><span>${escapeHtml(item.format)} · ${escapeHtml(item.duration)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.readiness)}</small></div></button>`).join("") : `<div class="empty-state"><strong>Для этой связки пока нет идеи</strong><span>Выберите другие исходники или цель.</span></div>`;
    renderGrowthDetail();
  }

  function growthBriefText(item) {
    return `${item.title}\n\nЦель: ${goalLabel(item.goal)}\nИсходник: ${assetLabel(item.asset)}\nФормат: ${item.format}, ${item.duration}\n\nХук: ${item.hook}\n\nСценарий:\n${item.script.map((point, index) => `${index + 1}. ${point}`).join("\n")}\n\nВизуал: ${item.visual}\nОбложка: ${item.coverRule}\nCTA: ${item.cta}\nСмотрим: ${item.metric}`;
  }

  function renderGrowthDetail() {
    if (!ui.growthDetail) return;
    const item = growthIdeas.find((idea) => idea.id === activeGrowthId);
    if (!item) {
      ui.growthDetail.innerHTML = `<div class="growth-detail-empty"><strong>Выберите другую связку</strong><span>Здесь появится полный рецепт Reel.</span></div>`;
      return;
    }
    ui.growthDetail.innerHTML = `<div class="growth-detail-head">${growthCover(item, "detail")}<div><p class="eyebrow">${escapeHtml(item.priority)}</p><h2>${escapeHtml(item.title)}</h2><div class="growth-detail-tags"><span>${escapeHtml(goalLabel(item.goal))}</span><span>${escapeHtml(assetLabel(item.asset))}</span><span>${escapeHtml(item.duration)}</span></div></div></div><div class="growth-detail-body"><section class="growth-why"><span>Почему сработает</span><p>${escapeHtml(item.why)}</p></section><section><h3>Покадровый сценарий</h3><ol class="growth-script">${item.script.map((point, index) => `<li><span>0${index + 1}</span><p>${escapeHtml(point)}</p></li>`).join("")}</ol></section><div class="growth-recipe-grid"><section><h3>Визуал</h3><p>${escapeHtml(item.visual)}</p></section><section><h3>Обложка</h3><p>${escapeHtml(item.coverRule)}</p></section></div><div class="growth-action-row"><div><span>CTA</span><strong>${escapeHtml(item.cta)}</strong></div><div><span>Смотрим</span><strong>${escapeHtml(item.metric)}</strong></div></div></div><div class="growth-detail-foot"><span>${escapeHtml(item.readiness)}</span><button data-copy-growth="${escapeHtml(item.id)}">Скопировать бриф</button></div>`;
    ui.growthIdeaGrid.querySelectorAll("[data-growth-id]").forEach((card) => card.classList.toggle("is-selected", card.dataset.growthId === activeGrowthId));
  }

  function setGrowthRoomTab(tab) {
    activeGrowthRoomTab = tab;
    document.querySelectorAll("[data-growth-room-tab]").forEach((button) => {
      const selected = button.dataset.growthRoomTab === tab;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll("[data-growth-room-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.growthRoomPanel === tab));
  }

  async function copyGrowthBrief(item) {
    try {
      await navigator.clipboard.writeText(growthBriefText(item));
      toast("Бриф Reel скопирован");
    } catch {
      toast("Не удалось скопировать бриф");
    }
  }

  function filteredLibrary() {
    const query = ui.librarySearch.value.trim().toLocaleLowerCase("ru");
    const project = ui.projectFilter.value;
    const materialType = ui.materialTypeFilter.value;
    const publication = ui.publicationFilter.value;
    const orientation = ui.orientationFilter.value;
    const theme = ui.themeFilter.value;
    const filtered = libraryOrder.filter((item) => {
      const collections = item.collections || [];
      const inSection = sectionFilter === "all"
        ? item.publicationStatus !== "not-public"
        : sectionFilter === "top"
          ? item.isTop
          : collections.includes(sectionFilter);
      const hasProject = project === "all" || (item.projects || []).includes(project);
      const hasMaterialType = materialType === "all" || item.materialType === materialType;
      const hasPublication = publication === "all" || item.publicationStatus === publication;
      const hasOrientation = orientation === "all" || item.orientation === orientation;
      const hasTheme = theme === "all" || (item.topics || []).includes(theme);
      const searchText = [
        item.fileName,
        item.folderLabel,
        item.sourceCategory,
        item.sourceFolder,
        item.materialType,
        item.publicationStatus,
        item.captureDate,
        item.captureDateSource,
        item.sha256,
        item.camera?.make,
        item.camera?.model,
        ...(item.visionKeywords || []),
        ...(item.collections || []),
        ...(item.projects || []),
        ...(item.people || []),
        ...(item.topics || []),
        ...(item.searchAliases || []),
        ...(item.categories || []),
        ...(item.contentThemes || []),
        ...(item.carouselRoles || []),
      ].join(" ").replaceAll("_", " ").toLocaleLowerCase("ru");
      const matchesSearch = !query || searchText.includes(query);
      return inSection && hasProject && hasMaterialType && hasPublication && hasOrientation && hasTheme && matchesSearch;
    });
    const compareByDate = (field, direction) => (a, b) => {
      const aTime = Date.parse(a[field] || "");
      const bTime = Date.parse(b[field] || "");
      const aMissing = !Number.isFinite(aTime);
      const bMissing = !Number.isFinite(bTime);
      if (aMissing && bMissing) return String(a.id).localeCompare(String(b.id), "ru");
      if (aMissing) return 1;
      if (bMissing) return -1;
      return (aTime - bTime) * direction || String(a.id).localeCompare(String(b.id), "ru");
    };
    if (ui.librarySort.value === "capture-desc") return [...filtered].sort(compareByDate("captureDate", -1));
    if (ui.librarySort.value === "capture-asc") return [...filtered].sort(compareByDate("captureDate", 1));
    if (ui.librarySort.value === "modified-desc") return [...filtered].sort(compareByDate("modifiedAt", -1));
    return filtered;
  }

  function syncLibrarySortUi() {
    const newest = ui.librarySort.value === "capture-desc";
    ui.libraryNewestFirst?.classList.toggle("is-active", newest);
    ui.libraryNewestFirst?.setAttribute("aria-pressed", String(newest));
  }

  function shuffleLibrary() {
    for (let index = libraryOrder.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [libraryOrder[index], libraryOrder[target]] = [libraryOrder[target], libraryOrder[index]];
    }
    ui.librarySort.value = "default";
    syncLibrarySortUi();
    renderLibrary(true);
    toast("Медиатека перемешана — показываем новую подборку");
  }

  function renderLibrary(reset = false) {
    if (reset) visibleMedia = 42;
    const filtered = filteredLibrary();
    const shown = filtered.slice(0, visibleMedia);
    const orientationIcon = { portrait: "▯", landscape: "▭", square: "□" };
    ui.mediaGrid.innerHTML = shown.map((item) => {
      const typeBadge = item.mediaType === "video" ? `<span class="media-type-tag">▶ Видео</span>` : item.materialType === "neuro-photo" ? `<span class="media-type-tag media-type-ai">AI</span>` : "";
      const statusBadge = item.publicationStatus === "not-public" ? `<span class="media-status-tag media-status-stop">Не публиковать</span>` : item.publicationStatus === "review" ? `<span class="media-status-tag">Проверить</span>` : "";
      const topIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>`;
      return `<article class="media-card${item.isTop ? " is-top" : ""}" data-name="${escapeHtml(item.fileName)}"><button class="media-card-open" data-media-id="${escapeHtml(item.id)}" aria-label="Открыть ${escapeHtml(item.fileName)}"><img src="${escapeHtml(item.thumb)}" alt="" loading="lazy">${typeBadge}${statusBadge}<span class="orientation-tag">${orientationIcon[item.orientation] || "□"}</span></button><button class="media-card-top" data-toggle-top="${escapeHtml(item.id)}" aria-pressed="${Boolean(item.isTop)}" aria-label="${item.isTop ? "Убрать из топа" : "Добавить в топ"}">${topIcon}<span>${item.isTop ? "В топе" : "В топ"}</span></button></article>`;
    }).join("");
    ui.libraryResultCount.textContent = `${filtered.length} ${plural(filtered.length, "материал", "материала", "материалов")}`;
    ui.scrollSentinel.hidden = shown.length >= filtered.length;
    if (!filtered.length) ui.mediaGrid.innerHTML = `<div class="empty-state"><strong>Ничего не найдено</strong><span>Попробуйте убрать фильтр или изменить запрос.</span></div>`;
  }

  function plural(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
  }

  function renderSandbox() {
    const cells = [...sandbox];
    while (cells.length < 9) cells.push(null);
    ui.sandboxGrid.innerHTML = cells.map((item, index) => {
      if (!item) return `<div class="sandbox-tile sandbox-empty" aria-label="Пустая ячейка">+</div>`;
      return `<div class="sandbox-tile" tabindex="0" data-sandbox-index="${index}" title="${escapeHtml(item.title)}"><img src="${escapeHtml(item.thumb)}" alt="${escapeHtml(item.title)}"><div class="sandbox-controls"><button data-move="left" data-index="${index}" aria-label="Сдвинуть влево">←</button><button data-move="right" data-index="${index}" aria-label="Сдвинуть вправо">→</button><button data-remove="${index}" aria-label="Удалить из сетки">×</button></div></div>`;
    }).join("");
    ui.sandboxCount.textContent = `${sandbox.length} / 9`;
    document.querySelector("#navPlanCount").textContent = sandbox.length;
    document.querySelector("#sandboxSaveStatus").textContent = sandboxStore.error() || "Сетка сохранена только в этом браузере.";
  }

  function openCurrent(item) {
    const showProposed = currentCoverMode === "proposed" && item.proposedImage;
    const shownImage = showProposed ? item.proposedImage : item.image;
    const reason = showProposed ? item.coverReason : item.note;
    const download = showProposed ? `<a class="button button-secondary" href="${escapeHtml(safeLink(item.proposedImage))}" download>Скачать PNG</a>` : "";
    ui.dialogContent.innerHTML = `<div class="detail-layout"><div class="detail-image"><img src="${escapeHtml(shownImage)}" alt="${showProposed ? "Новая обложка" : "Превью публикации"} ${escapeHtml(item.title)}"></div><div class="detail-copy"><p class="eyebrow">${showProposed ? "Предлагаемая обложка" : item.pinned ? "Закреплённая публикация" : "Актуальная сетка"}</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(reason)}</p><div class="meta-list"><div class="meta-row"><span>Формат</span><strong>${escapeHtml(item.type)}</strong></div><div class="meta-row"><span>Дата</span><strong>${escapeHtml(item.date)} 2026</strong></div><div class="meta-row"><span>Версия</span><strong>${showProposed ? "Новая · 1080 × 1350" : "Сейчас"}</strong></div></div><div class="detail-actions"><a class="button button-primary" href="${escapeHtml(safeLink(item.url))}" target="_blank" rel="noreferrer">Открыть пост ↗</a>${download}</div></div></div>`;
    ui.detailDialog.classList.remove("is-landscape");
    ui.detailDialog.showModal();
  }

  function peopleEditorMarkup(item) {
    const people = normalizePeople(item.people || []);
    const saved = mediaSaveStatus(item.id);
    const tags = people.length
      ? people.map((person) => `<span class="people-tag">${escapeHtml(person)}</span>`).join("")
      : `<span class="people-empty">Не определено</span>`;
    const buttonLabel = people.length ? "Изменить" : "Добавить";
    const inputId = `people-input-${item.id}`;
    return `<div class="media-taxonomy people-editor" data-people-editor="${escapeHtml(item.id)}"><div class="people-editor-head"><span>Кто в кадре</span><button type="button" class="people-edit-button" data-edit-people="${escapeHtml(item.id)}">${buttonLabel}</button></div><div class="people-tags">${tags}</div><form class="people-form" data-people-form="${escapeHtml(item.id)}" hidden><label for="${escapeHtml(inputId)}">Имена через запятую</label><input id="${escapeHtml(inputId)}" name="people" value="${escapeHtml(people.join(", "))}" maxlength="980" autocomplete="off" placeholder="Например: Вера, Оля"><p class="people-hint">До 12 имён. Пустое поле вернёт статус «Не определено».</p><div class="people-form-actions"><button type="submit" class="button button-primary">Сохранить</button><button type="button" class="button button-secondary" data-cancel-people>Отмена</button></div></form><p class="people-save-status" role="status" aria-live="polite" data-state="${saved.state}">${escapeHtml(saved.message)}</p></div>`;
  }

  function replacePeopleEditor(item, message = "", state = "") {
    const current = ui.dialogContent.querySelector(`[data-people-editor="${CSS.escape(item.id)}"]`);
    if (!current) return;
    current.outerHTML = peopleEditorMarkup(item);
    const next = ui.dialogContent.querySelector(`[data-people-editor="${CSS.escape(item.id)}"]`);
    const status = next?.querySelector(".people-save-status");
    if (status) {
      status.textContent = message;
      status.dataset.state = state;
    }
  }

  function savePeopleFromForm(form) {
    const item = library.find((entry) => entry.id === form.dataset.peopleForm);
    if (!item) return;
    const status = form.parentElement.querySelector(".people-save-status");
    let people;
    try {
      people = parsePeople(new FormData(form).get("people"));
      mediaOverrides.stage(item.id, { people });
    } catch (error) {
      status.textContent = error.message;
      status.dataset.state = "error";
      return;
    }
    applyPeopleToItem(item, people);
    const saved = mediaSaveStatus(item.id);
    replacePeopleEditor(item, saved.message, saved.state);
    renderLibrary();
    toast("Имена сохранены в этом браузере");
  }

  function toggleTop(item) {
    if (!item) return;
    const next = !item.isTop;
    try {
      mediaOverrides.stage(item.id, { top: next });
    } catch (error) {
      toast(error.message, 8000);
      return;
    }
    applyTopToItem(item, next);
    renderLibrary();
    const dialogTop = ui.dialogContent.querySelector(`[data-toggle-top="${CSS.escape(item.id)}"]`);
    if (dialogTop) {
      dialogTop.textContent = next ? "В топе" : "Добавить в топ";
      dialogTop.classList.toggle("button-top-active", next);
      dialogTop.classList.toggle("button-secondary", !next);
      dialogTop.setAttribute("aria-pressed", String(next));
    }
    // Updating the top button must not discard unsaved names in the open form.
    refreshMediaSaveStatus(item.id);
    toast(next ? "Добавлено в топ в этом браузере" : "Убрано из топа в этом браузере");
  }

  function openMedia(item) {
    const duplicateText = item.duplicates.length ? `${item.duplicates.length} ${plural(item.duplicates.length, "дубль", "дубля", "дублей")}` : "нет";
    const themes = (item.contentThemes || []).length ? `<div class="media-taxonomy"><span>Темы</span><p>${item.contentThemes.map((tag) => escapeHtml(formatTaxonomy(tag))).join(" · ")}</p></div>` : "";
    const roles = (item.carouselRoles || []).length ? `<div class="media-taxonomy"><span>Роли в карусели</span><p>${item.carouselRoles.map((tag) => escapeHtml(formatTaxonomy(tag))).join(" · ")}</p></div>` : "";
    const category = item.sourceCategory ? ` · ${escapeHtml(formatTaxonomy(item.sourceCategory))}` : "";
    const localPathAvailable = Boolean(item.originalPath && !String(item.originalPath).includes("скрыт в публичной версии"));
    const driveOriginal = driveOriginals.items?.[item.id];
    const remoteOriginalUrl = safeLink(item.originalResolution?.remoteUrl) || safeLink(item.originalUrl);
    const originalDownloadUrl = driveOriginal?.id
      ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveOriginal.id)}`
      : remoteOriginalUrl;
    const previewDownloadUrl = safeLink(item.thumb);
    const originalFileName = String(driveOriginal?.fileName || item.fileName || `sekta-${item.id || "media"}`);
    const extensionMatch = originalFileName.match(/\.([a-z0-9]+)$/i);
    const extension = (extensionMatch?.[1] || item.fileExtension || "jpg").toLocaleLowerCase("ru");
    const safeBaseName = String(item.fileName || `sekta-${item.id || "media"}`).replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "-").trim() || `sekta-${item.id || "media"}`;
    const originalIsRemote = /^https?:\/\//i.test(originalDownloadUrl);
    const originalAction = originalDownloadUrl
      ? `<a class="button button-primary" href="${escapeHtml(originalDownloadUrl)}" ${originalIsRemote ? 'target="_blank" rel="noreferrer"' : `download="${escapeHtml(originalFileName)}"`} data-download-original="true">Скачать оригинал · ${escapeHtml(extension.toLocaleUpperCase("ru"))}</a>`
      : `<button class="button button-primary" type="button" disabled title="Оригинал ещё не подключён">Оригинал пока недоступен</button>`;
    const previewAction = previewDownloadUrl ? `<a class="button button-secondary" href="${escapeHtml(previewDownloadUrl)}" download="${escapeHtml(`${safeBaseName}-preview.jpg`)}" data-download-preview>Скачать превью</a>` : "";
    const copyAction = localPathAvailable ? `<button class="button button-secondary" data-copy-path="${escapeHtml(item.originalPath)}">Скопировать путь</button>` : "";
    const sourceNote = driveOriginal
      ? `<div class="path-box path-box-ready"><span aria-hidden="true">●</span> Оригинал подключён из командного архива Google Drive</div>`
      : originalDownloadUrl
        ? `<div class="path-box path-box-ready"><span aria-hidden="true">●</span> Оригинал подключён к загрузке без уменьшения</div>`
        : localPathAvailable
          ? `<div class="path-box" title="${escapeHtml(item.originalPath)}">${escapeHtml(item.originalPath)}</div>`
          : `<div class="path-box">Оригинал ещё не подключён. Превью остаётся отдельным файлом.</div>`;
    const media = `<img src="${escapeHtml(item.thumb)}" alt="${escapeHtml(item.fileName)}">`;
    const projects = (item.projects || []).length ? `<div class="media-taxonomy"><span>Проекты</span><p>${item.projects.map(escapeHtml).join(" · ")}</p></div>` : "";
    const people = peopleEditorMarkup(item);
    const typeLabels = { "real-photo": "Реальная фотография", "neuro-photo": "Нейрофотография", "ai-reference": "AI-референс", template: "Шаблон", video: "Видео" };
    const statusLabels = { approved: "Можно публиковать", review: "Проверить перед публикацией", "not-public": "Не публиковать" };
    const captureDate = item.captureDate ? new Date(item.captureDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "не определена";
    const camera = [item.camera?.make, item.camera?.model].filter(Boolean).join(" · ") || "не определена";
    const originalStatus = ({ "verified-local": "Локальный оригинал проверен", "verified-local-and-remote": "Локальный и Drive-оригинал", "remote-only": "Только удалённый оригинал", unresolved: "Оригинал не найден" })[item.originalResolution?.status] || "Не проверено";
    const addAction = item.publicationStatus === "not-public" || item.mediaType === "video" ? "" : `<button class="button button-primary" data-add-media="${escapeHtml(item.id)}">+ В будущую сетку</button>`;
    const topAction = `<button class="button ${item.isTop ? "button-top-active" : "button-secondary"}" data-toggle-top="${escapeHtml(item.id)}">${item.isTop ? "В топе" : "Добавить в топ"}</button>`;
    ui.dialogContent.innerHTML = `<div class="detail-layout"><div class="detail-image">${media}</div><div class="detail-copy"><p class="eyebrow">${escapeHtml(item.folderLabel)}${category}</p><h2>${escapeHtml(item.fileName)}</h2><p>В интерфейсе используется лёгкое превью. «Скачать оригинал» берёт только исходный файл и больше не подменяет его уменьшенной картинкой.</p><div class="meta-list"><div class="meta-row"><span>Тип</span><strong>${escapeHtml(typeLabels[item.materialType] || item.materialType || "Материал")}</strong></div><div class="meta-row"><span>Публикация</span><strong>${escapeHtml(statusLabels[item.publicationStatus] || item.publicationStatus || "Не указан")}</strong></div><div class="meta-row"><span>Дата съёмки</span><strong>${escapeHtml(captureDate)}</strong></div><div class="meta-row"><span>Камера</span><strong>${escapeHtml(camera)}</strong></div><div class="meta-row"><span>Оригинал</span><strong>${escapeHtml(originalDownloadUrl ? "Подключён без уменьшения" : originalStatus)}</strong></div><div class="meta-row"><span>Размер превью</span><strong>${item.width} × ${item.height}</strong></div><div class="meta-row"><span>Ориентация</span><strong>${orientationLabel(item.orientation)}</strong></div><div class="meta-row"><span>Вес оригинала</span><strong>${item.sizeMb} МБ</strong></div><div class="meta-row"><span>SHA-256</span><strong>${escapeHtml(item.sha256 ? item.sha256.slice(0, 12) + "…" : "не рассчитан")}</strong></div><div class="meta-row"><span>Точные дубли</span><strong>${duplicateText}</strong></div></div>${projects}${people}${themes}${roles}<div class="detail-actions">${originalAction}${previewAction}${topAction}${addAction}${copyAction}</div>${sourceNote}</div></div>`;
    ui.detailDialog.classList.toggle("is-landscape", item.orientation === "landscape");
    if (!ui.detailDialog.open) ui.detailDialog.showModal();
  }

  function formatTaxonomy(value) {
    return String(value)
      .split("/")
      .map((part) => part.replace(/^\d+_/, "").replaceAll("_", " "))
      .join(" / ");
  }

  function orientationLabel(value) {
    return ({ portrait: "вертикальная", landscape: "горизонтальная", square: "квадратная" })[value] || value;
  }

  function addMedia(item) {
    if (!item || item.publicationStatus === "not-public" || item.mediaType === "video") return;
    if (sandbox.some((entry) => entry.id === item.id)) return toast("Это фото уже есть в будущей сетке");
    if (sandbox.length >= 9) return toast("В песочнице уже девять ячеек — удалите одну");
    if (!saveSandbox([{ id: item.id, thumb: item.thumb, title: item.fileName, source: item.folderLabel }, ...sandbox])) return;
    ui.detailDialog.close();
    toast("Фото добавлено в начало будущей сетки");
  }

  async function copyPath(path) {
    try {
      await navigator.clipboard.writeText(path);
      toast("Путь к оригиналу скопирован");
    } catch {
      toast("Не удалось скопировать — путь виден ниже");
    }
  }

  function moveSandbox(index, direction) {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= sandbox.length) return;
    if (!Number.isInteger(index) || index < 0 || index >= sandbox.length) return;
    const next = [...sandbox];
    [next[index], next[target]] = [next[target], next[index]];
    if (saveSandbox(next)) ui.sandboxGrid.querySelector(`[data-index="${target}"][data-move="${direction}"]`)?.focus();
  }

  function openCarousel() {
    carouselSlide = 1;
    renderCarousel();
    ui.carouselDialog.showModal();
  }

  function renderCarousel() {
    const number = String(carouselSlide).padStart(2, "0");
    ui.carouselImage.src = `assets/approved-carousel/slide-${number}.png`;
    ui.carouselImage.alt = `Слайд ${carouselSlide} готовой карусели`;
    ui.carouselCounter.textContent = `${carouselSlide} / 20`;
    ui.carouselDots.querySelectorAll("button").forEach((dot, index) => dot.classList.toggle("is-active", index + 1 === carouselSlide));
  }

  function shiftCarousel(delta) {
    carouselSlide = ((carouselSlide - 1 + delta + 20) % 20) + 1;
    renderCarousel();
  }

  function openReturnCarousel() {
    returnCarouselSlide = 1;
    renderReturnCarousel();
    ui.returnCarouselDialog.showModal();
  }

  function renderReturnCarousel() {
    const number = String(returnCarouselSlide).padStart(2, "0");
    ui.returnCarouselImage.src = `assets/return-five-carousel/slide-${number}.png`;
    ui.returnCarouselImage.alt = `Слайд ${returnCarouselSlide} карусели «Пропустили пять дней?»`;
    ui.returnCarouselCounter.textContent = `${returnCarouselSlide} / 10`;
    ui.returnCarouselDots.querySelectorAll("button").forEach((dot, index) => dot.classList.toggle("is-active", index + 1 === returnCarouselSlide));
  }

  function shiftReturnCarousel(delta) {
    returnCarouselSlide = ((returnCarouselSlide - 1 + delta + 10) % 10) + 1;
    renderReturnCarousel();
  }

  document.querySelectorAll(".nav-item[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.jump)));
  const mobileMenu = document.querySelector("#mobileMenu");
  const sidebarBackdrop = document.querySelector("#sidebarBackdrop");
  const mobileViewport = window.matchMedia("(max-width: 820px)");
  function setMobileMenu(open, restoreFocus = false) {
    const expanded = mobileViewport.matches && open;
    ui.sidebar.classList.toggle("is-open", expanded);
    ui.sidebar.inert = mobileViewport.matches && !expanded;
    sidebarBackdrop.hidden = !expanded;
    mobileMenu.setAttribute("aria-expanded", String(expanded));
    mobileMenu.setAttribute("aria-label", expanded ? "Закрыть меню" : "Открыть меню");
    if (expanded) ui.sidebar.querySelector(".nav-item.is-active")?.focus();
    else if (restoreFocus) mobileMenu.focus();
  }
  mobileMenu.addEventListener("click", () => setMobileMenu(!ui.sidebar.classList.contains("is-open")));
  sidebarBackdrop.addEventListener("click", () => setMobileMenu(false, true));
  mobileViewport.addEventListener("change", () => setMobileMenu(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && ui.sidebar.classList.contains("is-open")) setMobileMenu(false, true);
  });
  setMobileMenu(false);
  document.querySelectorAll("#openCarousel, #openCarouselVisual, #openCarouselSecond").forEach((button) => button.addEventListener("click", openCarousel));
  document.querySelectorAll("#openReturnCarousel, #openReturnCarouselSecond").forEach((button) => button.addEventListener("click", openReturnCarousel));
  document.querySelector("#openIdealPoster").addEventListener("click", () => ui.idealPosterDialog.showModal());
  document.querySelector("#carouselPrev").addEventListener("click", () => shiftCarousel(-1));
  document.querySelector("#carouselNext").addEventListener("click", () => shiftCarousel(1));
  document.querySelector("#returnCarouselPrev").addEventListener("click", () => shiftReturnCarousel(-1));
  document.querySelector("#returnCarouselNext").addEventListener("click", () => shiftReturnCarousel(1));
  document.querySelector("[data-close]").addEventListener("click", () => ui.detailDialog.close());
  document.querySelector("[data-close-carousel]").addEventListener("click", () => ui.carouselDialog.close());
  document.querySelector("[data-close-return-carousel]").addEventListener("click", () => ui.returnCarouselDialog.close());
  document.querySelector("[data-close-ideal-poster]").addEventListener("click", () => ui.idealPosterDialog.close());
  document.querySelector("#resetPlanner").addEventListener("click", () => {
    if (!confirm("Вернуть песочницу к исходному состоянию?")) return;
    if (!saveSandbox([{ id: "approved-carousel", thumb: "assets/approved-carousel/slide-01.png", title: "Мои главные победы", source: "Готовая карусель" }])) return;
    toast("Черновая сетка сброшена");
  });

  window.addEventListener("sekta:add-generated-cover", (event) => {
    const item = event.detail;
    if (!item?.thumb) return;
    if (sandbox.length >= 9) return toast("В песочнице уже девять ячеек — удалите одну");
    if (!saveSandbox([item, ...sandbox])) return;
    item.saved = true;
    toast("Обложка добавлена в будущую сетку");
  });

  document.addEventListener("click", (event) => {
    const topButton = event.target.closest("[data-toggle-top]");
    if (topButton) {
      event.preventDefault();
      toggleTop(library.find((item) => item.id === topButton.dataset.toggleTop));
      return;
    }
    const currentButton = event.target.closest("[data-current-id]");
    if (currentButton) openCurrent(currentGrid.find((item) => item.id === currentButton.dataset.currentId));
    const mediaButton = event.target.closest("[data-media-id]");
    if (mediaButton) openMedia(library.find((item) => item.id === mediaButton.dataset.mediaId));
    const addButton = event.target.closest("[data-add-media]");
    if (addButton) addMedia(library.find((item) => item.id === addButton.dataset.addMedia));
    const copyButton = event.target.closest("[data-copy-path]");
    if (copyButton) copyPath(copyButton.dataset.copyPath);
    if (event.target.closest("[data-download-original]")) toast("Открываем ссылку на оригинал. Доступ и начало скачивания зависят от источника.");
    if (event.target.closest("[data-download-preview]")) toast("Скачивается лёгкое превью");
    const editPeopleButton = event.target.closest("[data-edit-people]");
    if (editPeopleButton) {
      const editor = editPeopleButton.closest("[data-people-editor]");
      const form = editor?.querySelector("[data-people-form]");
      if (form) {
        form.hidden = false;
        editPeopleButton.hidden = true;
        form.querySelector("input")?.focus();
      }
    }
    const cancelPeopleButton = event.target.closest("[data-cancel-people]");
    if (cancelPeopleButton) {
      const editor = cancelPeopleButton.closest("[data-people-editor]");
      const form = editor?.querySelector("[data-people-form]");
      if (form) form.hidden = true;
      const editButton = editor?.querySelector("[data-edit-people]");
      if (editButton) {
        editButton.hidden = false;
        editButton.focus();
      }
    }
    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      const index = Number(removeButton.dataset.remove);
      if (!Number.isInteger(index) || index < 0 || index >= sandbox.length) return;
      if (!saveSandbox(sandbox.filter((_, position) => position !== index))) return;
      (ui.sandboxGrid.querySelector(`[data-remove="${Math.min(index, sandbox.length - 1)}"]`) || document.querySelector("#resetPlanner"))?.focus();
      toast("Материал удалён из песочницы");
    }
    const moveButton = event.target.closest("[data-move]");
    if (moveButton) moveSandbox(Number(moveButton.dataset.index), moveButton.dataset.move);
    const sandboxTile = event.target.closest("[data-sandbox-index]");
    if (sandboxTile && !event.target.closest("button")) sandboxTile.classList.toggle("is-selected");
    const idealButton = event.target.closest("[data-ideal-id]");
    if (idealButton) {
      activeIdealId = idealButton.dataset.idealId;
      activeIdealTab = "concept";
      renderIdealDetail();
      if (window.innerWidth < 821) ui.idealDetail.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const idealTab = event.target.closest("[data-ideal-tab]");
    if (idealTab) {
      activeIdealTab = idealTab.dataset.idealTab;
      renderIdealDetail();
    }
    const growthRoomTab = event.target.closest("[data-growth-room-tab]");
    if (growthRoomTab) setGrowthRoomTab(growthRoomTab.dataset.growthRoomTab);
    const growthButton = event.target.closest("[data-growth-id]");
    if (growthButton) {
      activeGrowthId = growthButton.dataset.growthId;
      setView("growth");
      setGrowthRoomTab("ideas");
      renderGrowthIdeas();
      if (window.innerWidth < 981) ui.growthDetail.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const copyGrowthButton = event.target.closest("[data-copy-growth]");
    if (copyGrowthButton) copyGrowthBrief(growthIdeas.find((item) => item.id === copyGrowthButton.dataset.copyGrowth));
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest?.("[data-people-form]");
    if (!form) return;
    event.preventDefault();
    savePeopleFromForm(form);
  });

  document.querySelectorAll("[data-growth-goal]").forEach((button) => button.addEventListener("click", () => {
    activeGrowthGoal = button.dataset.growthGoal;
    document.querySelectorAll("[data-growth-goal]").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    renderGrowthIdeas();
  }));
  document.querySelectorAll("[data-cover-mode]").forEach((button) => button.addEventListener("click", () => {
    currentCoverMode = button.dataset.coverMode;
    renderCurrent();
  }));
  ui.growthAsset?.addEventListener("change", renderGrowthIdeas);

  document.querySelectorAll(".filter-chip[data-section]").forEach((button) => button.addEventListener("click", () => {
    sectionFilter = button.dataset.section;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    renderLibrary(true);
  }));
  ui.librarySearch.addEventListener("input", () => renderLibrary(true));
  ui.projectFilter.addEventListener("change", () => renderLibrary(true));
  ui.materialTypeFilter.addEventListener("change", () => renderLibrary(true));
  ui.publicationFilter.addEventListener("change", () => renderLibrary(true));
  ui.themeFilter.addEventListener("change", () => renderLibrary(true));
  ui.orientationFilter.addEventListener("change", () => renderLibrary(true));
  ui.librarySort.addEventListener("change", () => {
    syncLibrarySortUi();
    renderLibrary(true);
  });
  ui.libraryNewestFirst?.addEventListener("click", () => {
    ui.librarySort.value = "capture-desc";
    syncLibrarySortUi();
    renderLibrary(true);
    toast("Сначала показаны новые съёмки");
  });
  ui.libraryClearFilters.addEventListener("click", () => {
    sectionFilter = "all";
    ui.librarySearch.value = "";
    [ui.projectFilter, ui.materialTypeFilter, ui.publicationFilter, ui.themeFilter, ui.orientationFilter].forEach((select) => { select.value = "all"; });
    ui.librarySort.value = "capture-desc";
    syncLibrarySortUi();
    document.querySelectorAll(".filter-chip[data-section]").forEach((chip) => chip.classList.toggle("is-active", chip.dataset.section === "all"));
    renderLibrary(true);
    toast("Фильтры сброшены");
  });
  if ("IntersectionObserver" in window) {
    const libraryScrollObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (visibleMedia >= filteredLibrary().length) return;
      visibleMedia += 42;
      renderLibrary();
    }, { rootMargin: "700px 0px" });
    libraryScrollObserver.observe(ui.scrollSentinel);
  } else {
    visibleMedia = libraryOrder.length;
    renderLibrary();
  }
  ui.libraryShuffle.addEventListener("click", shuffleLibrary);
  ui.carouselDots.innerHTML = Array.from({ length: 20 }, (_, index) => `<button data-slide="${index + 1}" aria-label="Слайд ${index + 1}"></button>`).join("");
  ui.carouselDots.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-slide]");
    if (!dot) return;
    carouselSlide = Number(dot.dataset.slide);
    renderCarousel();
  });
  ui.returnCarouselDots.innerHTML = Array.from({ length: 10 }, (_, index) => `<button data-return-slide="${index + 1}" aria-label="Слайд ${index + 1}"></button>`).join("");
  ui.returnCarouselDots.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-return-slide]");
    if (!dot) return;
    returnCarouselSlide = Number(dot.dataset.returnSlide);
    renderReturnCarousel();
  });
  document.addEventListener("keydown", (event) => {
    if (ui.carouselDialog.open) {
      if (event.key === "ArrowLeft") shiftCarousel(-1);
      if (event.key === "ArrowRight") shiftCarousel(1);
    }
    if (ui.returnCarouselDialog.open) {
      if (event.key === "ArrowLeft") shiftReturnCarousel(-1);
      if (event.key === "ArrowRight") shiftReturnCarousel(1);
    }
  });

  document.querySelector("#metricUnique").textContent = libraryPayload.uniqueCount;
  document.querySelector("#navLibraryCount").textContent = libraryPayload.uniqueCount;
  document.querySelector("#builderLibraryCount").textContent = libraryPayload.uniqueCount;
  document.querySelector("#librarySummary").textContent = `${libraryPayload.uniqueCount} материалов в едином каталоге`;
  const collectionCount = Object.keys(libraryPayload.byCollection || {}).filter((key) => key !== "archive").length;
  document.querySelector("#libraryCollectionCount").textContent = `${collectionCount} ${plural(collectionCount, "коллекция", "коллекции", "коллекций")}`;
  ui.libraryDuplicateSummary.textContent = `${libraryPayload.duplicateCount} ${plural(libraryPayload.duplicateCount, "точный дубль скрыт", "точных дубля скрыты", "точных дублей скрыты")}`;
  renderAppInfo();
  renderCurrent();
  renderWeek();
  renderIdealGrid();
  renderGrowthPrinciples();
  renderGrowthNext();
  renderGrowthIdeas();
  syncLibrarySortUi();
  renderLibrary();
  renderSandbox();
  const mediaAuditLink = document.querySelector("#mediaAuditLink");
  if (mediaAuditLink && location.protocol === "file:") mediaAuditLink.hidden = false;
  if (location.hash === "#typography") setView("typography");
  window.addEventListener("hashchange", () => { if (location.hash === "#typography") setView("typography"); });
})();
