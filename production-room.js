(() => {
  const STORAGE_KEY = "sekta-production-room-v1";
  const HISTORY_KEY = "sekta-production-room-history-v1";
  const seed = window.SEKTA_PRODUCTION_SEED || { version: 1, materials: [] };
  const statuses = [
    ["idea", "Идея", "Уточнить задачу и CTA"],
    ["assets", "Исходники", "Собрать фото, видео и фактуру"],
    ["text", "Текст", "Дописать и вычитать текст"],
    ["design", "Дизайн", "Собрать кадры в конструкторе"],
    ["review", "Ревью", "Проверить смысл и формулировки"],
    ["approved", "Согласовано", "Поставить дату публикации"],
    ["scheduled", "Запланировано", "Проверить публикацию перед выходом"],
    ["published", "Опубликовано", "Добавить ссылку и разобрать результат"]
  ];
  const statusMap = Object.fromEntries(statuses.map(([id, label, next]) => [id, { label, next }]));
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const uid = () => `material-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const ui = {
    list: $("#productionList"), detail: $("#productionDetail"), empty: $("#productionEmpty"),
    search: $("#productionSearch"), filter: $("#productionStatusFilter"), count: $("#productionResultCount"),
    kpis: $("#productionKpis"), mobileNext: $("#productionMobileNext"), dataState: $("#productionDataState"), live: $("#productionLive"),
    newButton: $("#productionNew"), exportButton: $("#productionExport"), importInput: $("#productionImport"),
    overviewCount: $("#overviewProductionCount"), navCount: $("#navProductionCount")
  };
  if (!ui.list || !ui.detail) return;

  function normalizeMaterial(item) {
    const rawFormat = String(item.format || "Карусель");
    const accountMatch = rawFormat.match(/(@[\w.-]+)/);
    return {
      ...item,
      format: rawFormat.replace(/\s*·\s*@[\w.-]+/, "").trim(),
      account: item.account || accountMatch?.[1] || "@sektaschool",
      requiredAsset: item.requiredAsset || item.asset || "",
      reviewCompleted: Boolean(item.reviewCompleted)
    };
  }

  function loadMaterials() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.version === 1 && Array.isArray(saved.materials)) return saved.materials.map(normalizeMaterial);
    } catch {}
    return seed.materials.map(normalizeMaterial);
  }

  function loadHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY));
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  let materials = loadMaterials();
  let history = loadHistory();
  let selectedId = materials.find((item) => !["published"].includes(item.status))?.id || materials[0]?.id || null;
  let saveTimer;
  let pendingHistory = null;

  function dateLabel(value) {
    if (!value) return "Дата не поставлена";
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date);
  }

  function timeLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "сейчас";
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function snapshotState(materialId, state, reason) {
    history.unshift({ id: uid(), materialId, at: new Date().toISOString(), reason, material: JSON.parse(JSON.stringify(state)) });
    history = history.slice(0, 24);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function persist(message = "Изменения сохранены в этом браузере") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), materials }));
    if (ui.dataState) ui.dataState.textContent = `Локально · ${materials.length} материалов · сохранено сейчас`;
    if (ui.live) ui.live.textContent = message;
  }

  function schedulePersist(material, previous, reason = "До изменения карточки") {
    if (!pendingHistory || pendingHistory.materialId !== material.id) pendingHistory = { materialId: material.id, state: previous, reason };
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      snapshotState(pendingHistory.materialId, pendingHistory.state, pendingHistory.reason);
      pendingHistory = null;
      persist();
      renderSummary();
      renderList();
    }, 500);
  }

  function nextAction(material) {
    if (material.status === "review" && material.reviewRequired && !material.reviewCompleted) return "Подтвердить завершённое ревью";
    if (material.status === "approved" && !material.publicationDate) return "Поставить дату публикации";
    if (material.status === "published") return material.publicationUrl ? "Разобрать результат" : "Добавить ссылку на публикацию";
    return statusMap[material.status]?.next || "Уточнить следующий шаг";
  }

  function filteredMaterials() {
    const query = ui.search.value.trim().toLocaleLowerCase("ru");
    const status = ui.filter.value;
    return materials.filter((item) => (status === "all" || item.status === status) && (!query || `${item.title} ${item.format} ${item.account} ${item.objective} ${item.source} ${item.requiredAsset}`.toLocaleLowerCase("ru").includes(query)))
      .sort((a, b) => {
        const ai = statuses.findIndex(([id]) => id === a.status);
        const bi = statuses.findIndex(([id]) => id === b.status);
        if (a.status === "published" && b.status !== "published") return 1;
        if (b.status === "published" && a.status !== "published") return -1;
        return bi - ai || String(a.publicationDate || "9999").localeCompare(String(b.publicationDate || "9999"));
      });
  }

  function renderSummary() {
    const active = materials.filter((item) => !["published"].includes(item.status)).length;
    const review = materials.filter((item) => item.status === "review").length;
    const scheduled = materials.filter((item) => item.status === "scheduled").length;
    const published = materials.filter((item) => item.status === "published").length;
    const values = [[active, "В работе", "все незавершённые"], [review, "На ревью", review ? "нужна проверка" : "очередь пуста"], [scheduled, "Запланировано", "есть дата выхода"], [published, "Опубликовано", "можно разобрать"]];
    ui.kpis.innerHTML = values.map(([value, label, note]) => `<article><strong>${value}</strong><span>${label}</span><small>${note}</small></article>`).join("");
    if (ui.dataState) ui.dataState.textContent = `Локально · ${materials.length} материалов · автосохранение включено`;
    if (ui.overviewCount) ui.overviewCount.textContent = active;
    if (ui.navCount) ui.navCount.textContent = active;
    renderMobileNext();
  }

  function renderMobileNext() {
    if (!ui.mobileNext) return;
    const material = materials.find((item) => item.id === selectedId);
    ui.mobileNext.innerHTML = material ? `<div><span>${escapeHtml(statusMap[material.status]?.label || "Материал")}</span><strong>${escapeHtml(material.title)}</strong><small>${escapeHtml(nextAction(material))}</small></div><button class="button button-secondary" type="button" data-mobile-detail>Карточка</button>` : "";
  }

  function renderList() {
    const filtered = filteredMaterials();
    ui.count.textContent = `${filtered.length} из ${materials.length}`;
    ui.empty.hidden = filtered.length > 0;
    ui.list.innerHTML = filtered.map((material) => {
      const status = statusMap[material.status] || statusMap.idea;
      const selected = material.id === selectedId ? " is-selected" : "";
      const review = material.reviewRequired ? `<span class="production-review-mark">ревью</span>` : "";
      return `<button class="production-row${selected}" type="button" data-material-id="${escapeHtml(material.id)}"><span class="production-row-status status-${escapeHtml(material.status)}">${escapeHtml(status.label)}</span><strong>${escapeHtml(material.title)}</strong><span class="production-row-meta">${escapeHtml(material.format)} · ${escapeHtml(material.account)} · ${escapeHtml(material.source || "Без источника")}</span><span class="production-row-foot"><span>${escapeHtml(nextAction(material))}</span><span>${escapeHtml(dateLabel(material.publicationDate))}${review}</span></span></button>`;
    }).join("");
  }

  function statusStepper(material) {
    const current = statuses.findIndex(([id]) => id === material.status);
    return `<div class="production-stepper" aria-label="Этап производства">${statuses.map(([, label], index) => `<span class="${index < current ? "is-done" : index === current ? "is-current" : ""}" aria-current="${index === current ? "step" : "false"}"><i></i><b>${escapeHtml(label)}</b></span>`).join("")}</div>`;
  }

  function renderDetail() {
    const material = materials.find((item) => item.id === selectedId);
    if (!material) {
      ui.detail.innerHTML = `<div class="production-detail-empty"><strong>Выберите материал</strong><span>Справа появится его следующий шаг и весь рабочий контекст.</span></div>`;
      return;
    }
    const currentIndex = statuses.findIndex(([id]) => id === material.status);
    const previousVersions = history.filter((item) => item.materialId === material.id).slice(0, 3);
    const reviewBlocked = material.reviewRequired && material.status === "review" && !material.reviewCompleted;
    const canAnalyze = material.status === "published" && Boolean(material.publicationUrl);
    ui.detail.innerHTML = `<div class="production-detail-head"><div><span>${escapeHtml(material.format)} · ${escapeHtml(material.account)}</span><h2>${escapeHtml(material.title)}</h2></div><span class="production-autosave">автосохранение</span></div>${statusStepper(material)}<section class="production-next-action"><div><span>Следующий шаг</span><strong>${escapeHtml(reviewBlocked ? "Подтвердить завершённое ревью" : nextAction(material))}</strong></div><div class="production-step-actions">${currentIndex > 0 && currentIndex < statuses.length - 1 ? `<button class="text-button" type="button" data-back-status>Шаг назад</button>` : ""}<button class="button button-primary" type="button" data-advance-status ${(currentIndex >= statuses.length - 1 || reviewBlocked) ? "disabled" : ""}>${currentIndex >= statuses.length - 1 ? "Цикл завершён" : reviewBlocked ? "Сначала подтвердите ревью" : `Перевести: ${escapeHtml(statuses[currentIndex + 1][1])}`}</button></div></section><div class="production-form"><label class="production-field production-field-wide"><span>Название</span><input data-material-field="title" value="${escapeHtml(material.title)}"></label><label class="production-field"><span>Формат</span><input data-material-field="format" value="${escapeHtml(material.format)}"></label><label class="production-field"><span>Аккаунт</span><input data-material-field="account" value="${escapeHtml(material.account)}"></label><label class="production-field"><span>Дата публикации</span><input data-material-field="publicationDate" type="date" value="${escapeHtml(material.publicationDate || "")}"></label><label class="production-field production-field-wide"><span>Задача материала</span><input data-material-field="objective" value="${escapeHtml(material.objective || "")}"></label><label class="production-field production-field-wide"><span>CTA</span><input data-material-field="cta" value="${escapeHtml(material.cta || "")}"></label><label class="production-field"><span>Источник идеи</span><input data-material-field="source" value="${escapeHtml(material.source || "")}"></label><label class="production-field"><span>Нужный исходник</span><input data-material-field="requiredAsset" value="${escapeHtml(material.requiredAsset || "")}"></label><label class="production-field production-field-wide"><span>Что уже готово</span><input data-material-field="asset" value="${escapeHtml(material.asset || "")}"></label><label class="production-field production-field-wide"><span>Рабочие заметки</span><textarea data-material-field="notes" rows="4">${escapeHtml(material.notes || "")}</textarea></label><label class="production-check production-field-wide"><input type="checkbox" data-material-field="reviewRequired" ${material.reviewRequired ? "checked" : ""}><span><strong>Нужен человеческий ревью</strong><small>Для health, nutrition и личных историй перед публикацией.</small></span></label>${material.reviewRequired ? `<label class="production-check production-field-wide production-review-complete"><input type="checkbox" data-material-field="reviewCompleted" ${material.reviewCompleted ? "checked" : ""}><span><strong>Ревью завершён</strong><small>Только после подтверждения материал сможет перейти в «Согласовано».</small></span></label>` : ""}<label class="production-field production-field-wide"><span>Ссылка после публикации</span><input data-material-field="publicationUrl" type="url" placeholder="https://www.instagram.com/..." value="${escapeHtml(material.publicationUrl || "")}"></label></div><div class="production-actions"><button class="button button-primary" type="button" data-open-builder>Открыть в конструкторе</button><button class="button button-secondary" type="button" data-open-coach ${canAnalyze ? "" : "disabled"}>${canAnalyze ? "Разобрать этот результат" : "Разбор после публикации"}</button></div><section class="production-history"><div><strong>Предыдущие версии</strong><span>Возвращают состояние до изменения</span></div>${previousVersions.length ? `<ul>${previousVersions.map((version) => `<li><span>${escapeHtml(timeLabel(version.at))} · ${escapeHtml(version.reason)}</span><button type="button" data-restore-version="${escapeHtml(version.id)}">Вернуть</button></li>`).join("")}</ul>` : `<p>История появится после первого изменения.</p>`}</section>`;
  }

  function render() { renderSummary(); renderList(); renderDetail(); }

  function selectMaterial(id) {
    selectedId = id;
    renderList();
    renderDetail();
    if (window.innerWidth < 900) ui.detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateField(input) {
    const material = materials.find((item) => item.id === selectedId);
    if (!material) return;
    const key = input.dataset.materialField;
    const previous = JSON.parse(JSON.stringify(material));
    material[key] = input.type === "checkbox" ? input.checked : input.value;
    material.updatedAt = new Date().toISOString();
    if (key === "title") ui.detail.querySelector("h2").textContent = material.title || "Без названия";
    schedulePersist(material, previous);
    if (key === "reviewRequired" || key === "reviewCompleted") {
      renderDetail();
      renderList();
      renderMobileNext();
    }
  }

  function setStatus(status, reason) {
    const material = materials.find((item) => item.id === selectedId);
    if (!material || !statusMap[status] || material.status === status) return;
    const targetIndex = statuses.findIndex(([id]) => id === status);
    const currentIndex = statuses.findIndex(([id]) => id === material.status);
    if (Math.abs(targetIndex - currentIndex) !== 1) return;
    if (targetIndex >= statuses.findIndex(([id]) => id === "approved") && material.reviewRequired && !material.reviewCompleted) {
      ui.live.textContent = "Сначала подтвердите, что человеческий ревью завершён";
      return;
    }
    const previous = JSON.parse(JSON.stringify(material));
    material.status = status;
    material.updatedAt = new Date().toISOString();
    snapshotState(material.id, previous, reason || `До перехода в «${statusMap[status].label}»`);
    persist(`Материал переведён в «${statusMap[status].label}»`);
    render();
  }

  function createMaterial(detail = {}) {
    const sourceId = detail.id ? String(detail.id) : "";
    const existing = materials.find((item) => sourceId && (item.id === sourceId || item.sourceId === sourceId));
    if (existing) {
      selectedId = existing.id;
      existing.updatedAt = new Date().toISOString();
      if (detail.title) existing.title = detail.title;
      persist("Материал уже был в производстве — открыта его карточка");
      render();
      return existing;
    }
    const material = {
      id: uid(), sourceId, title: detail.title || detail.hook || "Новый материал", format: detail.kind === "reel" ? "Reel" : "Карусель", account: detail.account || "@sektaschool",
      status: detail.fromBlank ? "idea" : "text", objective: detail.objective || "", cta: detail.cta || "", source: detail.source || (detail.fromBlank ? "Новая идея" : "Банк идей / коуч роста"),
      asset: "", requiredAsset: detail.asset || "", notes: detail.hook ? `Хук: ${detail.hook}` : "", reviewRequired: /health|nutrition|ревью|эксперт|методическ/i.test(`${detail.readiness || ""} ${detail.asset || ""}`), reviewCompleted: false,
      publicationDate: "", publicationUrl: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    materials.unshift(material);
    selectedId = material.id;
    persist("Материал добавлен в производство");
    render();
    return material;
  }

  function exportBackup() {
    const payload = { schema: "sekta-production-room", version: 1, exportedAt: new Date().toISOString(), materials, history };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sekta-materials-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
    ui.live.textContent = "Резервная копия материалов скачана";
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (payload.schema !== "sekta-production-room" || payload.version !== 1 || !Array.isArray(payload.materials)) throw new Error("schema");
        materials = payload.materials.map(normalizeMaterial);
        history = Array.isArray(payload.history) ? payload.history.slice(0, 24) : [];
        selectedId = materials[0]?.id || null;
        persist(`Восстановлено ${materials.length} материалов`);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        render();
      } catch {
        ui.live.textContent = "Не удалось восстановить: выберите JSON из раздела «Материалы»";
      }
    };
    reader.readAsText(file);
  }

  ui.list.addEventListener("click", (event) => { const row = event.target.closest("[data-material-id]"); if (row) selectMaterial(row.dataset.materialId); });
  ui.detail.addEventListener("input", (event) => { if (event.target.matches("[data-material-field]")) updateField(event.target); });
  ui.detail.addEventListener("click", (event) => {
    if (event.target.closest("[data-advance-status]")) {
      const material = materials.find((item) => item.id === selectedId);
      const index = statuses.findIndex(([id]) => id === material?.status);
      if (index >= 0 && index < statuses.length - 1) setStatus(statuses[index + 1][0]);
    }
    if (event.target.closest("[data-back-status]")) {
      const material = materials.find((item) => item.id === selectedId);
      const index = statuses.findIndex(([id]) => id === material?.status);
      if (index > 0) setStatus(statuses[index - 1][0], `До возврата в «${statuses[index - 1][1]}»`);
    }
    const restore = event.target.closest("[data-restore-version]");
    if (restore) {
      const version = history.find((item) => item.id === restore.dataset.restoreVersion);
      const index = materials.findIndex((item) => item.id === selectedId);
      if (version && index >= 0) {
        const current = JSON.parse(JSON.stringify(materials[index]));
        materials[index] = JSON.parse(JSON.stringify(version.material));
        snapshotState(materials[index].id, current, "До восстановления предыдущей версии");
        persist("Предыдущая версия восстановлена");
        render();
      }
    }
    if (event.target.closest("[data-open-builder]")) {
      const material = materials.find((item) => item.id === selectedId);
      document.querySelector('[data-view="postbuilder"]')?.click();
      window.dispatchEvent(new CustomEvent("sekta:post-builder-load", { detail: { ...material, hook: material.title, readiness: material.reviewRequired ? "Нужен ревью" : "Черновик" } }));
      if (material.status === "text") setStatus("design", "До открытия в конструкторе");
    }
    if (event.target.closest("[data-open-coach]")) {
      const material = materials.find((item) => item.id === selectedId);
      if (!material || material.status !== "published" || !material.publicationUrl) return;
      const context = { id: material.id, title: material.title, publicationUrl: material.publicationUrl, publicationDate: material.publicationDate, format: material.format, account: material.account };
      localStorage.setItem("sekta-growth-coach-material-v1", JSON.stringify(context));
      window.dispatchEvent(new CustomEvent("sekta:growth-coach-material", { detail: context }));
      document.querySelector('[data-view="coach"]')?.click();
    }
  });
  ui.mobileNext?.addEventListener("click", (event) => { if (event.target.closest("[data-mobile-detail]")) ui.detail.scrollIntoView({ behavior: "smooth", block: "start" }); });
  ui.search.addEventListener("input", renderList);
  ui.filter.addEventListener("change", renderList);
  ui.newButton.addEventListener("click", () => createMaterial({ fromBlank: true }));
  ui.exportButton.addEventListener("click", exportBackup);
  ui.importInput.addEventListener("change", (event) => { const [file] = event.target.files; if (file) importBackup(file); event.target.value = ""; });
  window.addEventListener("sekta:post-builder-load", (event) => createMaterial(event.detail || {}));
  window.addEventListener("sekta:series-saved", (event) => {
    const detail = event.detail || {};
    const material = materials.find((item) => item.sourceId && item.sourceId === detail.sourceId) || materials.find((item) => item.title === detail.title);
    if (!material) return;
    const previous = JSON.parse(JSON.stringify(material));
    selectedId = material.id;
    if (material.status === "text") material.status = "design";
    material.asset = `Серия сохранена · ${detail.slideCount || "—"} слайдов`;
    material.updatedAt = new Date().toISOString();
    snapshotState(material.id, previous, "До сохранения серии из конструктора");
    persist("Сохранённая серия отмечена в материале");
    render();
  });

  render();
})();
