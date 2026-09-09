(() => {
  const payload = window.SEKTA_LIBRARY || { items: [], duplicateCount: 0 };
  const allItems = payload.items || [];
  const isPhotograph = (item) => item.mediaType !== "video"
    && ["real-photo", "neuro-photo"].includes(item.materialType)
    && !(item.visionKeywords || []).includes("screenshot")
    && !/^(screenshot|снимок экрана)/i.test(item.fileName || "");
  const library = allItems.filter(isPhotograph);
  const isLocal = location.protocol === "file:";
  const overrideKey = "sekta-media-people-overrides-v1";
  const overrideEndpoint = "http://127.0.0.1:4318/api/media-overrides";
  const canonicalOverrides = window.MEDIA_LIBRARY_MANUAL_OVERRIDES?.records || {};
  const localOverrides = loadOverrides();

  const ui = {
    search: document.querySelector("#librarySearch"),
    project: document.querySelector("#projectFilter"),
    materialType: document.querySelector("#materialTypeFilter"),
    publication: document.querySelector("#publicationFilter"),
    theme: document.querySelector("#themeFilter"),
    orientation: document.querySelector("#orientationFilter"),
    sort: document.querySelector("#librarySort"),
    clear: document.querySelector("#libraryClearFilters"),
    shuffle: document.querySelector("#libraryShuffle"),
    count: document.querySelector("#libraryResultCount"),
    summary: document.querySelector("#librarySummary"),
    grid: document.querySelector("#mediaGrid"),
    sentinel: document.querySelector("#libraryScrollSentinel"),
    dialog: document.querySelector("#detailDialog"),
    dialogContent: document.querySelector("#dialogContent"),
    toast: document.querySelector("#toast"),
    mode: document.querySelector("#libraryEnvironment"),
    modeLabel: document.querySelector("#libraryModeLabel"),
    audit: document.querySelector("#mediaAuditLink"),
  };

  let section = "all";
  let visible = 40;
  let order = [...library];
  let toastTimer;

  library.forEach((item) => {
    const canonical = canonicalOverrides[item.id];
    const local = localOverrides[item.id];
    if (Array.isArray(canonical?.people)) applyPeople(item, canonical.people);
    if (typeof canonical?.top === "boolean") applyTop(item, canonical.top);
    if (Array.isArray(local?.people)) applyPeople(item, local.people);
    if (typeof local?.top === "boolean") applyTop(item, local.top);
  });

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function plural(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
  }

  function loadOverrides() {
    try {
      const saved = JSON.parse(localStorage.getItem(overrideKey) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function saveOverrides() {
    localStorage.setItem(overrideKey, JSON.stringify(localOverrides));
  }

  function normalizePeople(values) {
    const result = [];
    const seen = new Set();
    for (const raw of values || []) {
      const value = String(raw).trim();
      if (!value || value === "Не определено") continue;
      if (value.length > 80) throw new Error("Одно имя не может быть длиннее 80 символов.");
      const key = value.toLocaleLowerCase("ru");
      if (!seen.has(key)) result.push(value);
      seen.add(key);
    }
    if (result.length > 12) throw new Error("Можно указать не больше 12 имён.");
    return result;
  }

  function applyPeople(item, values) {
    const people = normalizePeople(values);
    item.people = people.length ? people : ["Не определено"];
  }

  function applyTop(item, value) {
    item.isTop = Boolean(value);
  }

  async function writeOverride(id, patch) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(overrideEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "Сервис разметки недоступен.");
      return result.record;
    } finally {
      clearTimeout(timeout);
    }
  }

  function searchableText(item) {
    return [
      item.fileName, item.folderLabel, item.sourceCategory, item.sourceFolder,
      item.materialType, item.publicationStatus, item.captureDate,
      item.camera?.make, item.camera?.model,
      ...(item.visionKeywords || []), ...(item.collections || []),
      ...(item.projects || []), ...(item.people || []), ...(item.topics || []),
      ...(item.searchAliases || []), ...(item.categories || []),
      ...(item.contentThemes || []), ...(item.carouselRoles || []),
    ].join(" ").replaceAll("_", " ").toLocaleLowerCase("ru");
  }

  function filteredLibrary() {
    const query = ui.search.value.trim().toLocaleLowerCase("ru");
    const filtered = order.filter((item) => {
      const collections = item.collections || [];
      const inSection = section === "all" ? true : section === "top" ? item.isTop : collections.includes(section);
      return inSection
        && (ui.project.value === "all" || (item.projects || []).includes(ui.project.value))
        && (ui.materialType.value === "all" || item.materialType === ui.materialType.value)
        && (ui.publication.value === "all" || item.publicationStatus === ui.publication.value)
        && (ui.theme.value === "all" || (item.topics || []).includes(ui.theme.value))
        && (ui.orientation.value === "all" || item.orientation === ui.orientation.value)
        && (!query || searchableText(item).includes(query));
    });

    const compareDate = (field, direction) => (a, b) => {
      const left = Date.parse(a[field] || "");
      const right = Date.parse(b[field] || "");
      if (!Number.isFinite(left) && !Number.isFinite(right)) return String(a.id).localeCompare(String(b.id), "ru");
      if (!Number.isFinite(left)) return 1;
      if (!Number.isFinite(right)) return -1;
      return (left - right) * direction || String(a.id).localeCompare(String(b.id), "ru");
    };
    if (ui.sort.value === "capture-desc") return [...filtered].sort(compareDate("captureDate", -1));
    if (ui.sort.value === "capture-asc") return [...filtered].sort(compareDate("captureDate", 1));
    if (ui.sort.value === "modified-desc") return [...filtered].sort(compareDate("modifiedAt", -1));
    return filtered;
  }

  function render(reset = false) {
    if (reset) visible = 40;
    const filtered = filteredLibrary();
    const shown = filtered.slice(0, visible);
    const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>';
    ui.grid.innerHTML = shown.map((item) => {
      const ai = item.materialType === "neuro-photo" ? '<span class="media-type-tag media-type-ai">Нейрофото</span>' : "";
      const status = item.publicationStatus === "not-public"
        ? '<span class="media-status-tag media-status-stop">Не публиковать</span>'
        : item.publicationStatus === "review" ? '<span class="media-status-tag">Проверить</span>' : "";
      const orientation = ["portrait", "landscape", "square"].includes(item.orientation) ? item.orientation : "square";
      return `<article class="media-card is-${orientation}${item.isTop ? " is-top" : ""}" data-name="${escapeHtml(item.fileName)}">
        <button class="media-card-open" data-media-id="${escapeHtml(item.id)}" aria-label="Открыть ${escapeHtml(item.fileName)} крупно">
          <img src="${escapeHtml(item.thumb)}" alt="" loading="lazy">${ai}${status}
        </button>
        <button class="media-card-top" data-toggle-top="${escapeHtml(item.id)}" aria-pressed="${Boolean(item.isTop)}" aria-label="${item.isTop ? "Убрать фотографию из топа" : "Добавить фотографию в топ"}">${star}<span>${item.isTop ? "В топе" : "В топ"}</span></button>
      </article>`;
    }).join("");
    ui.count.textContent = `${filtered.length.toLocaleString("ru-RU")} ${plural(filtered.length, "фотография", "фотографии", "фотографий")}`;
    ui.sentinel.hidden = shown.length >= filtered.length;
    if (!filtered.length) ui.grid.innerHTML = '<div class="empty-state"><strong>Фотографии не найдены</strong><span>Измените запрос или сбросьте один из фильтров.</span></div>';
  }

  function peopleEditor(item) {
    const people = normalizePeople(item.people || []);
    const tags = people.length ? people.map((person) => `<span class="people-tag">${escapeHtml(person)}</span>`).join("") : '<span class="people-empty">Не определено</span>';
    return `<div class="media-taxonomy people-editor" data-people-editor="${escapeHtml(item.id)}">
      <div class="people-editor-head"><span>Кто в кадре</span><button type="button" class="people-edit-button" data-edit-people="${escapeHtml(item.id)}">${people.length ? "Изменить" : "Добавить"}</button></div>
      <div class="people-tags">${tags}</div>
      <form class="people-form" data-people-form="${escapeHtml(item.id)}" hidden>
        <label for="people-${escapeHtml(item.id)}">Имена через запятую</label>
        <input id="people-${escapeHtml(item.id)}" name="people" value="${escapeHtml(people.join(", "))}" maxlength="980" autocomplete="off" placeholder="Например: Вера, Оля">
        <div class="people-form-actions"><button type="submit" class="button button-primary">Сохранить</button><button type="button" class="button button-secondary" data-cancel-people>Отмена</button></div>
      </form>
      <p class="people-save-status" role="status" aria-live="polite"></p>
    </div>`;
  }

  function formatTaxonomy(value) {
    return String(value).split("/").map((part) => part.replace(/^\d+_/, "").replaceAll("_", " ")).join(" / ");
  }

  function openMedia(item) {
    if (!item) return;
    const type = item.materialType === "neuro-photo" ? "Нейрофотография" : "Реальная фотография";
    const status = ({ approved: "Можно публиковать", review: "Проверить перед публикацией", "not-public": "Не публиковать" })[item.publicationStatus] || "Не указан";
    const captureDate = item.captureDate ? new Date(item.captureDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "не определена";
    const camera = [item.camera?.make, item.camera?.model].filter(Boolean).join(" · ") || "не определена";
    const originalStatus = ({ "verified-local": "Локальный оригинал проверен", "verified-local-and-remote": "Локальный и Drive-оригинал", "remote-only": "Только удалённый оригинал", unresolved: "Оригинал не найден" })[item.originalResolution?.status] || "Не проверено";
    const pathAvailable = isLocal && item.originalPath && !String(item.originalPath).includes("скрыт в публичной версии");
    const topics = (item.topics || []).length ? `<div class="media-taxonomy"><span>Темы</span><p>${item.topics.map((topic) => escapeHtml(payload.taxonomy?.topics?.[topic] || formatTaxonomy(topic))).join(" · ")}</p></div>` : "";
    const projects = (item.projects || []).length ? `<div class="media-taxonomy"><span>Проекты</span><p>${item.projects.map(escapeHtml).join(" · ")}</p></div>` : "";
    const duplicates = (item.duplicates || []).length;
    ui.dialogContent.innerHTML = `<div class="detail-layout">
      <div class="detail-image"><img src="${escapeHtml(item.thumb)}" alt="${escapeHtml(item.fileName)}"></div>
      <div class="detail-copy">
        <p class="eyebrow">${escapeHtml(item.folderLabel || "Фотомедиатека")}</p>
        <h2>${escapeHtml(item.fileName)}</h2>
        <p>${isLocal ? "Здесь показано превью; путь ведёт к локальному оригиналу." : "Публичная версия показывает только превью; оригинал хранится в защищённой медиатеке."}</p>
        <div class="meta-list">
          <div class="meta-row"><span>Тип</span><strong>${type}</strong></div>
          <div class="meta-row"><span>Публикация</span><strong>${status}</strong></div>
          <div class="meta-row"><span>Дата съёмки</span><strong>${escapeHtml(captureDate)}</strong></div>
          <div class="meta-row"><span>Камера</span><strong>${escapeHtml(camera)}</strong></div>
          <div class="meta-row"><span>Оригинал</span><strong>${escapeHtml(originalStatus)}</strong></div>
          <div class="meta-row"><span>Размер</span><strong>${Number(item.width || 0)} × ${Number(item.height || 0)}</strong></div>
          <div class="meta-row"><span>Ориентация</span><strong>${({ portrait: "вертикальная", landscape: "горизонтальная", square: "квадратная" })[item.orientation] || "не определена"}</strong></div>
          <div class="meta-row"><span>Точные дубли</span><strong>${duplicates || "нет"}</strong></div>
        </div>
        ${projects}${peopleEditor(item)}${topics}
        <div class="detail-actions">
          <button class="button ${item.isTop ? "button-top-active" : "button-secondary"}" data-toggle-top="${escapeHtml(item.id)}">${item.isTop ? "В топе" : "Добавить в топ"}</button>
          ${pathAvailable ? `<button class="button button-secondary" data-copy-path="${escapeHtml(item.originalPath)}">Скопировать путь к оригиналу</button>` : ""}
        </div>
        <div class="path-box">${pathAvailable ? escapeHtml(item.originalPath) : "Оригинал доступен через защищённый реестр медиатеки."}</div>
      </div>
    </div>`;
    ui.dialog.classList.toggle("is-landscape", item.orientation === "landscape");
    if (!ui.dialog.open) ui.dialog.showModal();
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => ui.toast.classList.remove("is-visible"), 2600);
  }

  async function toggleTop(item) {
    if (!item) return;
    const next = !item.isTop;
    applyTop(item, next);
    render();
    if (ui.dialog.open) openMedia(item);
    try {
      await writeOverride(item.id, { top: next });
      delete localOverrides[item.id]?.top;
      saveOverrides();
      showToast(next ? "Фотография добавлена в топ" : "Фотография убрана из топа");
    } catch {
      localOverrides[item.id] = { ...(localOverrides[item.id] || {}), top: next, pending: true, updatedAt: new Date().toISOString() };
      saveOverrides();
      showToast("Выбор сохранён в этом браузере");
    }
  }

  async function savePeople(form) {
    const item = library.find((entry) => entry.id === form.dataset.peopleForm);
    if (!item) return;
    const status = form.parentElement.querySelector(".people-save-status");
    let people;
    try {
      people = normalizePeople(new FormData(form).get("people").split(/[,;\n]+/));
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    applyPeople(item, people);
    try {
      await writeOverride(item.id, { people });
      delete localOverrides[item.id]?.people;
      saveOverrides();
      showToast("Разметка фотографии сохранена");
    } catch {
      localOverrides[item.id] = { ...(localOverrides[item.id] || {}), people, pending: true, updatedAt: new Date().toISOString() };
      saveOverrides();
      showToast("Разметка сохранена в этом браузере");
    }
    openMedia(item);
    render();
  }

  document.querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => {
    section = button.dataset.section;
    document.querySelectorAll("[data-section]").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    render(true);
  }));
  [ui.search, ui.project, ui.materialType, ui.publication, ui.theme, ui.orientation, ui.sort].forEach((control) => control.addEventListener(control === ui.search ? "input" : "change", () => render(true)));
  ui.clear.addEventListener("click", () => {
    section = "all";
    ui.search.value = "";
    [ui.project, ui.materialType, ui.publication, ui.theme, ui.orientation].forEach((select) => { select.value = "all"; });
    ui.sort.value = "capture-desc";
    document.querySelectorAll("[data-section]").forEach((chip) => chip.classList.toggle("is-active", chip.dataset.section === "all"));
    render(true);
    showToast("Фильтры сброшены");
  });
  ui.shuffle.addEventListener("click", () => {
    for (let index = order.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [order[index], order[target]] = [order[target], order[index]];
    }
    ui.sort.value = "default";
    render(true);
    showToast("Показываем новую случайную подборку");
  });
  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-media-id]");
    if (open) openMedia(library.find((item) => item.id === open.dataset.mediaId));
    const top = event.target.closest("[data-toggle-top]");
    if (top) {
      event.preventDefault();
      toggleTop(library.find((item) => item.id === top.dataset.toggleTop));
    }
    const edit = event.target.closest("[data-edit-people]");
    if (edit) {
      const form = edit.closest("[data-people-editor]")?.querySelector("[data-people-form]");
      if (form) { form.hidden = false; edit.hidden = true; form.querySelector("input")?.focus(); }
    }
    const cancel = event.target.closest("[data-cancel-people]");
    if (cancel) {
      const editor = cancel.closest("[data-people-editor]");
      editor.querySelector("[data-people-form]").hidden = true;
      editor.querySelector("[data-edit-people]").hidden = false;
    }
    const copy = event.target.closest("[data-copy-path]");
    if (copy) navigator.clipboard.writeText(copy.dataset.copyPath).then(() => showToast("Путь к оригиналу скопирован"), () => showToast("Не удалось скопировать путь"));
  });
  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-people-form]");
    if (!form) return;
    event.preventDefault();
    savePeople(form);
  });
  document.querySelector("[data-close]").addEventListener("click", () => ui.dialog.close());

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || visible >= filteredLibrary().length) return;
      visible += 40;
      render();
    }, { rootMargin: "800px 0px" }).observe(ui.sentinel);
  } else {
    visible = library.length;
  }

  ui.summary.textContent = `${library.length.toLocaleString("ru-RU")} ${plural(library.length, "фотография", "фотографии", "фотографий")}`;
  ui.mode.textContent = isLocal ? "Локальная версия · оригиналы доступны" : "Публичная версия · только превью";
  ui.modeLabel.textContent = isLocal ? "полная локальная медиатека" : "публичная медиатека";
  ui.audit.hidden = !isLocal;
  if (!isLocal) ui.publication.querySelector('option[value="not-public"]')?.remove();
  render();
})();
