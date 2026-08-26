(() => {
  const root = document.querySelector('[data-view-panel="moms"]');
  if (!root) return;

  const library = window.SEKTA_LIBRARY?.items || [];
  const room = window.SEKTA_MOMS_ROOM || { ideas: [], stages: {}, formats: {}, objectives: {}, sources: {} };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const plural = (count, one, few, many) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  };

  const ui = {
    navCount: document.querySelector("#navMomsCount"),
    headingCount: root.querySelector("#momsHeadingCount"),
    mediaTabCount: root.querySelector("#momsMediaTabCount"),
    mediaGrid: root.querySelector("#momsMediaGrid"),
    mediaResult: root.querySelector("#momsMediaResult"),
    mediaSearch: root.querySelector("#momsMediaSearch"),
    mediaOrientation: root.querySelector("#momsMediaOrientation"),
    mediaShuffle: root.querySelector("#momsMediaShuffle"),
    mediaMore: root.querySelector("#momsMediaMore"),
    uploadInput: root.querySelector("#momsUploadInput"),
    uploadState: root.querySelector("#momsUploadState"),
    stage: root.querySelector("#momsStage"),
    format: root.querySelector("#momsFormat"),
    objective: root.querySelector("#momsObjective"),
    generate: root.querySelector("#momsGenerate"),
    reset: root.querySelector("#momsResetGenerator"),
    refresh: root.querySelector("#momsRefreshIdeas"),
    ideaList: root.querySelector("#momsIdeaList"),
    ideaEmpty: root.querySelector("#momsIdeaEmpty"),
    ideaResult: root.querySelector("#momsIdeaResult"),
    ideaRecipe: root.querySelector("#momsIdeaRecipe"),
  };

  function itemText(item) {
    return [item.fileName, item.folderLabel, item.sourceCategory, item.sourceFolder, ...(item.contentThemes || []), ...(item.carouselRoles || []), ...(item.collections || [])].join(" ").toLocaleLowerCase("ru");
  }

  function isMomMedia(item) {
    const text = itemText(item);
    return (item.collections || []).includes("maternity") || /беремен|материн|родител|реб[её]н|дети|семь|близость|pregnan|matern|child|kid|family/.test(text);
  }

  function mediaKinds(item) {
    const text = itemText(item);
    const sourceText = [item.sourceCategory, item.sourceFolder].join(" ").toLocaleLowerCase("ru");
    const isPregnancy = (item.collections || []).includes("maternity") || /беремен|pregnan|matern/.test(sourceText);
    const kinds = [];
    if (isPregnancy) kinds.push("pregnancy", "mother");
    if (!isPregnancy && /реб[её]н|дети|воспитан|child|kid/.test(sourceText)) kinds.push("children");
    if (!isPregnancy && /семь|близость|отношен|family/.test(sourceText)) kinds.push("family");
    if (!isPregnancy && (item.collections || []).includes("olya") && /мам|материн|родител|реб[её]н|дети|семь|близость/.test(text)) kinds.push("mother");
    return [...new Set(kinds)];
  }

  const baseMedia = library.filter(isMomMedia).map((item) => ({ ...item, momsKinds: mediaKinds(item), localMomUpload: false }));
  let mediaOrder = [...baseMedia];
  let uploads = [];
  let activeMediaFilter = "all";
  let visibleMedia = 36;
  let ideaOffset = 0;

  function allMomMedia() {
    return [...uploads, ...mediaOrder];
  }

  function countKind(kind) {
    return kind === "all" ? allMomMedia().length : allMomMedia().filter((item) => item.momsKinds.includes(kind)).length;
  }

  function syncCounts() {
    const total = allMomMedia().length;
    ui.navCount.textContent = total;
    ui.headingCount.textContent = `${total} ${plural(total, "фото", "фото", "фото")} · ${room.ideas.length} тем в банке`;
    ui.mediaTabCount.textContent = `${total} фото`;
    ["all", "pregnancy", "children", "family", "mother"].forEach((kind) => {
      const id = `#momsCount${kind[0].toUpperCase()}${kind.slice(1)}`;
      const target = root.querySelector(id);
      if (target) target.textContent = countKind(kind);
    });
  }

  function filteredMedia() {
    const query = ui.mediaSearch.value.trim().toLocaleLowerCase("ru");
    const orientation = ui.mediaOrientation.value;
    return allMomMedia().filter((item) => {
      const matchesKind = activeMediaFilter === "all" || item.momsKinds.includes(activeMediaFilter);
      const matchesOrientation = orientation === "all" || item.orientation === orientation;
      const matchesQuery = !query || itemText(item).includes(query);
      return matchesKind && matchesOrientation && matchesQuery;
    });
  }

  function mediaCard(item) {
    const kinds = item.momsKinds.map((kind) => ({ pregnancy: "беременность", children: "с детьми", family: "семья", mother: "мама" })[kind]).filter(Boolean);
    const existingAttrs = item.localMomUpload ? `data-moms-upload-id="${escapeHtml(item.id)}"` : `data-media-id="${escapeHtml(item.id)}"`;
    const quality = item.exportQuality === "source" ? "HQ" : item.localMomUpload ? "локально" : "превью";
    return `<button class="moms-media-card" type="button" ${existingAttrs} aria-label="${escapeHtml(item.fileName)}"><img src="${escapeHtml(item.thumb)}" alt="" loading="lazy"><span class="moms-media-quality">${escapeHtml(quality)}</span><span class="moms-media-caption"><strong>${escapeHtml(kinds[0] || "материнство")}</strong><small>${escapeHtml(item.fileName)}</small></span></button>`;
  }

  function renderMedia(reset = false) {
    if (reset) visibleMedia = 36;
    const filtered = filteredMedia();
    const visible = filtered.slice(0, visibleMedia);
    ui.mediaResult.textContent = `${filtered.length} ${plural(filtered.length, "материал", "материала", "материалов")} в этой выдаче`;
    ui.mediaGrid.innerHTML = visible.length ? visible.map(mediaCard).join("") : `<div class="moms-media-empty"><strong>Здесь пока нет подходящих фото</strong><span>Сбросьте фильтр или добавьте материал в мамскую медиатеку.</span></div>`;
    ui.mediaMore.hidden = visible.length >= filtered.length;
    syncCounts();
  }

  function setMediaFilter(kind) {
    activeMediaFilter = kind;
    root.querySelectorAll("[data-moms-media-filter]").forEach((button) => {
      const selected = button.dataset.momsMediaFilter === kind;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    renderMedia(true);
  }

  function addUploads(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    const added = files.map((file, index) => {
      const thumb = URL.createObjectURL(file);
      return {
        id: `mom-upload-${Date.now()}-${index}`,
        fileName: file.name,
        folderLabel: "Мамская медиатека · локально",
        sourceCategory: "локальное добавление",
        sourceFolder: "mom-uploads",
        contentThemes: ["материнство", "семья", "дети"],
        carouselRoles: ["живой кадр"],
        collections: ["maternity"],
        momsKinds: ["mother", "family"],
        orientation: "portrait",
        exportQuality: "source",
        thumb,
        localMomUpload: true,
      };
    });
    uploads = [...added, ...uploads];
    ui.uploadInput.value = "";
    ui.uploadState.textContent = `Локально добавлено: ${uploads.length}`;
    setMediaFilter("all");
    momsToast(`${files.length} ${plural(files.length, "фото добавлено", "фото добавлены", "фото добавлены")} только в мамскую медиатеку`);
  }

  function selectedSources() {
    return [...root.querySelectorAll('input[name="moms-source"]:checked')].map((input) => input.value);
  }

  function filteredIdeas() {
    const sources = selectedSources();
    return room.ideas.filter((idea) => {
      const matchesSource = idea.sources.some((source) => sources.includes(source));
      const matchesStage = ui.stage.value === "all" || idea.stage === ui.stage.value;
      const matchesFormat = ui.format.value === "all" || idea.format === ui.format.value;
      const matchesObjective = ui.objective.value === "all" || idea.objective === ui.objective.value;
      return matchesSource && matchesStage && matchesFormat && matchesObjective;
    });
  }

  function needsReview(idea) {
    return /ревью|специалист|медицин|психолог|кризис|нутрициолог/i.test(idea.readiness);
  }

  function ideaCard(idea, position) {
    const sourceLabels = idea.sources.map((source) => room.sources[source]).join(" + ");
    const review = needsReview(idea);
    return `<article class="moms-idea-card${position === 0 ? " is-featured" : ""}" data-moms-idea-card="${escapeHtml(idea.id)}"><div class="moms-idea-card-head"><div><span>${escapeHtml(room.formats[idea.format])} · ${escapeHtml(room.stages[idea.stage])}</span><strong>${escapeHtml(sourceLabels)}</strong></div><em>${escapeHtml(idea.account)}</em></div><h3>${escapeHtml(idea.title)}</h3><blockquote>«${escapeHtml(idea.hook)}»</blockquote><p>${escapeHtml(idea.angle)}</p><dl><div><dt>Цель</dt><dd>${escapeHtml(room.objectives[idea.objective])}</dd></div><div><dt>CTA</dt><dd>${escapeHtml(idea.cta)}</dd></div><div><dt>Нужен материал</dt><dd>${escapeHtml(idea.asset)}</dd></div><div><dt>Готовность</dt><dd>${escapeHtml(idea.readiness)}</dd></div></dl>${review ? `<div class="moms-review-gate"><strong>Нужен human review</strong><span>До публикации тему проверяет профильный специалист или редактор.</span></div>` : ""}<div class="moms-idea-actions"><button class="button button-secondary" type="button" data-moms-copy="${escapeHtml(idea.id)}">Скопировать бриф</button><button class="button button-primary" type="button" data-moms-build="${escapeHtml(idea.id)}">В конструктор</button></div></article>`;
  }

  function renderIdeas() {
    const catalog = filteredIdeas();
    if (!catalog.length) {
      ui.ideaList.innerHTML = "";
      ui.ideaList.hidden = true;
      ui.ideaEmpty.hidden = false;
      ui.ideaResult.textContent = "0 тем";
      ui.ideaRecipe.textContent = "измените один из фильтров";
      return;
    }
    ideaOffset %= catalog.length;
    const visible = Array.from({ length: Math.min(6, catalog.length) }, (_, index) => catalog[(ideaOffset + index) % catalog.length]);
    const sources = selectedSources();
    ui.ideaList.hidden = false;
    ui.ideaEmpty.hidden = true;
    ui.ideaList.innerHTML = visible.map(ideaCard).join("");
    ui.ideaResult.textContent = `${visible.length} ${plural(visible.length, "тема готова", "темы готовы", "тем готовы")}`;
    const stage = ui.stage.value === "all" ? "все этапы" : room.stages[ui.stage.value];
    ui.ideaRecipe.textContent = `${sources.length} ${plural(sources.length, "источник", "источника", "источников")} · ${stage}`;
  }

  function resetGenerator() {
    root.querySelectorAll('input[name="moms-source"]').forEach((input) => { input.checked = true; });
    ui.stage.value = "all";
    ui.format.value = "all";
    ui.objective.value = "all";
    ideaOffset = 0;
    renderIdeas();
  }

  function briefText(idea) {
    return `${idea.title}\n\nАккаунт: ${idea.account}\nИсточник: ${idea.sources.map((source) => room.sources[source]).join(" + ")}\nФормат: ${room.formats[idea.format]}\nЭтап: ${room.stages[idea.stage]}\nЦель: ${room.objectives[idea.objective]}\n\nХук: ${idea.hook}\n\nУгол: ${idea.angle}\nCTA: ${idea.cta}\nНужен материал: ${idea.asset}\nГотовность: ${idea.readiness}`;
  }

  async function copyBrief(idea) {
    try {
      await navigator.clipboard.writeText(briefText(idea));
      momsToast("Бриф темы скопирован");
    } catch {
      momsToast("Не удалось скопировать бриф");
    }
  }

  function openInBuilder(idea) {
    const nav = document.querySelector('[data-view="postbuilder"]');
    if (!nav) return;
    nav.click();
    window.dispatchEvent(new CustomEvent("sekta:post-builder-load", { detail: {
      id: `moms-${idea.id}`,
      kind: idea.format === "reel" ? "reel" : "post",
      title: idea.title,
      hook: idea.hook,
      objective: room.objectives[idea.objective],
      asset: idea.asset,
      cta: idea.cta,
      readiness: idea.readiness,
      angle: idea.angle,
      account: idea.account,
    } }));
    momsToast("Мамская тема открыта в конструкторе поста");
  }

  function momsToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(momsToast.timer);
    momsToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function setTab(tab) {
    root.querySelectorAll("[data-moms-tab]").forEach((button) => {
      const selected = button.dataset.momsTab === tab;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll("[data-moms-panel]").forEach((panel) => {
      const selected = panel.dataset.momsPanel === tab;
      panel.classList.toggle("is-active", selected);
      panel.hidden = !selected;
    });
  }

  root.querySelectorAll("[data-moms-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.momsTab)));
  root.querySelector(".moms-tabs")?.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = root.querySelector(`[data-moms-tab="${event.key === "ArrowRight" ? "ideas" : "media"}"]`);
    next?.click();
    next?.focus();
  });
  root.querySelectorAll("[data-moms-media-filter]").forEach((button) => button.addEventListener("click", () => setMediaFilter(button.dataset.momsMediaFilter)));
  ui.mediaSearch.addEventListener("input", () => renderMedia(true));
  ui.mediaOrientation.addEventListener("change", () => renderMedia(true));
  ui.mediaShuffle.addEventListener("click", () => {
    for (let index = mediaOrder.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [mediaOrder[index], mediaOrder[target]] = [mediaOrder[target], mediaOrder[index]];
    }
    renderMedia(true);
    momsToast("Мамская медиатека перемешана");
  });
  ui.mediaMore.addEventListener("click", () => { visibleMedia += 36; renderMedia(); });
  ui.uploadInput.addEventListener("change", (event) => addUploads(event.target.files));
  root.querySelectorAll('input[name="moms-source"]').forEach((input) => input.addEventListener("change", renderIdeas));
  [ui.stage, ui.format, ui.objective].forEach((control) => control.addEventListener("change", () => { ideaOffset = 0; renderIdeas(); }));
  ui.generate.addEventListener("click", () => { ideaOffset = Math.floor(Math.random() * Math.max(1, filteredIdeas().length)); renderIdeas(); momsToast("Нейрогенератор собрал новую связку тем"); });
  ui.refresh.addEventListener("click", () => { ideaOffset += 6; renderIdeas(); });
  ui.reset.addEventListener("click", resetGenerator);
  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-moms-reset]")) resetGenerator();
    const copy = event.target.closest("[data-moms-copy]");
    if (copy) copyBrief(room.ideas.find((idea) => idea.id === copy.dataset.momsCopy));
    const build = event.target.closest("[data-moms-build]");
    if (build) openInBuilder(room.ideas.find((idea) => idea.id === build.dataset.momsBuild));
    const upload = event.target.closest("[data-moms-upload-id]");
    if (upload) momsToast("Локальное фото уже доступно в этой мамской медиатеке");
  });

  renderMedia();
  renderIdeas();
})();
