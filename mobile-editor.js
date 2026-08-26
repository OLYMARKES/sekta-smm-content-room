(() => {
  const root = document.querySelector('[data-view-panel="mobileeditor"]');
  if (!root) return;

  const library = (window.SEKTA_LIBRARY?.items || []).filter((item) => item.orientation === "portrait" && !item.isUtility && !/(скрин|screenshot|screen|документ|текст)/i.test([item.fileName, item.sourceCategory].join(" ")));
  const DRAFT_KEY = "sekta-mobile-editor-draft-v1";
  const tones = ["mint", "pink", "sun"];
  const palettes = ["sekta-mint", "sekta-pink", "sekta-sun"];

  const ui = {
    saveState: document.querySelector("#mobileEditorSaveState"),
    canvas: document.querySelector("#mobileEditorCanvas"),
    image: document.querySelector("#mobileEditorImage"),
    previewTitle: document.querySelector("#mobileEditorPreviewTitle"),
    previewBody: document.querySelector("#mobileEditorPreviewBody"),
    counter: document.querySelector("#mobileEditorCounter"),
    slideLabel: document.querySelector("#mobileEditorSlideLabel"),
    photoLabel: document.querySelector("#mobileEditorPhotoLabel"),
    prev: document.querySelector("#mobileEditorPrev"),
    next: document.querySelector("#mobileEditorNext"),
    rail: document.querySelector("#mobileEditorRail"),
    mediaFilters: document.querySelector("#mobileEditorMediaFilters"),
    mediaSearch: document.querySelector("#mobileEditorMediaSearch"),
    media: document.querySelector("#mobileEditorMedia"),
    shuffle: document.querySelector("#mobileEditorShuffle"),
    title: document.querySelector("#mobileEditorTitle"),
    longread: document.querySelector("#mobileEditorLongread"),
    slideCount: document.querySelector("#mobileEditorSlideCount"),
    split: document.querySelector("#mobileEditorSplit"),
    wordCount: document.querySelector("#mobileEditorWordCount"),
    slideTitle: document.querySelector("#mobileEditorSlideTitle"),
    slideBody: document.querySelector("#mobileEditorSlideBody"),
    openFull: document.querySelector("#mobileEditorOpenFull"),
    status: document.querySelector("#mobileEditorStatus"),
    dock: document.querySelector(".mobile-editor-dock"),
    controls: document.querySelector(".mobile-editor-controls"),
    progress: document.querySelector(".mobile-editor-progress"),
    stage: document.querySelector("#mobileEditorStage"),
    writing: document.querySelector("#mobileEditorWritingSection"),
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const words = (value) => String(value || "").trim().split(/\s+/).filter(Boolean);
  const photoById = (id) => library.find((item) => item.id === id) || null;
  const shuffle = (items) => {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [next[index], next[target]] = [next[target], next[index]];
    }
    return next;
  };

  function scorePhoto(item) {
    const cover = item.carouselRoles?.includes("01_обложка_личное_присутствие") ? 3 : 0;
    const action = item.carouselRoles?.includes("02_действие_и_доказательство") ? 1.5 : 0;
    const person = item.collections?.includes("olya") || /(портрет|portrait|оля)/i.test([item.folderLabel, item.sourceCategory].join(" ")) ? 1.2 : 0;
    return Number(item.agentScore || 0) + cover + action + person;
  }

  let mediaOrder = shuffle([...library].sort((a, b) => scorePhoto(b) - scorePhoto(a)).slice(0, 160));
  let mediaFilter = "suggested";
  let saveTimer;
  let state = loadState();

  function defaultPhoto() {
    return mediaOrder[0] || library[0] || null;
  }

  function normalizeSlide(slide = {}, index = 0) {
    return {
      id: slide.id || `mobile-slide-${Date.now()}-${index}`,
      title: String(slide.title || ""),
      body: String(slide.body || ""),
      photoId: photoById(slide.photoId)?.id || defaultPhoto()?.id || null,
      tone: tones.includes(slide.tone) ? slide.tone : tones[index % tones.length],
      generatedBody: String(slide.generatedBody ?? ""),
    };
  }

  function loadState() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch { saved = null; }
    const fallback = { title: "", longread: "", slideCount: 8, activeSlide: 0, slides: [normalizeSlide({}, 0)] };
    if (!saved || !Array.isArray(saved.slides) || !saved.slides.length) return fallback;
    return {
      title: String(saved.title || ""),
      longread: String(saved.longread || ""),
      slideCount: Math.max(5, Math.min(12, Number(saved.slideCount) || 8)),
      activeSlide: Math.max(0, Math.min(saved.slides.length - 1, Number(saved.activeSlide) || 0)),
      slides: saved.slides.map(normalizeSlide),
    };
  }

  function activeSlide() {
    return state.slides[state.activeSlide] || state.slides[0];
  }

  function markChanged(message = "Черновик сохранён локально.") {
    ui.saveState.classList.add("is-saving");
    ui.saveState.lastChild.textContent = "сохраняем…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      ui.saveState.classList.remove("is-saving");
      ui.saveState.lastChild.textContent = "черновик сохранён";
      ui.status.textContent = message;
    }, 180);
  }

  function categoryMatch(item, category) {
    if (category === "suggested") return true;
    if (category === "all") return true;
    if (item.collections?.includes(category)) return true;
    const haystack = [item.folder, item.folderLabel, item.sourceCategory, ...(item.contentThemes || []), ...(item.collections || [])].join(" ").toLocaleLowerCase("ru");
    if (category === "camp") return /(camp|лагер|кемп|sekta camp)/.test(haystack);
    if (category === "maternity") return /(материн|беремен|родов|реб[её]н)/.test(haystack);
    if (category === "body") return /(тело|спорт|тренир|движен|fitness)/.test(haystack);
    if (category === "neuro") return /(нейро|neuro|ai-медиатек)/.test(haystack);
    if (category === "olya") return /(оля|olya|портрет)/.test(haystack);
    return false;
  }

  function mediaPool() {
    const query = ui.mediaSearch.value.trim().toLocaleLowerCase("ru");
    let pool = mediaFilter === "suggested" ? mediaOrder : library.filter((item) => categoryMatch(item, mediaFilter));
    if (query) pool = pool.filter((item) => [item.fileName, item.folderLabel, item.sourceCategory, ...(item.contentThemes || [])].join(" ").toLocaleLowerCase("ru").includes(query));
    return pool.slice(0, mediaFilter === "suggested" ? 18 : 36);
  }

  function renderMedia() {
    const selectedId = activeSlide()?.photoId;
    const pool = mediaPool();
    ui.media.innerHTML = pool.length
      ? pool.map((item) => `<button class="mobile-editor-photo${item.id === selectedId ? " is-selected" : ""}" type="button" data-mobile-photo="${escapeHtml(item.id)}" aria-pressed="${item.id === selectedId}" aria-label="Выбрать ${escapeHtml(item.fileName)}"><img src="${escapeHtml(item.thumb)}" alt="" loading="lazy"></button>`).join("")
      : `<div class="mobile-editor-empty">Ничего не найдено. Попробуйте другой раздел или запрос.</div>`;
    ui.mediaFilters.querySelectorAll("[data-mobile-media]").forEach((button) => {
      const active = button.dataset.mobileMedia === mediaFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderRail() {
    ui.rail.innerHTML = state.slides.map((slide, index) => {
      const photo = photoById(slide.photoId);
      return `<button class="mobile-editor-slide-chip${index === state.activeSlide ? " is-active" : ""}" type="button" data-mobile-slide="${index}" aria-current="${index === state.activeSlide ? "true" : "false"}" aria-label="Открыть слайд ${index + 1}">${photo ? `<img src="${escapeHtml(photo.thumb)}" alt="" loading="lazy">` : ""}<span>${String(index + 1).padStart(2, "0")}</span></button>`;
    }).join("");
  }

  function renderSlide() {
    const slide = activeSlide();
    const photo = photoById(slide.photoId) || defaultPhoto();
    ui.image.src = photo?.thumb || "";
    ui.previewTitle.textContent = slide.title || (state.activeSlide === 0 ? "Введите заголовок" : "");
    ui.previewBody.textContent = slide.body;
    ui.counter.textContent = `${String(state.activeSlide + 1).padStart(2, "0")} / ${String(state.slides.length).padStart(2, "0")}`;
    ui.slideLabel.textContent = state.activeSlide === 0 ? "Обложка" : `Слайд ${state.activeSlide + 1}`;
    ui.photoLabel.textContent = photo?.folderLabel || "выберите фотографию";
    ui.canvas.dataset.tone = slide.tone;
    ui.slideTitle.value = slide.title;
    ui.slideBody.value = slide.body;
    ui.prev.disabled = state.activeSlide === 0;
    ui.next.disabled = state.activeSlide === state.slides.length - 1;
    ui.dock.querySelector('[data-mobile-dock="prev"]').disabled = ui.prev.disabled;
    ui.dock.querySelector('[data-mobile-dock="next"]').disabled = ui.next.disabled;
    renderRail();
    renderMedia();
  }

  function distributeText(text, count) {
    const clean = String(text || "").trim();
    if (!clean) return [];
    let units = clean.split(/\n\s*\n+/).map((part) => part.trim()).filter(Boolean);
    if (units.length < count) units = clean.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)?.map((part) => part.trim()).filter(Boolean) || units;
    if (units.length < count && words(clean).length >= count) {
      const tokens = clean.split(/\s+/);
      const chunkSize = Math.ceil(tokens.length / count);
      return Array.from({ length: count }, (_, index) => tokens.slice(index * chunkSize, (index + 1) * chunkSize).join(" ").trim());
    }
    const chunks = [];
    let cursor = 0;
    for (let index = 0; index < count && cursor < units.length; index += 1) {
      const remainingChunks = count - index;
      const remainingUnits = units.length - cursor;
      const maxTake = Math.max(1, remainingUnits - (remainingChunks - 1));
      const remainingWordCount = words(units.slice(cursor).join(" ")).length;
      const targetWords = Math.max(1, Math.ceil(remainingWordCount / remainingChunks));
      const parts = [];
      let taken = 0;
      while (cursor < units.length && taken < maxTake) {
        parts.push(units[cursor]);
        cursor += 1;
        taken += 1;
        if (words(parts.join(" ")).length >= targetWords) break;
      }
      chunks.push(parts.join("\n\n").trim());
    }
    return Array.from({ length: count }, (_, index) => chunks[index] || "");
  }

  function splitLongread() {
    const text = ui.longread.value.trim();
    if (!text) {
      ui.status.textContent = "Сначала вставьте лонгрид — формулировки останутся без переписывания.";
      ui.longread.focus();
      return;
    }
    state.title = ui.title.value.trim();
    state.longread = text;
    state.slideCount = Number(ui.slideCount.value);
    const bodyChunks = distributeText(text, state.slideCount - 1);
    const photos = mediaOrder.length ? mediaOrder : library;
    const coverPhoto = photoById(state.slides[0]?.photoId) || photos[0] || null;
    const previousSlides = state.slides;
    const cover = normalizeSlide({ ...previousSlides[0], title: state.title, body: "", photoId: coverPhoto?.id, tone: previousSlides[0]?.tone || "mint", generatedBody: "" }, 0);
    const bodySlides = bodyChunks.map((generatedBody, index) => {
      const previous = previousSlides[index + 1];
      const hasManualBody = previous && previous.body !== previous.generatedBody;
      return normalizeSlide({
        ...previous,
        title: previous?.title || "",
        body: hasManualBody ? previous.body : generatedBody,
        generatedBody,
        photoId: previous?.photoId || photos[(index + 1) % Math.max(1, photos.length)]?.id,
        tone: previous?.tone || tones[(index + 1) % tones.length],
      }, index + 1);
    });
    state.slides = [cover, ...bodySlides];
    state.activeSlide = 0;
    renderSlide();
    markChanged(`Лонгрид распределён на ${state.slides.length} слайдов без переписывания.`);
  }

  function goToSlide(index) {
    state.activeSlide = Math.max(0, Math.min(state.slides.length - 1, index));
    renderSlide();
    markChanged(`Открыт слайд ${state.activeSlide + 1}.`);
  }

  function updateWordCount() {
    const count = words(ui.longread.value).length;
    ui.wordCount.textContent = count ? `${count} слов · примерно ${Math.max(5, Math.min(12, Math.ceil(count / 55) + 1))} слайдов` : "0 слов · сначала вставьте лонгрид";
  }

  function sendToFullEditor() {
    state.title = ui.title.value.trim();
    state.longread = ui.longread.value.trim();
    const detail = {
      id: `mobile-${Date.now()}`,
      kind: "post",
      title: state.title || "Мобильный черновик",
      hook: state.title,
      objective: "Мобильный черновик",
      asset: "Фото выбраны в мобильном редакторе",
      cta: "Доработать и сохранить серию",
      readiness: "Черновик · нужен визуальный и редакторский просмотр",
      source: "Мобильный редактор Content room",
      slideCount: state.slides.length,
      longread: state.longread,
      photoId: state.slides[0]?.photoId || null,
      activeSlide: state.activeSlide,
      openSlides: true,
      slides: state.slides.map((slide, index) => ({ title: slide.title, body: slide.body, role: index === 0 ? "cover" : "longread" })),
      visualPlan: state.slides.map((slide, index) => ({ template: "text-photo", scene: "photo-clean", palette: palettes[index % palettes.length], photoId: slide.photoId })),
    };
    window.dispatchEvent(new CustomEvent("sekta:post-builder-load", { detail }));
    document.querySelector('.nav-item[data-view="postbuilder"]')?.click();
  }

  ui.prev.addEventListener("click", () => goToSlide(state.activeSlide - 1));
  ui.next.addEventListener("click", () => goToSlide(state.activeSlide + 1));
  ui.rail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mobile-slide]");
    if (button) goToSlide(Number(button.dataset.mobileSlide));
  });
  ui.media.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mobile-photo]");
    if (!button) return;
    activeSlide().photoId = button.dataset.mobilePhoto;
    renderSlide();
    markChanged("Фотография применена к текущему слайду.");
  });
  ui.mediaFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mobile-media]");
    if (!button) return;
    mediaFilter = button.dataset.mobileMedia;
    renderMedia();
  });
  ui.progress.addEventListener("click", (event) => {
    const step = event.target.closest("[data-mobile-step]")?.dataset.mobileStep;
    if (!step) return;
    const target = step === "media" ? ui.controls : step === "writing" ? ui.writing : ui.stage;
    ui.progress.querySelectorAll("[data-mobile-step]").forEach((button) => {
      const active = button.dataset.mobileStep === step;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  ui.mediaSearch.addEventListener("input", renderMedia);
  ui.shuffle.addEventListener("click", () => {
    mediaOrder = shuffle(mediaOrder);
    mediaFilter = "suggested";
    renderMedia();
    ui.media.scrollLeft = 0;
    ui.status.textContent = "Подобрали другую сильную фотосерию.";
  });
  ui.title.addEventListener("input", () => {
    state.title = ui.title.value;
    state.slides[0].title = state.title;
    if (state.activeSlide === 0) renderSlide();
    markChanged();
  });
  ui.longread.addEventListener("input", () => {
    state.longread = ui.longread.value;
    updateWordCount();
    markChanged();
  });
  ui.slideCount.addEventListener("change", () => { state.slideCount = Number(ui.slideCount.value); markChanged(); });
  ui.split.addEventListener("click", splitLongread);
  ui.slideTitle.addEventListener("input", () => { activeSlide().title = ui.slideTitle.value; if (state.activeSlide === 0) { state.title = ui.slideTitle.value; ui.title.value = state.title; } renderSlide(); markChanged(); });
  ui.slideBody.addEventListener("input", () => { activeSlide().body = ui.slideBody.value; renderSlide(); markChanged(); });
  ui.openFull.addEventListener("click", sendToFullEditor);
  ui.dock.addEventListener("click", (event) => {
    const action = event.target.closest("[data-mobile-dock]")?.dataset.mobileDock;
    if (action === "prev") goToSlide(state.activeSlide - 1);
    if (action === "next") goToSlide(state.activeSlide + 1);
    if (action === "media") ui.controls.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  ui.title.value = state.title;
  ui.longread.value = state.longread;
  ui.slideCount.value = String(state.slideCount);
  updateWordCount();
  renderSlide();
})();
