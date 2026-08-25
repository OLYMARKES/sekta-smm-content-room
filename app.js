(() => {
  const currentGrid = window.SEKTA_CURRENT_GRID || [];
  const weekPlan = window.SEKTA_SEED_PLAN || [];
  const idealGrid = window.SEKTA_IDEAL_GRID || [];
  const growthRoom = window.SEKTA_GROWTH_ROOM || { principles: [], next: [], ideas: [] };
  const growthIdeas = growthRoom.ideas || [];
  const ideaRadar = window.SEKTA_IDEA_RADAR || { sources: [], mechanics: [], directions: {}, items: [] };
  const libraryPayload = window.SEKTA_LIBRARY || { items: [], uniqueCount: 0, duplicateCount: 0, sourceCount: 0 };
  const library = libraryPayload.items || [];
  const publicStats = window.SEKTA_PUBLIC_STATS || { checkedAt: "", note: "", channels: [] };
  const viewLabels = { overview: "Рабочий обзор", growth: "Банк идей", coach: "Коуч роста", builder: "Идеи и обложки", postbuilder: "Конструктор поста", current: "Текущая сетка", library: "Медиатека", planner: "План недели" };
  const statusClass = (status) => status === "Готово" ? "status-ready" : status === "На ревью" || status === "Текст готов" ? "status-review" : "status-shoot";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

  const ui = {
    viewTitle: document.querySelector("#viewTitle"),
    sidebar: document.querySelector("#sidebar"),
    overviewGrid: document.querySelector("#overviewGrid"),
    saveOverviewGrid: document.querySelector("#saveOverviewGrid"),
    overviewSnapshotDate: document.querySelector("#overviewSnapshotDate"),
    overviewSnapshotCount: document.querySelector("#overviewSnapshotCount"),
    overviewSnapshotCountButton: document.querySelector("#overviewSnapshotCountButton"),
    snapshotHistoryPanel: document.querySelector("#snapshotHistoryPanel"),
    snapshotHistory: document.querySelector("#snapshotHistory"),
    snapshotHistoryLabel: document.querySelector("#snapshotHistoryLabel"),
    publicChannelList: document.querySelector("#publicChannelList"),
    publicStatsChecked: document.querySelector("#publicStatsChecked"),
    publicStatsNote: document.querySelector("#publicStatsNote"),
    currentGrid: document.querySelector("#currentGrid"),
    coverModeNote: document.querySelector("#coverModeNote"),
    gridVersionLabel: document.querySelector("#gridVersionLabel"),
    overviewWeek: document.querySelector("#overviewWeek"),
    calendarList: document.querySelector("#calendarList"),
    mediaGrid: document.querySelector("#mediaGrid"),
    librarySearch: document.querySelector("#librarySearch"),
    themeFilter: document.querySelector("#themeFilter"),
    orientationFilter: document.querySelector("#orientationFilter"),
    libraryResultCount: document.querySelector("#libraryResultCount"),
    libraryDuplicateSummary: document.querySelector("#libraryDuplicateSummary"),
    libraryShuffle: document.querySelector("#libraryShuffle"),
    libraryUploadZone: document.querySelector("#libraryUploadZone"),
    libraryUploadInput: document.querySelector("#libraryUploadInput"),
    libraryUploadState: document.querySelector("#libraryUploadState"),
    libraryUploadClear: document.querySelector("#libraryUploadClear"),
    libraryInfiniteSentinel: document.querySelector("#libraryInfiniteSentinel"),
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
    ideaSourceRadar: document.querySelector("#ideaSourceRadar"),
    ideaBankGrid: document.querySelector("#ideaBankGrid"),
    ideaMechanicFilter: document.querySelector("#ideaMechanicFilter"),
    ideaBankResult: document.querySelector("#ideaBankResult"),
    ideaBankRecipe: document.querySelector("#ideaBankRecipe"),
    mixIdeaRadar: document.querySelector("#mixIdeaRadar"),
    refreshIdeaBank: document.querySelector("#refreshIdeaBank"),
    ideaDetailDialog: document.querySelector("#ideaDetailDialog"),
    ideaDetailContent: document.querySelector("#ideaDetailContent"),
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

  let folderFilter = "all";
  let visibleMedia = 42;
  let libraryOrder = [...library];
  let localUploads = [];
  let carouselSlide = 1;
  let returnCarouselSlide = 1;
  let activeIdealId = "2026-08-23";
  let activeIdealTab = "concept";
  let activeGrowthRoomTab = "ideas";
  let activeGrowthGoal = "all";
  let activeIdeaKind = "post";
  let activeIdeaSource = "all";
  let activeIdeaMechanic = "all";
  let ideaBankOffset = 0;
  let activeGrowthId = growthRoom.next?.[0] || growthIdeas[0]?.id;
  let currentCoverMode = "current";
  let toastTimer;
  let sandbox = loadSandbox();
  let gridSnapshots = loadGridSnapshots();

  const gridSnapshotKey = "sekta-grid-snapshots-v1";

  const ideaBankCatalog = ideaRadar.items.reduce((catalog, item) => {
    const kind = item.kind || "post";
    if (!catalog[kind]) catalog[kind] = [];
    catalog[kind].push(item);
    return catalog;
  }, { post: [], reel: [], series: [] });

  function loadSandbox() {
    const fallback = [{ id: "approved-carousel", thumb: "assets/approved-carousel/slide-01.png", title: "Мои главные победы", source: "Готовая карусель" }];
    try {
      const saved = JSON.parse(localStorage.getItem("sekta-sandbox"));
      return Array.isArray(saved) && saved.length ? saved.slice(0, 9) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveSandbox() {
    localStorage.setItem("sekta-sandbox", JSON.stringify(sandbox));
  }

  function sharedGridSnapshot() {
    return {
      id: "shared-2026-08-20",
      capturedAt: "2026-08-20T17:35:00+08:00",
      sourceDate: "снято из Instagram 20 августа 2026",
      scope: "общая версия",
      items: currentGrid.map((item) => ({ id: item.id, image: item.image, title: item.title })),
    };
  }

  function loadGridSnapshots() {
    const shared = sharedGridSnapshot();
    try {
      const local = JSON.parse(localStorage.getItem("sekta-grid-snapshots-v1"));
      return [...(Array.isArray(local) ? local : []), shared].sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt)).slice(0, 9);
    } catch {
      return [shared];
    }
  }

  function gridFingerprint(items) {
    return items.map((item) => `${item.id}:${item.image}`).join("|");
  }

  function saveCurrentGridSnapshot() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const items = currentGrid.map((item) => ({ id: item.id, image: item.image, title: item.title }));
    const fingerprint = gridFingerprint(items);
    const existingIndex = gridSnapshots.findIndex((snapshot) => snapshot.scope === "локально" && snapshot.capturedAt?.slice(0, 10) === today && gridFingerprint(snapshot.items || []) === fingerprint);
    const snapshot = {
      id: `local-${now.getTime()}`,
      capturedAt: now.toISOString(),
      sourceDate: "версия сетки от 20 августа 2026",
      scope: "локально",
      items,
    };
    if (existingIndex >= 0) gridSnapshots.splice(existingIndex, 1, snapshot);
    else gridSnapshots.unshift(snapshot);
    const localSnapshots = gridSnapshots.filter((item) => item.scope === "локально").slice(0, 8);
    localStorage.setItem(gridSnapshotKey, JSON.stringify(localSnapshots));
    gridSnapshots = [...localSnapshots, sharedGridSnapshot()];
    renderGridSnapshots();
    ui.saveOverviewGrid.textContent = "Снимок сохранён";
    setTimeout(() => { ui.saveOverviewGrid.textContent = "Сохранить снимок"; }, 1800);
    toast("Показанная сетка сохранена в истории этого браузера");
  }

  function snapshotDate(value, short = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("ru-RU", short ? { day: "2-digit", month: "2-digit" } : { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function renderGridSnapshots() {
    const latest = gridSnapshots[0] || sharedGridSnapshot();
    ui.overviewSnapshotDate.textContent = snapshotDate(latest.capturedAt, true);
    ui.overviewSnapshotCount.textContent = gridSnapshots.length;
    ui.overviewSnapshotCount.nextElementSibling.textContent = `${plural(gridSnapshots.length, "снимок", "снимка", "снимков")} в истории`;
    ui.snapshotHistoryLabel.textContent = `${gridSnapshots.length} ${plural(gridSnapshots.length, "версия", "версии", "версий")}`;
    ui.snapshotHistory.innerHTML = gridSnapshots.map((snapshot) => {
      const thumbs = (snapshot.items || []).slice(0, 3).map((item) => `<img src="${escapeHtml(item.image)}" alt="">`).join("");
      return `<article class="snapshot-row"><div class="snapshot-thumbs" aria-hidden="true">${thumbs}</div><div class="snapshot-copy"><strong>${escapeHtml(snapshotDate(snapshot.capturedAt))}</strong><span>${escapeHtml(snapshot.sourceDate)} · ${snapshot.items?.length || 0} публикаций</span></div><small>${escapeHtml(snapshot.scope)}</small></article>`;
    }).join("");
  }

  function renderPublicStats() {
    ui.publicStatsChecked.textContent = publicStats.checkedAt ? `Проверено по открытым источникам · ${publicStats.checkedAt}` : "Публичные источники пока не подключены";
    ui.publicStatsNote.textContent = publicStats.note || "Публичные показатели не заменяют внутреннюю аналитику платформ.";
    ui.publicChannelList.innerHTML = publicStats.channels.length ? publicStats.channels.map((channel) => `<article class="public-channel"><div class="public-channel-name"><strong>${escapeHtml(channel.name)}</strong><span>${escapeHtml(channel.handle)}</span></div><div class="public-channel-metrics">${channel.metrics.map((metric) => `<div><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></div>`).join("")}</div><div class="public-channel-source"><span>${escapeHtml(channel.sourceLabel)}</span><a href="${escapeHtml(channel.sourceUrl)}" target="_blank" rel="noreferrer">Открыть источник ↗</a></div></article>`).join("") : `<div class="snapshot-empty">Открытые источники пока не дали проверяемых показателей.</div>`;
  }

  function toast(message) {
    clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => ui.toast.classList.remove("is-visible"), 2200);
  }

  function setView(view) {
    document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.viewPanel === view));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
    ui.viewTitle.textContent = viewLabels[view] || viewLabels.overview;
    document.querySelector("#resetPlanner")?.classList.toggle("is-hidden", view !== "planner");
    ui.sidebar.classList.remove("is-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view === "library") ui.librarySearch.focus({ preventScroll: true });
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
    document.querySelectorAll("[data-cover-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.coverMode === currentCoverMode));
    if (ui.gridVersionLabel) ui.gridVersionLabel.textContent = "фактический снимок · 20 августа";
    if (ui.coverModeNote) ui.coverModeNote.textContent = "Три закреплённых публикации и девять следующих карточек показаны в том же порядке, что в профиле 20 августа.";
  }

  function weekItem(item) {
    return `<div class="week-item"><span class="week-day">${escapeHtml(item.day)}</span><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.type)}</span></div><span class="status ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`;
  }

  function renderWeek() {
    ui.overviewWeek.innerHTML = weekPlan.filter((item) => !item.type.includes("@olymarkes")).map(weekItem).join("");
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

  const ideaSource = (id) => ideaRadar.sources.find((source) => source.id === id) || { id, label: "Рабочая идея", note: "курированный источник", tone: "paper" };
  const ideaMechanic = (id) => ideaRadar.mechanics.find((mechanic) => mechanic.id === id) || { id, label: "Новый заход" };
  const ideaDirection = (id) => ideaRadar.directions?.[id] || { label: "Система #Sekta", note: "базовая визуальная система" };

  function renderIdeaSources() {
    if (!ui.ideaSourceRadar) return;
    const all = { id: "all", label: "Все источники", count: ideaRadar.items.length, note: "смешать архив, науку, личный голос и готовые механики", tone: "ink" };
    ui.ideaSourceRadar.innerHTML = [all, ...ideaRadar.sources].map((source) => `<button type="button" class="idea-source-card tone-${escapeHtml(source.tone || "paper")}${activeIdeaSource === source.id ? " is-active" : ""}" data-idea-source="${escapeHtml(source.id)}" aria-pressed="${activeIdeaSource === source.id}"><span>${escapeHtml(source.label)}</span><strong>${escapeHtml(source.count)}</strong><small>${escapeHtml(source.note)}</small></button>`).join("");
  }

  function filteredIdeaBank() {
    return (ideaBankCatalog[activeIdeaKind] || []).map((item, index) => ({ item, index })).filter(({ item }) => (activeIdeaSource === "all" || item.source === activeIdeaSource) && (activeIdeaMechanic === "all" || item.mechanic === activeIdeaMechanic));
  }

  function renderIdeaBank() {
    if (!ui.ideaBankGrid) return;
    const catalog = filteredIdeaBank();
    if (!catalog.length) {
      ui.ideaBankGrid.innerHTML = `<div class="idea-bank-empty"><strong>Для такой связки пока нет готовой идеи</strong><span>Смешайте источники или выберите другую механику.</span><button class="button button-secondary" type="button" data-reset-idea-radar>Показать всё</button></div>`;
      ui.ideaBankResult.textContent = "0 идей";
      ui.ideaBankRecipe.textContent = "измените один из фильтров";
      return;
    }
    ideaBankOffset %= catalog.length;
    const visible = Array.from({ length: Math.min(6, catalog.length) }, (_, offset) => catalog[(ideaBankOffset + offset) % catalog.length]);
    const sourceLabel = activeIdeaSource === "all" ? "все источники" : ideaSource(activeIdeaSource).label;
    const mechanicLabel = activeIdeaMechanic === "all" ? "все механики" : ideaMechanic(activeIdeaMechanic).label;
    ui.ideaBankResult.textContent = `${catalog.length} ${plural(catalog.length, "идея", "идеи", "идей")} в этой связке`;
    ui.ideaBankRecipe.textContent = `${sourceLabel} · ${mechanicLabel}`;
    ui.ideaBankGrid.innerHTML = visible.map(({ item, index }, position) => {
      const source = ideaSource(item.source);
      const mechanic = ideaMechanic(item.mechanic);
      const direction = ideaDirection(item.direction);
      const reference = `${activeIdeaKind}:${index}`;
      return `<article class="idea-bank-card${position === 0 && visible.length > 2 ? " is-featured" : ""}" data-idea-card="${reference}"><div class="idea-card-visual direction-${escapeHtml(item.direction)}"><span>${escapeHtml(source.label)}</span><strong>${escapeHtml(item.hook)}</strong><small>${escapeHtml(direction.label)}</small></div><div class="idea-card-copy"><div class="idea-bank-meta"><span>${escapeHtml(item.objective)}</span><em>${escapeHtml(mechanic.label)}</em></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.angle)}</p><dl><div><dt>Исходник</dt><dd>${escapeHtml(item.asset)}</dd></div><div><dt>Готовность</dt><dd>${escapeHtml(item.readiness)}</dd></div></dl><div class="idea-bank-actions"><button type="button" class="button button-secondary" data-idea-detail="${reference}">Развернуть</button><button type="button" class="button button-primary" data-idea-build-post="${reference}">В монтаж →</button></div></div></article>`;
    }).join("");
  }

  function catalogIdea(reference) {
    const [kind, rawIndex] = String(reference || "").split(":");
    const item = ideaBankCatalog[kind]?.[Number(rawIndex)];
    return item ? { ...item, kind, id: `${kind}-${rawIndex}`, sourceMeta: ideaSource(item.source), mechanicMeta: ideaMechanic(item.mechanic), direction: ideaDirection(item.direction) } : null;
  }

  function ideaDescription(item) {
    const kindText = item.kind === "reel" ? "Reel можно собрать как короткий сценарий и при необходимости превратить в поясняющую карусель." : item.kind === "series" ? "Это повторяемая рубрика: первый выпуск должен сразу объяснить механику серии и дать читателю простой вход." : "Это самостоятельный пост-карусель: начинаем с узнаваемого напряжения, затем даём новую рамку и один выполнимый следующий шаг.";
    return `${kindText} ${item.angle} Главная мысль — «${item.hook}». Не доказываем её абстрактно: показываем через ${item.asset.toLocaleLowerCase("ru")}.`;
  }

  function ideaBeats(item) {
    const beats = {
      "then-now": ["Показываем исходную фразу и точную дату.", "Отделяем то, что было контекстом времени.", "Формулируем, что выдержало проверку.", "Добавляем сегодняшний кадр или комментарий.", `CTA: ${item.cta}.`],
      myth: ["Называем миф без насмешки над человеком.", "Коротко объясняем, почему он звучит убедительно.", "Показываем один механизм или доказательство.", "Даём практический вывод без нового запрета.", `CTA: ${item.cta}.`],
      confession: ["Одна честная фраза без долгой экспозиции.", "Живая сцена, которая подтверждает её.", "Разрешаем противоречие, не исправляя себя.", "Один вывод, полезный не только автору.", `CTA: ${item.cta}.`],
      experiment: ["Называем один вопрос для проверки.", "Фиксируем безопасные условия эксперимента.", "Показываем процесс, а не обещанный результат.", "Предлагаем читателю наблюдать за собой.", `CTA: ${item.cta}.`],
      series: ["Первый выпуск сразу объясняет правило рубрики.", "Один источник превращается в один самостоятельный тезис.", "Визуальная система повторяется, содержание — нет.", "Следующий выпуск рождается из ответа аудитории.", `CTA: ${item.cta}.`],
    };
    return beats[item.mechanic] || ["Сцена, которую легко узнать.", "Неожиданный поворот рамки.", "Один конкретный пример.", "Выполнимое действие или вопрос.", `CTA: ${item.cta}.`];
  }

  function openIdeaDetail(reference) {
    const item = catalogIdea(reference);
    if (!item || !ui.ideaDetailDialog || !ui.ideaDetailContent) return;
    const needsReview = /ревью|специалист|методическ|эксперт/i.test(item.readiness);
    ui.ideaDetailContent.innerHTML = `<header class="idea-detail-head"><span>${escapeHtml(item.kind === "post" ? "Пост / карусель" : item.kind === "reel" ? "Reel" : "Серия")} · ${escapeHtml(item.mechanicMeta.label)}</span><h2 id="ideaDetailTitle">${escapeHtml(item.title)}</h2><p>${escapeHtml(item.hook)}</p></header><div class="idea-detail-body"><section class="idea-origin"><div><span>Источник</span><strong>${escapeHtml(item.sourceMeta.label)}</strong><p>${escapeHtml(item.sourceMeta.note)}</p></div><div><span>Визуальное направление</span><strong>${escapeHtml(item.direction.label)}</strong><p>${escapeHtml(item.direction.note)}</p></div></section><section><h3>О чём этот материал</h3><p>${escapeHtml(ideaDescription(item))}</p></section><dl><div><dt>Задача</dt><dd>${escapeHtml(item.objective)}</dd></div><div><dt>Исходники</dt><dd>${escapeHtml(item.asset)}</dd></div><div><dt>Действие читателя</dt><dd>${escapeHtml(item.cta)}</dd></div><div><dt>Готовность</dt><dd>${escapeHtml(item.readiness)}</dd></div></dl>${needsReview ? `<p class="idea-review-gate">Перед публикацией нужен человеческий методический или экспертный ревью.</p>` : ""}<section><h3>Предлагаемая драматургия</h3><ol>${ideaBeats(item).map((beat) => `<li>${escapeHtml(beat)}</li>`).join("")}</ol></section></div><footer class="idea-detail-actions"><button class="button button-secondary" type="button" data-idea-cover="${escapeHtml(reference)}">Только обложка</button><button class="button button-primary" type="button" data-idea-build-post="${escapeHtml(reference)}">Собрать с этой системой →</button></footer>`;
    ui.ideaDetailDialog.showModal();
  }

  function startPostBuilder(item) {
    if (!item) return;
    ui.ideaDetailDialog?.close();
    setView("postbuilder");
    window.dispatchEvent(new CustomEvent("sekta:post-builder-load", { detail: item }));
    toast("Идея открыта в конструкторе поста");
  }

  function startCoverBuilder(item) {
    if (!item) return;
    ui.ideaDetailDialog?.close();
    setView("builder");
    const hookInput = document.querySelector("#builderHook");
    if (hookInput) {
      hookInput.value = item.hook;
      hookInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    window.dispatchEvent(new CustomEvent("sekta:cover-builder-direction", { detail: item.direction?.coverBuilder || {} }));
    toast(`Обложка открыта в системе «${item.direction?.label || "#Sekta"}»`);
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
    ui.growthDetail.innerHTML = `<div class="growth-detail-head">${growthCover(item, "detail")}<div><p class="eyebrow">${escapeHtml(item.priority)}</p><h2>${escapeHtml(item.title)}</h2><div class="growth-detail-tags"><span>${escapeHtml(goalLabel(item.goal))}</span><span>${escapeHtml(assetLabel(item.asset))}</span><span>${escapeHtml(item.duration)}</span></div></div></div><div class="growth-detail-body"><section class="growth-why"><span>Почему сработает</span><p>${escapeHtml(item.why)}</p></section><section><h3>Покадровый сценарий</h3><ol class="growth-script">${item.script.map((point, index) => `<li><span>0${index + 1}</span><p>${escapeHtml(point)}</p></li>`).join("")}</ol></section><div class="growth-recipe-grid"><section><h3>Визуал</h3><p>${escapeHtml(item.visual)}</p></section><section><h3>Обложка</h3><p>${escapeHtml(item.coverRule)}</p></section></div><div class="growth-action-row"><div><span>CTA</span><strong>${escapeHtml(item.cta)}</strong></div><div><span>Смотрим</span><strong>${escapeHtml(item.metric)}</strong></div></div></div><div class="growth-detail-foot"><span>${escapeHtml(item.readiness)}</span><div><button data-copy-growth="${escapeHtml(item.id)}">Скопировать бриф</button><button class="button button-primary" data-build-growth-post="${escapeHtml(item.id)}">Собрать пост</button></div></div>`;
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
    const orientation = ui.orientationFilter.value;
    const theme = ui.themeFilter.value;
    return libraryOrder.filter((item) => {
      const inFolder = folderFilter === "all" || item.folder === folderFilter;
      const hasOrientation = orientation === "all" || item.orientation === orientation;
      const hasTheme = theme === "all" || item.contentThemes.includes(theme);
      const searchText = [item.fileName, item.folderLabel, item.sourceCategory, ...(item.contentThemes || []), ...(item.carouselRoles || [])].join(" ").toLocaleLowerCase("ru");
      const matchesSearch = !query || searchText.includes(query);
      return inFolder && hasOrientation && hasTheme && matchesSearch;
    });
  }

  function shuffleLibrary() {
    for (let index = libraryOrder.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [libraryOrder[index], libraryOrder[target]] = [libraryOrder[target], libraryOrder[index]];
    }
    renderLibrary(true);
    toast("Медиатека перемешана — показываем новую подборку");
  }

  function imageDimensions(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = url;
    });
  }

  async function addLocalUploads(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith("image/"));
    if (!files.length) return toast("Для быстрой загрузки выберите JPEG, PNG или WebP");
    ui.libraryUploadState.textContent = `Добавляем ${files.length}…`;
    const added = [];
    for (const [index, file] of files.entries()) {
      const thumb = URL.createObjectURL(file);
      try {
        const { width, height } = await imageDimensions(thumb);
        added.push({
          id: `local-${Date.now()}-${index}`,
          folder: "intake",
          folderLabel: "Локальный черновик",
          sourceCategory: "быстрая загрузка",
          sourceFolder: "local-upload",
          fileName: file.name,
          originalPath: file.name,
          originalUrl: thumb,
          thumb,
          exportImage: thumb,
          width,
          height,
          orientation: width > height ? "landscape" : width < height ? "portrait" : "square",
          exportQuality: "instagram-ready",
          sizeMb: Number((file.size / 1024 / 1024).toFixed(1)),
          modifiedAt: new Date(file.lastModified || Date.now()).toISOString(),
          contentThemes: [],
          carouselRoles: [],
          duplicates: [],
          isLocalUpload: true,
        });
      } catch {
        URL.revokeObjectURL(thumb);
      }
    }
    localUploads.unshift(...added);
    library.unshift(...added);
    libraryOrder = [...localUploads, ...libraryOrder];
    ui.libraryUploadInput.value = "";
    ui.libraryUploadState.textContent = `Локальный черновик · ${localUploads.length}`;
    ui.libraryUploadClear.hidden = !localUploads.length;
    renderLibrary(true);
    window.dispatchEvent(new CustomEvent("sekta:library-updated"));
    toast(`${added.length} ${plural(added.length, "фото добавлено", "фото добавлены", "фото добавлены")} в локальный черновик`);
  }

  function clearLocalUploads() {
    const ids = new Set(localUploads.map((item) => item.id));
    localUploads.forEach((item) => URL.revokeObjectURL(item.thumb));
    for (let index = library.length - 1; index >= 0; index -= 1) {
      if (ids.has(library[index].id)) library.splice(index, 1);
    }
    libraryOrder = libraryOrder.filter((item) => !ids.has(item.id));
    localUploads = [];
    ui.libraryUploadState.textContent = "Локальный черновик · 0";
    ui.libraryUploadClear.hidden = true;
    renderLibrary(true);
    window.dispatchEvent(new CustomEvent("sekta:library-updated"));
    toast("Локальный черновик очищен");
  }

  function renderLibrary(reset = false) {
    if (reset) visibleMedia = 42;
    const filtered = filteredLibrary();
    const shown = filtered.slice(0, visibleMedia);
    const orientationIcon = { portrait: "▯", landscape: "▭", square: "□" };
    ui.mediaGrid.innerHTML = shown.map((item) => `<button class="media-card" data-media-id="${item.id}" data-name="${escapeHtml(item.fileName)}" aria-label="Открыть ${escapeHtml(item.fileName)}"><img src="${escapeHtml(item.thumb)}" alt="" loading="lazy"><span class="orientation-tag">${orientationIcon[item.orientation] || "□"}</span></button>`).join("");
    ui.libraryResultCount.textContent = `${filtered.length} ${plural(filtered.length, "материал", "материала", "материалов")}`;
    ui.libraryInfiniteSentinel.hidden = shown.length >= filtered.length;
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
    const planCount = weekPlan.length + Math.max(0, sandbox.length - 1);
    document.querySelector("#navPlanCount").textContent = planCount;
    document.querySelector("#overviewPlanCount").textContent = planCount;
  }

  function openCurrent(item) {
    const showProposed = currentCoverMode === "proposed" && item.proposedImage;
    const shownImage = showProposed ? item.proposedImage : item.image;
    const reason = showProposed ? item.coverReason : item.note;
    const download = showProposed ? `<a class="button button-secondary" href="${escapeHtml(item.proposedImage)}" download>Скачать PNG</a>` : "";
    ui.dialogContent.innerHTML = `<div class="detail-layout"><div class="detail-image"><img src="${escapeHtml(shownImage)}" alt="${showProposed ? "Новая обложка" : "Превью публикации"} ${escapeHtml(item.title)}"></div><div class="detail-copy"><p class="eyebrow">${showProposed ? "Предлагаемая обложка" : item.pinned ? "Закреплённая публикация" : "Актуальная сетка"}</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(reason)}</p><div class="meta-list"><div class="meta-row"><span>Формат</span><strong>${escapeHtml(item.type)}</strong></div><div class="meta-row"><span>Дата</span><strong>${escapeHtml(item.date)} 2026</strong></div><div class="meta-row"><span>Версия</span><strong>${showProposed ? "Новая · 1080 × 1350" : "Сейчас"}</strong></div></div><div class="detail-actions"><a class="button button-primary" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Открыть пост ↗</a>${download}</div></div></div>`;
    ui.detailDialog.showModal();
  }

  function openMedia(item) {
    const duplicateText = item.duplicates.length ? `${item.duplicates.length} ${plural(item.duplicates.length, "дубль", "дубля", "дублей")}` : "нет";
    const themes = (item.contentThemes || []).length ? `<div class="media-taxonomy"><span>Темы</span><p>${item.contentThemes.map((tag) => escapeHtml(formatTaxonomy(tag))).join(" · ")}</p></div>` : "";
    const roles = (item.carouselRoles || []).length ? `<div class="media-taxonomy"><span>Роли в карусели</span><p>${item.carouselRoles.map((tag) => escapeHtml(formatTaxonomy(tag))).join(" · ")}</p></div>` : "";
    const category = item.sourceCategory ? ` · ${escapeHtml(formatTaxonomy(item.sourceCategory))}` : "";
    const localPathAvailable = Boolean(item.originalUrl);
    const copyAction = localPathAvailable ? `<button class="button button-secondary" data-copy-path="${escapeHtml(item.originalPath)}">Скопировать путь</button>` : "";
    const sourceNote = localPathAvailable ? `<div class="path-box" title="${escapeHtml(item.originalPath)}">${escapeHtml(item.originalPath)}</div>` : `<div class="path-box">Оригинал — в личной медиатеке; для передачи используйте имя файла выше.</div>`;
    const qualityLabel = item.exportQuality === "source-limited" ? "исходник меньше формата Instagram" : "готово для 1080 × 1350";
    ui.dialogContent.innerHTML = `<div class="detail-layout"><div class="detail-image"><img src="${escapeHtml(item.thumb)}" alt="${escapeHtml(item.fileName)}"></div><div class="detail-copy"><p class="eyebrow">${escapeHtml(item.folderLabel)}${category}</p><h2>${escapeHtml(item.fileName)}</h2><p>В сетке используется лёгкое превью, а при экспорте конструктор автоматически берёт HQ-копию.</p><div class="meta-list"><div class="meta-row"><span>Размер</span><strong>${item.width} × ${item.height}</strong></div><div class="meta-row"><span>Качество экспорта</span><strong>${qualityLabel}</strong></div><div class="meta-row"><span>Ориентация</span><strong>${orientationLabel(item.orientation)}</strong></div><div class="meta-row"><span>Вес оригинала</span><strong>${item.sizeMb} МБ</strong></div><div class="meta-row"><span>Точные дубли</span><strong>${duplicateText}</strong></div></div>${themes}${roles}<div class="detail-actions"><button class="button button-primary" data-add-media="${item.id}">+ В будущую сетку</button>${copyAction}</div>${sourceNote}</div></div>`;
    ui.detailDialog.showModal();
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
    if (sandbox.some((entry) => entry.id === item.id)) return toast("Это фото уже есть в будущей сетке");
    if (sandbox.length >= 9) return toast("В песочнице уже девять ячеек — удалите одну");
    sandbox.unshift({ id: item.id, thumb: item.thumb, title: item.fileName, source: item.folderLabel });
    saveSandbox();
    renderSandbox();
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
    [sandbox[index], sandbox[target]] = [sandbox[target], sandbox[index]];
    saveSandbox();
    renderSandbox();
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

  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.jump)));
  ui.saveOverviewGrid?.addEventListener("click", saveCurrentGridSnapshot);
  ui.overviewSnapshotCountButton?.addEventListener("click", () => ui.snapshotHistoryPanel?.scrollIntoView({ behavior: "smooth", block: "start" }));
  document.querySelector("#mobileMenu").addEventListener("click", () => ui.sidebar.classList.toggle("is-open"));
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
    sandbox = [{ id: "approved-carousel", thumb: "assets/approved-carousel/slide-01.png", title: "Мои главные победы", source: "Готовая карусель" }];
    saveSandbox();
    renderSandbox();
    toast("Черновая сетка сброшена");
  });

  window.addEventListener("sekta:add-generated-cover", (event) => {
    const item = event.detail;
    if (!item?.thumb) return;
    if (sandbox.length >= 9) return toast("В песочнице уже девять ячеек — удалите одну");
    sandbox.unshift(item);
    saveSandbox();
    renderSandbox();
    toast("Обложка добавлена в будущую сетку");
  });

  document.addEventListener("click", (event) => {
    const currentButton = event.target.closest("[data-current-id]");
    if (currentButton) openCurrent(currentGrid.find((item) => item.id === currentButton.dataset.currentId));
    const mediaButton = event.target.closest("[data-media-id]");
    if (mediaButton) openMedia(library.find((item) => item.id === mediaButton.dataset.mediaId));
    const addButton = event.target.closest("[data-add-media]");
    if (addButton) addMedia(library.find((item) => item.id === addButton.dataset.addMedia));
    const copyButton = event.target.closest("[data-copy-path]");
    if (copyButton) copyPath(copyButton.dataset.copyPath);
    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      sandbox.splice(Number(removeButton.dataset.remove), 1);
      saveSandbox();
      renderSandbox();
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
    const growthPostButton = event.target.closest("[data-build-growth-post]");
    if (growthPostButton) {
      const item = growthIdeas.find((idea) => idea.id === growthPostButton.dataset.buildGrowthPost);
      if (item) startPostBuilder({ id: item.id, kind: "reel", title: item.title, hook: item.hook, objective: goalLabel(item.goal), asset: `${assetLabel(item.asset)} · ${item.visual}`, cta: item.cta, readiness: item.readiness });
    }
  });

  document.querySelectorAll("[data-growth-goal]").forEach((button) => button.addEventListener("click", () => {
    activeGrowthGoal = button.dataset.growthGoal;
    document.querySelectorAll("[data-growth-goal]").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    renderGrowthIdeas();
  }));
  document.querySelectorAll("[data-idea-kind]").forEach((button) => button.addEventListener("click", () => {
    activeIdeaKind = button.dataset.ideaKind;
    ideaBankOffset = 0;
    document.querySelectorAll("[data-idea-kind]").forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    renderIdeaBank();
  }));
  ui.ideaSourceRadar?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-idea-source]");
    if (!button) return;
    activeIdeaSource = button.dataset.ideaSource;
    ideaBankOffset = 0;
    renderIdeaSources();
    renderIdeaBank();
  });
  ui.ideaMechanicFilter?.addEventListener("change", () => {
    activeIdeaMechanic = ui.ideaMechanicFilter.value;
    ideaBankOffset = 0;
    renderIdeaBank();
  });
  ui.mixIdeaRadar?.addEventListener("click", () => {
    activeIdeaSource = "all";
    activeIdeaMechanic = "all";
    ideaBankOffset = Math.floor(Math.random() * Math.max(1, ideaBankCatalog[activeIdeaKind].length));
    if (ui.ideaMechanicFilter) ui.ideaMechanicFilter.value = "all";
    renderIdeaSources();
    renderIdeaBank();
    toast("Источники смешаны — показываем другую связку");
  });
  ui.refreshIdeaBank?.addEventListener("click", () => {
    const total = filteredIdeaBank().length;
    ideaBankOffset = total ? (ideaBankOffset + Math.min(6, total)) % total : 0;
    renderIdeaBank();
    toast("Подборка обновлена");
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset-idea-radar]")) {
      activeIdeaSource = "all";
      activeIdeaMechanic = "all";
      ideaBankOffset = 0;
      if (ui.ideaMechanicFilter) ui.ideaMechanicFilter.value = "all";
      renderIdeaSources();
      renderIdeaBank();
    }
    const detailButton = event.target.closest("[data-idea-detail]");
    if (detailButton) openIdeaDetail(detailButton.dataset.ideaDetail);
    const ideaCard = event.target.closest("[data-idea-card]");
    if (ideaCard && !event.target.closest("button")) openIdeaDetail(ideaCard.dataset.ideaCard);
    const postButton = event.target.closest("[data-idea-build-post]");
    if (postButton) startPostBuilder(catalogIdea(postButton.dataset.ideaBuildPost));
    const coverButton = event.target.closest("[data-idea-cover]");
    if (coverButton) startCoverBuilder(catalogIdea(coverButton.dataset.ideaCover));
    if (event.target.closest("[data-close-idea-detail]")) ui.ideaDetailDialog?.close();
  });
  ui.ideaDetailDialog?.addEventListener("click", (event) => { if (event.target === ui.ideaDetailDialog) ui.ideaDetailDialog.close(); });
  document.querySelectorAll("[data-cover-mode]").forEach((button) => button.addEventListener("click", () => {
    currentCoverMode = button.dataset.coverMode;
    renderCurrent();
  }));
  ui.growthAsset?.addEventListener("change", renderGrowthIdeas);

  document.querySelectorAll(".filter-chip").forEach((button) => button.addEventListener("click", () => {
    folderFilter = button.dataset.folder;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    renderLibrary(true);
  }));
  ui.librarySearch.addEventListener("input", () => renderLibrary(true));
  ui.themeFilter.addEventListener("change", () => renderLibrary(true));
  ui.orientationFilter.addEventListener("change", () => renderLibrary(true));
  if (ui.libraryInfiniteSentinel && "IntersectionObserver" in window) {
    const libraryObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || ui.libraryInfiniteSentinel.hidden) return;
      visibleMedia += 48;
      renderLibrary();
    }, { rootMargin: "500px 0px" });
    libraryObserver.observe(ui.libraryInfiniteSentinel);
  }
  ui.libraryShuffle.addEventListener("click", shuffleLibrary);
  ui.libraryUploadInput?.addEventListener("change", (event) => addLocalUploads(event.target.files));
  ui.libraryUploadClear?.addEventListener("click", clearLocalUploads);
  ["dragenter", "dragover"].forEach((type) => ui.libraryUploadZone?.addEventListener(type, (event) => {
    event.preventDefault();
    ui.libraryUploadZone.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach((type) => ui.libraryUploadZone?.addEventListener(type, (event) => {
    event.preventDefault();
    ui.libraryUploadZone.classList.remove("is-dragging");
  }));
  ui.libraryUploadZone?.addEventListener("drop", (event) => addLocalUploads(event.dataTransfer.files));
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
  document.querySelector("#librarySummary").textContent = `${libraryPayload.uniqueCount} уникальных фото из ${libraryPayload.sourceCount}`;
  const collectionCount = Object.keys(libraryPayload.sourceFolders || {}).length;
  document.querySelector("#libraryCollectionCount").textContent = `${collectionCount} ${plural(collectionCount, "коллекция", "коллекции", "коллекций")}`;
  ui.libraryDuplicateSummary.textContent = `${libraryPayload.duplicateCount} ${plural(libraryPayload.duplicateCount, "точный дубль скрыт", "точных дубля скрыты", "точных дублей скрыты")}`;
  renderCurrent();
  renderGridSnapshots();
  renderPublicStats();
  renderWeek();
  renderIdealGrid();
  renderGrowthPrinciples();
  renderGrowthNext();
  renderGrowthIdeas();
  if (ui.ideaMechanicFilter) ui.ideaMechanicFilter.insertAdjacentHTML("beforeend", ideaRadar.mechanics.map((mechanic) => `<option value="${escapeHtml(mechanic.id)}">${escapeHtml(mechanic.label)}</option>`).join(""));
  renderIdeaSources();
  renderIdeaBank();
  renderLibrary();
  renderSandbox();
  window.SEKTA_IDEA_BANK = ideaBankCatalog;
  if (location.hash === "#typography") setView("typography");
  window.addEventListener("hashchange", () => { if (location.hash === "#typography") setView("typography"); });
})();
