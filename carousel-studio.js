(() => {
  const library = window.SEKTA_LIBRARY?.items || [];
  const root = document.querySelector('[data-view-panel="typography"]');
  if (!root) return;

  const DRAFT_KEY = "sekta-carousel-studio-draft-v1";
  const SAVED_KEY = "sekta-carousel-studio-series-v1";
  const IMPORT_KEY = "sekta-carousel-studio-taste-import-v1";
  const DEFAULT_LONGREAD = document.querySelector("#carouselLongreadText")?.value || "";
  const palettes = {
    ink: { name: "Контрастная", background: "#17221f", foreground: "#ffffff", accent: "#f7f7f2", ink: "#17221f" },
    pink: { name: "Розовая", background: "#f35ba7", foreground: "#17221f", accent: "#ffffff", ink: "#17221f" },
    blue: { name: "Синяя", background: "#3155e4", foreground: "#ffffff", accent: "#dce5ff", ink: "#17211e" },
    lime: { name: "Лайм", background: "#d4f04a", foreground: "#17221f", accent: "#ffffff", ink: "#17221f" },
    paper: { name: "Бумага", background: "#fff7e6", foreground: "#5b493b", accent: "#f35ba7", ink: "#392f29" },
  };
  const layoutPresets = {
    "paper-column": { name: "Бумажная колонка", role: "longread", scene: "paper", background: "#f3f1e9", foreground: "#171814", accent: "#e9a692", ink: "#171814" },
    "sage-column": { name: "Тёмное поле", role: "longread", scene: "dark", background: "#35432f", foreground: "#fbfaf5", accent: "#e9a692", ink: "#171814" },
    "cobalt-column": { name: "Кобальт + лайм", role: "longread", scene: "field", background: "#2437d8", foreground: "#fbfaf5", accent: "#d7ff37", ink: "#171814" },
    "two-columns": { name: "Пудра + чернила", role: "longread", scene: "paper", background: "#efd7d0", foreground: "#171814", accent: "#a14d3e", ink: "#171814" },
    "split-photo": { name: "Бумага + красный", role: "longread", scene: "split", background: "#f3f1e9", foreground: "#171814", accent: "#ef4b37", ink: "#171814" },
    "photo-window": { name: "Шалфей + пудра", role: "longread", scene: "window", background: "#d8dfcf", foreground: "#171814", accent: "#e9a692", ink: "#171814" },
    "photo-scrim": { name: "Фото + тёмный scrim", role: "longread", scene: "photo-dim", background: "#1d271b", foreground: "#fbfaf5", accent: "#e9a692", ink: "#171814" },
    "photo-band": { name: "Бумага + фотопауза", role: "longread", scene: "window", background: "#f3f1e9", foreground: "#171814", accent: "#e9a692", ink: "#171814" },
    "photo-plaque": { name: "Чёрная плашка", role: "cover", scene: "plate", background: "#171814", foreground: "#fbfaf5", accent: "#e9a692", ink: "#171814" },
    "photo-shadow": { name: "Белый текст на фото", role: "cover", scene: "photo-dim", background: "#171814", foreground: "#fbfaf5", accent: "#e9a692", ink: "#171814" },
    "top-photo-cover": { name: "Молочный + фото", role: "cover", scene: "window", background: "#fbfaf5", foreground: "#171814", accent: "#e9a692", ink: "#171814" },
    "ink-poster": { name: "Чернильный плакат", role: "cover", scene: "dark", background: "#171814", foreground: "#fbfaf5", accent: "#e9a692", ink: "#171814" },
    "lime-poster": { name: "Лайм + чёрный", role: "cover", scene: "field", background: "#d8ff35", foreground: "#11120f", accent: "#f05232", ink: "#11120f" },
    "ruled-quote": { name: "Бумага + шалфей", role: "quote", scene: "quote", background: "#f3f1e9", foreground: "#171814", accent: "#5f6f54", ink: "#171814" },
    "dark-quote": { name: "Бордо + пудра", role: "quote", scene: "quote", background: "#541f2a", foreground: "#fbf5ef", accent: "#e9a692", ink: "#fbf5ef" },
    "photo-caption": { name: "Фото + молочная полоса", role: "quote", scene: "plate", background: "#fbfaf5", foreground: "#171814", accent: "#e9a692", ink: "#171814" },
  };
  const sceneLabels = {
    "photo-dim": "Фото + затемнение",
    "photo-clean": "Текст на фото",
    plate: "Плашка на фото",
    field: "Цветовое поле",
    paper: "Светлое поле",
    dark: "Тёмное поле",
    split: "Split",
    window: "Фото-окно",
    quote: "Цитатная",
  };
  const roleLabels = { cover: "Обложка", longread: "Лонгрид", quote: "Цитата", proof: "Фото-доказательство", pause: "Фотопауза", cta: "Финал / CTA" };

  const ui = {
    saveState: document.querySelector("#carouselSaveState"),
    status: document.querySelector("#carouselStudioStatus"),
    seriesName: document.querySelector("#carouselSeriesName"),
    fontStrip: document.querySelector("#carouselFontStrip"),
    fontSummary: document.querySelector("#carouselFontSummary"),
    importTaste: document.querySelector("#carouselImportTaste"),
    paletteStrip: document.querySelector("#carouselPaletteStrip"),
    savedCount: document.querySelector("#carouselSavedCount"),
    newSeries: document.querySelector("#carouselNewSeries"),
    saveSeries: document.querySelector("#carouselSaveSeries"),
    coverCanvas: document.querySelector("#carouselCoverCanvas"),
    coverTitle: document.querySelector("#carouselCoverTitle"),
    coverSubtitle: document.querySelector("#carouselCoverSubtitle"),
    coverSize: document.querySelector("#carouselCoverSize"),
    coverSizeValue: document.querySelector("#carouselCoverSizeValue"),
    coverPlacement: document.querySelector("#carouselCoverPlacement"),
    coverAlign: document.querySelector("#carouselCoverAlign"),
    coverCase: document.querySelector("#carouselCoverCase"),
    coverMedia: document.querySelector("#carouselCoverMedia"),
    coverMediaSearch: document.querySelector("#carouselCoverMediaSearch"),
    coverPhotoName: document.querySelector("#carouselCoverPhotoName"),
    saveCover: document.querySelector("#carouselSaveCover"),
    downloadCover: document.querySelector("#carouselDownloadSlide"),
    longread: document.querySelector("#carouselLongreadText"),
    longreadWords: document.querySelector("#carouselLongreadWords"),
    slideCount: document.querySelector("#carouselSlideCount"),
    splitMath: document.querySelector("#carouselSplitMath"),
    keepParagraphs: document.querySelector("#carouselKeepParagraphs"),
    photoRhythm: document.querySelector("#carouselPhotoRhythm"),
    splitText: document.querySelector("#carouselSplitText"),
    splitHint: document.querySelector("#carouselSplitHint"),
    splitPreview: document.querySelector("#carouselSplitPreview"),
    slideRail: document.querySelector("#carouselSlideRail"),
    activeCanvas: document.querySelector("#carouselActiveCanvas"),
    activeTitle: document.querySelector("#carouselActiveTitle"),
    activeMeta: document.querySelector("#carouselActiveMeta"),
    slideTitle: document.querySelector("#carouselSlideTitle"),
    slideBody: document.querySelector("#carouselSlideBody"),
    slideRole: document.querySelector("#carouselSlideRole"),
    slideScene: document.querySelector("#carouselSlideScene"),
    slidePalette: document.querySelector("#carouselSlidePalette"),
    slideSize: document.querySelector("#carouselSlideSize"),
    slideSizeValue: document.querySelector("#carouselSlideSizeValue"),
    slideAlign: document.querySelector("#carouselSlideAlign"),
    slideMedia: document.querySelector("#carouselSlideMedia"),
    slidePhotoName: document.querySelector("#carouselSlidePhotoName"),
    removePhoto: document.querySelector("#carouselRemovePhoto"),
    saveSlide: document.querySelector("#carouselSaveSlide"),
    downloadActive: document.querySelector("#carouselDownloadActive"),
    duplicateSlide: document.querySelector("#carouselDuplicateSlide"),
    savedSeries: document.querySelector("#carouselSavedSeries"),
    exportSeries: document.querySelector("#carouselExportSeries"),
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const readJson = (key, fallback) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };
  let tasteBundle = readJson(IMPORT_KEY, {});

  function consumeTasteImport() {
    const prefix = "#type-import=";
    if (!location.hash.startsWith(prefix)) return false;
    try {
      const imported = JSON.parse(decodeURIComponent(location.hash.slice(prefix.length)));
      if (!imported || imported.schemaVersion !== 1) throw new Error("unsupported bundle");
      tasteBundle = imported;
      localStorage.setItem(IMPORT_KEY, JSON.stringify(imported));
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      return true;
    } catch {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      return false;
    }
  }
  const importedOnLoad = consumeTasteImport();
  const deepClone = (value) => JSON.parse(JSON.stringify(value));
  const words = (value) => String(value || "").trim().split(/\s+/).filter(Boolean);
  const plural = (number, one, few, many) => {
    const mod10 = number % 10;
    const mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
  };
  const photoById = (id) => library.find((item) => item.id === id) || null;
  const preferredPhoto = () => library.find((item) => item.orientation === "portrait" && item.carouselRoles?.includes("01_обложка_личное_присутствие")) || library.find((item) => item.orientation === "portrait") || library[0] || null;

  function fontChoices() {
    const votes = readJson("olymarkes-cyrillic-font-taste-v1", {});
    const layoutPrefs = readJson("olymarkes-text-layout-prefs-v1", {});
    const savedSystems = [...(Array.isArray(tasteBundle.systems) ? tasteBundle.systems : []), ...(readJson("olymarkes-type-system-studio-v1", []) || [])];
    const selected = [];
    const add = (family, caseKind = "original", body = "", recipe = "") => {
      if (!family) return;
      const normalized = { family, caseKind: caseKind || "original", body: body || companionFor(family), recipe };
      normalized.key = [normalized.family, normalized.caseKind, normalized.body, normalized.recipe].join("|");
      if (selected.some((font) => font.key === normalized.key)) return;
      selected.push(normalized);
    };
    savedSystems.forEach((system) => {
      const [family, caseKind, recipe, body] = String(system.key || "").split("|");
      add(family, caseKind, body, recipe || system.label || "сохранённая система");
    });
    const preferredChoice = tasteBundle.layoutPrefs?.choice || layoutPrefs.choice;
    if (preferredChoice) {
      const [family, caseKind] = preferredChoice.split("|");
      add(family, caseKind, tasteBundle.layoutPrefs?.body || layoutPrefs.body);
    }
    (tasteBundle.fontLikes || []).forEach((key) => {
      const split = String(key).lastIndexOf("|");
      if (split > 0) add(key.slice(0, split), key.slice(split + 1));
    });
    Object.entries(votes).forEach(([key, value]) => {
      if (value !== "like" || !key.includes("|")) return;
      const split = key.lastIndexOf("|");
      add(key.slice(0, split), key.slice(split + 1));
    });
    if (!selected.length) {
      add("Onest", "original", "Golos Text", "стартовая система");
      add("Golos Text", "original", "Golos Text", "стартовая система");
      add("Literata", "original", "Onest", "стартовая система");
    }
    return selected;
  }

  function companionFor(family) {
    const font = (window.CYRILLIC_FONT_DATA || []).find((item) => item.family === family);
    if (!font) return family === "Literata" ? "Onest" : "Literata";
    return ["Serif"].includes(font.category) ? "Onest" : "Literata";
  }

  function ensureFontFamily(family) {
    if (!family || ["Onest", "Golos Text", "Literata", "Manrope", "Commissioner", "Geologica", "Unbounded", "Prata", "Cormorant", "Shantell Sans"].includes(family)) return;
    const key = family.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    if (document.querySelector(`link[data-carousel-font="${key}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.carouselFont = key;
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;600;700;800;900&display=swap`;
    document.head.append(link);
  }

  function ensureFont(font) {
    ensureFontFamily(font?.family);
    ensureFontFamily(font?.body);
  }

  function layoutLikeIds() {
    const localLikes = Object.entries(readJson("olymarkes-carousel-layout-taste-v1", {})).filter(([, value]) => value === "like").map(([key]) => key.split("|").at(-1));
    const importedLikes = (tasteBundle.layoutLikes || []).map((key) => String(key).split("|").at(-1));
    return [...new Set([...importedLikes, ...localLikes])].filter((id) => layoutPresets[id]);
  }

  function paletteChoices() {
    const choices = { ...palettes };
    layoutLikeIds().forEach((id) => { choices[`layout-${id}`] = { ...layoutPresets[id], sourceId: id }; });
    return choices;
  }

  function paletteFor(id) {
    return paletteChoices()[id] || palettes.ink;
  }

  function fontSystemKey(font) {
    return font?.key || [font?.family || "Onest", font?.caseKind || "original", font?.body || companionFor(font?.family || "Onest"), font?.recipe || ""].join("|");
  }

  function normalizeFontSystem(font) {
    const normalized = {
      family: font?.family || "Onest",
      caseKind: font?.caseKind || "original",
      body: font?.body || companionFor(font?.family || "Onest"),
      recipe: font?.recipe || "",
    };
    normalized.key = fontSystemKey(normalized);
    return normalized;
  }

  function makeSlide(overrides = {}) {
    return {
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "longread",
      title: "",
      body: "",
      scene: "paper",
      palette: "ink",
      size: 46,
      align: "left",
      placement: "middle",
      caseKind: "original",
      photoId: null,
      savedAt: null,
      ...overrides,
    };
  }

  function defaultSeries() {
    const firstPhoto = preferredPhoto();
    const firstFont = fontChoices()[0] || { family: "Onest", caseKind: "original" };
    const series = {
      id: `series-${Date.now()}`,
      name: "Возвращение после паузы",
      font: firstFont,
      palette: "ink",
      longread: DEFAULT_LONGREAD,
      totalSlides: 10,
      activeSlide: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slides: [
        makeSlide({ role: "cover", title: "Пропустили пять дней? Ничего не сломалось", body: "10 слайдов · сохрани", scene: "photo-dim", palette: "ink", size: 88, placement: "bottom", photoId: firstPhoto?.id || null }),
        makeSlide({ role: "cta", title: "Возвращение не требует наказания", body: "Сохраните, чтобы вернуться к этой мысли в нужный день.", scene: "field", palette: "lime", size: 58 }),
      ],
    };
    return splitSeries(series, 10, true, true);
  }

  function normalizeSeries(candidate) {
    if (!candidate || !Array.isArray(candidate.slides) || candidate.slides.length < 2) return defaultSeries();
    return {
      ...candidate,
      font: normalizeFontSystem(candidate.font?.family ? candidate.font : fontChoices()[0]),
      palette: paletteChoices()[candidate.palette] ? candidate.palette : "ink",
      longread: candidate.longread || DEFAULT_LONGREAD,
      totalSlides: candidate.slides.length,
      activeSlide: Math.min(Math.max(Number(candidate.activeSlide) || 0, 0), candidate.slides.length - 1),
      slides: candidate.slides.map((slide) => makeSlide(slide)),
    };
  }

  function sentenceUnits(text) {
    return String(text || "").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean).flatMap((paragraph, paragraphIndex) => {
      const sentences = paragraph.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [paragraph];
      return sentences.map((sentence) => ({ text: sentence.trim(), paragraphIndex })).filter((unit) => unit.text);
    });
  }

  function splitUnit(unit, limit) {
    const unitWords = words(unit.text);
    if (unitWords.length <= limit) return [unit];
    const pieces = [];
    for (let index = 0; index < unitWords.length; index += limit) {
      pieces.push({ text: unitWords.slice(index, index + limit).join(" "), paragraphIndex: unit.paragraphIndex });
    }
    return pieces;
  }

  function distributeText(text, slots, keepParagraphs) {
    if (slots <= 0) return [];
    const totalWords = words(text).length;
    if (!totalWords) return Array.from({ length: slots }, () => "");
    const target = Math.max(12, Math.ceil(totalWords / slots));
    let units = sentenceUnits(text).flatMap((unit) => splitUnit(unit, Math.max(target, 20)));
    if (!units.length) units = [{ text: String(text).trim(), paragraphIndex: 0 }];
    while (units.length < slots) {
      const index = units.reduce((best, unit, current) => words(unit.text).length > words(units[best].text).length ? current : best, 0);
      const unitWords = words(units[index].text);
      if (unitWords.length < 2) break;
      const middle = Math.ceil(unitWords.length / 2);
      const first = { ...units[index], text: unitWords.slice(0, middle).join(" ") };
      const second = { ...units[index], text: unitWords.slice(middle).join(" ") };
      units.splice(index, 1, first, second);
    }
    const chunks = [];
    let cursor = 0;
    for (let slot = 0; slot < slots; slot += 1) {
      const remainingSlots = slots - slot;
      const remainingUnits = units.length - cursor;
      if (remainingUnits <= 0) {
        chunks.push("");
        continue;
      }
      const remainingWords = units.slice(cursor).reduce((sum, unit) => sum + words(unit.text).length, 0);
      const desired = Math.max(1, Math.ceil(remainingWords / remainingSlots));
      const selected = [];
      let selectedWords = 0;
      while (cursor < units.length) {
        const mustLeave = units.length - (cursor + 1) >= remainingSlots - 1;
        if (selected.length && selectedWords >= desired && mustLeave) break;
        selected.push(units[cursor]);
        selectedWords += words(units[cursor].text).length;
        cursor += 1;
        if (units.length - cursor === remainingSlots - 1) break;
      }
      chunks.push(selected.map((unit, index) => {
        if (!index) return unit.text;
        return keepParagraphs && unit.paragraphIndex !== selected[index - 1].paragraphIndex ? `\n\n${unit.text}` : ` ${unit.text}`;
      }).join(""));
    }
    if (cursor < units.length) chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${units.slice(cursor).map((unit) => unit.text).join(" ")}`.trim();
    return chunks;
  }

  function splitSeries(source, total, keepParagraphs, photoRhythm) {
    const next = deepClone(source);
    const cover = next.slides[0] || makeSlide({ role: "cover" });
    const previousFinal = next.slides[next.slides.length - 1];
    const finalSlide = previousFinal?.role === "cta" ? previousFinal : makeSlide({ role: "cta", title: "Сохраните эту мысль", body: "Вернитесь к ней, когда снова захочется начать с наказания.", scene: "field", palette: "lime", size: 58 });
    const chunks = distributeText(next.longread, total - 2, keepParagraphs);
    const photos = library.filter((item) => item.orientation === "portrait").slice(0, Math.max(1, chunks.length));
    const bodySlides = chunks.map((body, index) => {
      const withPhoto = photoRhythm && index % 3 === 2;
      const scenes = ["paper", "field", "quote", "dark"];
      return makeSlide({
        role: index % 4 === 2 ? "quote" : "longread",
        body,
        scene: withPhoto ? "photo-dim" : scenes[index % scenes.length],
        palette: index % 4 === 1 ? next.palette : index % 4 === 2 ? "paper" : next.palette,
        size: words(body).length > 70 ? 34 : words(body).length > 48 ? 38 : 44,
        photoId: withPhoto ? photos[index % photos.length]?.id || null : null,
      });
    });
    next.slides = [cover, ...bodySlides, finalSlide];
    next.totalSlides = next.slides.length;
    next.activeSlide = Math.min(next.activeSlide || 0, next.slides.length - 1);
    next.updatedAt = new Date().toISOString();
    return next;
  }

  let series = normalizeSeries(readJson(DRAFT_KEY, null));
  let savedSeries = readJson(SAVED_KEY, []);
  if (!Array.isArray(savedSeries)) savedSeries = [];
  let activeStage = "cover";
  let saveTimer;

  function setStatus(message) {
    ui.status.textContent = message;
  }

  function markChanged() {
    series.updatedAt = new Date().toISOString();
    ui.saveState.classList.add("is-saving");
    ui.saveState.lastChild.textContent = "сохраняем черновик…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(series));
      ui.saveState.classList.remove("is-saving");
      ui.saveState.lastChild.textContent = "черновик сохранён локально";
    }, 180);
  }

  function displayText(text, caseKind) {
    if (caseKind === "upper") return String(text || "").toLocaleUpperCase("ru-RU");
    if (caseKind === "lower") return String(text || "").toLocaleLowerCase("ru-RU");
    return String(text || "");
  }

  function renderCanvas(element, slide, index) {
    if (!element || !slide) return;
    const photo = photoById(slide.photoId);
    const palette = paletteFor(slide.palette || series.palette);
    ensureFont(series.font);
    element.className = "carousel-slide-canvas";
    element.dataset.scene = slide.scene;
    element.dataset.palette = slide.palette;
    element.dataset.placement = slide.placement || "middle";
    element.dataset.align = slide.align || "left";
    element.dataset.role = slide.role;
    element.style.setProperty("--carousel-head-font", `"${series.font.family}"`);
    element.style.setProperty("--carousel-body-font", `"${series.font.body || companionFor(series.font.family)}"`);
    element.style.setProperty("--carousel-bg", palette.background);
    element.style.setProperty("--carousel-fg", palette.foreground);
    element.style.setProperty("--carousel-accent", palette.accent);
    element.style.setProperty("--carousel-ink", palette.ink);
    element.style.setProperty("--carousel-title-size", `${Math.max(24, Math.round((slide.size || 46) * .48))}px`);
    element.style.setProperty("--carousel-body-size", `${Math.max(15, Math.min(27, Math.round((slide.size || 46) * .32)))}px`);
    const image = photo && !["paper", "field", "dark", "quote"].includes(slide.scene)
      ? `<img class="carousel-render-photo" src="${escapeHtml(photo.thumb)}" alt="">`
      : "";
    const title = slide.title ? `<strong>${escapeHtml(displayText(slide.title, slide.caseKind || series.font.caseKind))}</strong>` : "";
    const body = slide.body ? `<p>${escapeHtml(slide.body).replace(/\n\n/g, "</p><p>")}</p>` : "";
    element.innerHTML = `${image}<div class="carousel-render-shade"></div><div class="carousel-render-content"><span class="carousel-render-series">${escapeHtml(series.name)}</span>${title}${body}<small>${String(index + 1).padStart(2, "0")} / ${String(series.slides.length).padStart(2, "0")}</small></div>`;
  }

  function renderFontStrip() {
    const choices = fontChoices();
    const activeKey = fontSystemKey(series.font);
    if (!choices.some((font) => fontSystemKey(font) === activeKey)) choices.unshift(normalizeFontSystem(series.font));
    const familyCount = new Set(choices.map((font) => font.family)).size;
    const savedCount = choices.filter((font) => font.recipe && font.recipe !== "стартовая система").length;
    ui.fontSummary.textContent = tasteBundle.importedAt || Object.keys(readJson("olymarkes-cyrillic-font-taste-v1", {})).length
      ? `${familyCount} ${plural(familyCount, "гарнитура", "гарнитуры", "гарнитур")} · ${choices.length} ${plural(choices.length, "вариант", "варианта", "вариантов")} · ${savedCount} сохранённых систем`
      : "Выбор из примерочной ещё не импортирован — показаны только стартовые системы.";
    ui.fontStrip.innerHTML = choices.map((font) => {
      const key = fontSystemKey(font);
      const caseLabel = font.caseKind === "upper" ? "КАПС" : font.caseKind === "lower" ? "строчные" : "исходный регистр";
      const recipe = font.recipe && font.recipe !== "стартовая система" ? ` · ${font.recipe}` : "";
      return `<button type="button" class="carousel-font-system${key === activeKey ? " is-active" : ""}" data-carousel-system-key="${escapeHtml(key)}" style="--font-choice:'${escapeHtml(font.family)}'"><span>${escapeHtml(font.family)} <i>× ${escapeHtml(font.body)}</i></span><small>${caseLabel}${escapeHtml(recipe)}</small></button>`;
    }).join("");
    choices.forEach(ensureFont);
  }

  function renderPaletteState() {
    const choices = paletteChoices();
    ui.paletteStrip.innerHTML = Object.entries(choices).map(([id, palette]) => `<button type="button" class="carousel-palette-system${id === series.palette ? " is-active" : ""}" data-carousel-palette="${escapeHtml(id)}" aria-label="${escapeHtml(palette.name)}" style="--palette:${palette.background};--palette-2:${palette.foreground};--palette-3:${palette.accent}"><span></span><small>${escapeHtml(palette.name)}</small>${palette.sourceId ? `<em>${escapeHtml(roleLabels[palette.role] || palette.role)}</em>` : ""}</button>`).join("");
  }

  function renderSlidePaletteOptions(selectedId) {
    const choices = paletteChoices();
    ui.slidePalette.innerHTML = Object.entries(choices).map(([id, palette]) => `<option value="${escapeHtml(id)}">${escapeHtml(palette.name)}${palette.sourceId ? ` · ${roleLabels[palette.role] || palette.role}` : ""}</option>`).join("");
    ui.slidePalette.value = choices[selectedId] ? selectedId : "ink";
  }

  function mediaPool(query = "") {
    const normalized = query.trim().toLocaleLowerCase("ru");
    const publishable = library.filter((item) => item.publicationStatus !== "not-public" && item.mediaType !== "video");
    const pool = normalized ? publishable.filter((item) => [item.fileName, item.folderLabel, item.sourceCategory, item.materialType, ...(item.projects || []), ...(item.collections || []), ...(item.people || []), ...(item.topics || []), ...(item.searchAliases || []), ...(item.contentThemes || []), ...(item.carouselRoles || [])].join(" ").replaceAll("_", " ").toLocaleLowerCase("ru").includes(normalized)) : publishable;
    return [...pool].sort((a, b) => Number(b.orientation === "portrait") - Number(a.orientation === "portrait")).slice(0, 18);
  }

  function renderMediaStrip(element, selectedId, query = "") {
    const pool = mediaPool(query);
    element.innerHTML = pool.length ? pool.map((photo) => `<button type="button" class="${photo.id === selectedId ? "is-selected" : ""}" data-carousel-photo="${escapeHtml(photo.id)}" aria-label="Выбрать ${escapeHtml(photo.fileName)}"><img src="${escapeHtml(photo.thumb)}" alt="" loading="lazy"></button>`).join("") : `<span class="carousel-media-empty">Ничего не найдено.</span>`;
  }

  function coverSlide() {
    return series.slides[0];
  }

  function activeSlide() {
    return series.slides[series.activeSlide] || series.slides[0];
  }

  function syncCoverForm() {
    const slide = coverSlide();
    ui.seriesName.value = series.name;
    ui.coverTitle.value = slide.title;
    ui.coverSubtitle.value = slide.body;
    ui.coverSize.value = slide.size;
    ui.coverSizeValue.textContent = `${slide.size} px`;
    ui.coverPlacement.value = slide.placement || "bottom";
    ui.coverAlign.value = slide.align || "left";
    ui.coverCase.value = slide.caseKind || "original";
    ui.longread.value = series.longread;
    ui.slideCount.value = String(series.totalSlides || series.slides.length);
    document.querySelectorAll("[data-carousel-scene]").forEach((button) => button.classList.toggle("is-active", button.dataset.carouselScene === slide.scene));
    const photo = photoById(slide.photoId);
    ui.coverPhotoName.textContent = photo?.fileName || "без фотографии";
    renderMediaStrip(ui.coverMedia, slide.photoId, ui.coverMediaSearch.value);
  }

  function renderCover() {
    renderCanvas(ui.coverCanvas, coverSlide(), 0);
    syncCoverForm();
  }

  function renderSplitPreview() {
    const bodySlides = series.slides.slice(1, -1);
    ui.splitPreview.innerHTML = bodySlides.map((slide, index) => `<button type="button" data-edit-split="${index + 1}"><span>${String(index + 2).padStart(2, "0")}</span><strong>${escapeHtml(sceneLabels[slide.scene] || slide.scene)}</strong><p>${escapeHtml(slide.body || "Пустой слайд")}</p><small>${words(slide.body).length} ${plural(words(slide.body).length, "слово", "слова", "слов")}</small></button>`).join("");
    const count = Number(ui.slideCount.value || series.totalSlides || 10);
    ui.splitMath.innerHTML = `<strong>1 + ${Math.max(0, count - 2)} + 1</strong><span>обложка · текст · финал</span>`;
    const countWords = words(ui.longread.value).length;
    ui.longreadWords.textContent = `${countWords} ${plural(countWords, "слово", "слова", "слов")}`;
  }

  function miniSlideMarkup(slide, index) {
    const palette = paletteFor(slide.palette);
    const photo = photoById(slide.photoId);
    const image = photo && !["paper", "field", "dark", "quote"].includes(slide.scene) ? `<img src="${escapeHtml(photo.thumb)}" alt="">` : "";
    const label = slide.title || slide.body || roleLabels[slide.role];
    return `<button type="button" class="carousel-mini-slide${index === series.activeSlide ? " is-active" : ""}${slide.savedAt ? " is-saved" : ""}" data-carousel-slide-index="${index}" style="--mini-bg:${palette.background};--mini-fg:${palette.foreground};--mini-font:'${escapeHtml(series.font.family)}'"><span>${String(index + 1).padStart(2, "0")}</span><div>${image}<strong>${escapeHtml(label)}</strong></div><small>${escapeHtml(roleLabels[slide.role] || slide.role)}</small></button>`;
  }

  function renderRail() {
    ui.slideRail.innerHTML = series.slides.map(miniSlideMarkup).join("");
  }

  function syncActiveForm() {
    const slide = activeSlide();
    ui.activeTitle.textContent = `Слайд ${series.activeSlide + 1}`;
    ui.activeMeta.textContent = `${roleLabels[slide.role] || slide.role} · ${slide.savedAt ? "сохранён" : "есть изменения"}`;
    ui.slideTitle.value = slide.title || "";
    ui.slideBody.value = slide.body || "";
    ui.slideRole.value = slide.role;
    ui.slideScene.value = slide.scene;
    renderSlidePaletteOptions(slide.palette);
    ui.slideSize.value = slide.size;
    ui.slideSizeValue.textContent = `${slide.size} px`;
    ui.slideAlign.value = slide.align || "left";
    const photo = photoById(slide.photoId);
    ui.slidePhotoName.textContent = photo?.fileName || "без фотографии";
    ui.removePhoto.disabled = !slide.photoId;
    renderMediaStrip(ui.slideMedia, slide.photoId);
  }

  function renderActiveEditor() {
    renderCanvas(ui.activeCanvas, activeSlide(), series.activeSlide);
    syncActiveForm();
    renderRail();
  }

  function renderSaved() {
    ui.savedCount.textContent = savedSeries.length ? `${savedSeries.length} ${plural(savedSeries.length, "серия", "серии", "серий")}` : "пока нет серий";
    if (!savedSeries.length) {
      ui.savedSeries.innerHTML = `<div class="carousel-saved-empty"><strong>Здесь появятся собранные карусели</strong><span>Сохраните текущую серию — вместе останутся тексты, сцены, фотографии, цвета и шрифт.</span></div>`;
      return;
    }
    ui.savedSeries.innerHTML = savedSeries.map((item) => {
      const cover = item.slides?.[0] || {};
      const photo = photoById(cover.photoId);
      const palette = paletteFor(item.palette);
      return `<article class="carousel-saved-card"><div class="carousel-saved-cover" style="--saved-bg:${palette.background};--saved-fg:${palette.foreground};--saved-font:'${escapeHtml(item.font?.family || "Onest")}'">${photo ? `<img src="${escapeHtml(photo.thumb)}" alt="">` : ""}<strong>${escapeHtml(cover.title || item.name)}</strong></div><div class="carousel-saved-copy"><span>${item.slides.length} слайдов · ${escapeHtml(item.font?.family || "Onest")} × ${escapeHtml(item.font?.body || companionFor(item.font?.family || "Onest"))}</span><h3>${escapeHtml(item.name)}</h3><small>${new Date(item.updatedAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small><div><button class="button button-primary" type="button" data-load-series="${escapeHtml(item.id)}">Открыть</button><button class="button button-secondary" type="button" data-duplicate-series="${escapeHtml(item.id)}">Копия</button><button class="button button-quiet" type="button" data-delete-series="${escapeHtml(item.id)}">Удалить</button></div></div></article>`;
    }).join("");
  }

  function renderAll() {
    renderFontStrip();
    renderPaletteState();
    renderCover();
    renderSplitPreview();
    renderActiveEditor();
    renderSaved();
  }

  function setStage(stage, focus = false) {
    activeStage = stage;
    document.querySelectorAll("[data-carousel-stage]").forEach((button) => {
      const active = button.dataset.carouselStage === stage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    document.querySelectorAll("[data-carousel-stage-panel]").forEach((panel) => {
      const active = panel.dataset.carouselStagePanel === stage;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
    if (stage === "cover") renderCover();
    if (stage === "longread") renderSplitPreview();
    if (stage === "slides") renderActiveEditor();
    if (stage === "saved") renderSaved();
  }

  function updateCoverFromForm() {
    const slide = coverSlide();
    series.name = ui.seriesName.value.trim() || "Новая серия";
    slide.title = ui.coverTitle.value;
    slide.body = ui.coverSubtitle.value;
    slide.size = Number(ui.coverSize.value);
    slide.placement = ui.coverPlacement.value;
    slide.align = ui.coverAlign.value;
    slide.caseKind = ui.coverCase.value;
    slide.savedAt = null;
    ui.coverSizeValue.textContent = `${slide.size} px`;
    renderCanvas(ui.coverCanvas, slide, 0);
    markChanged();
  }

  function updateActiveFromForm() {
    const slide = activeSlide();
    slide.title = ui.slideTitle.value;
    slide.body = ui.slideBody.value;
    slide.role = ui.slideRole.value;
    slide.scene = ui.slideScene.value;
    slide.palette = ui.slidePalette.value;
    slide.size = Number(ui.slideSize.value);
    slide.align = ui.slideAlign.value;
    slide.savedAt = null;
    ui.slideSizeValue.textContent = `${slide.size} px`;
    renderCanvas(ui.activeCanvas, slide, series.activeSlide);
    ui.activeMeta.textContent = `${roleLabels[slide.role] || slide.role} · есть изменения`;
    renderRail();
    markChanged();
  }

  function saveCurrentSlide(index = series.activeSlide) {
    const slide = series.slides[index];
    if (!slide) return;
    slide.savedAt = new Date().toISOString();
    markChanged();
    renderRail();
    if (index === series.activeSlide) syncActiveForm();
    setStatus(`Слайд ${index + 1} сохранён внутри черновика.`);
  }

  function saveWholeSeries() {
    series.updatedAt = new Date().toISOString();
    series.slides.forEach((slide) => { if (!slide.savedAt) slide.savedAt = series.updatedAt; });
    const existing = savedSeries.findIndex((item) => item.id === series.id);
    const snapshot = deepClone(series);
    if (existing >= 0) savedSeries.splice(existing, 1, snapshot);
    else savedSeries.unshift(snapshot);
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedSeries));
    localStorage.setItem(DRAFT_KEY, JSON.stringify(series));
    renderSaved();
    renderRail();
    setStatus(`Серия «${series.name}» сохранена: ${series.slides.length} слайдов.`);
  }

  function performSplit() {
    const text = ui.longread.value.trim();
    if (!text) {
      ui.splitHint.textContent = "Сначала вставьте текст лонгрида.";
      ui.longread.focus();
      return;
    }
    const total = Number(ui.slideCount.value);
    series.longread = text;
    series = splitSeries(series, total, ui.keepParagraphs.checked, ui.photoRhythm.checked);
    ui.splitHint.textContent = `Текст разложен на ${total} слайдов без сокращений. Каждый кадр можно править отдельно.`;
    renderAll();
    markChanged();
    setStatus(`Лонгрид разложен: обложка, ${total - 2} текстовых слайдов и финал.`);
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = location.protocol === "file:" && !/^https?:/.test(source) ? `https://olymarkes.github.io/sekta-smm-content-room/${source}` : source;
    });
  }

  function cropImage(context, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function wrapCanvasText(context, text, maxWidth) {
    const result = [];
    String(text || "").split(/\n\s*\n/).forEach((paragraph, paragraphIndex) => {
      let line = "";
      words(paragraph).forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (line && context.measureText(candidate).width > maxWidth) {
          result.push(line);
          line = word;
        } else line = candidate;
      });
      if (line) result.push(line);
      if (paragraphIndex < String(text || "").split(/\n\s*\n/).length - 1) result.push("");
    });
    return result;
  }

  async function makeSlideCanvas(slide, index) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    const palette = paletteFor(slide.palette);
    const photo = photoById(slide.photoId);
    const usesPhoto = photo && !["paper", "field", "dark", "quote"].includes(slide.scene);
    context.fillStyle = palette.background;
    context.fillRect(0, 0, 1080, 1350);
    if (usesPhoto) {
      const image = await loadImage(photo.thumb);
      if (slide.scene === "split") cropImage(context, image, 600, 0, 480, 1350);
      else if (slide.scene === "window") cropImage(context, image, 90, 90, 900, 520);
      else cropImage(context, image, 0, 0, 1080, 1350);
      if (slide.scene === "photo-dim" || slide.scene === "plate") {
        const gradient = context.createLinearGradient(0, 250, 0, 1350);
        gradient.addColorStop(0, "rgba(10,16,14,.08)");
        gradient.addColorStop(1, "rgba(10,16,14,.88)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1080, 1350);
      }
    }
    const lightScene = ["paper", "quote", "field", "dark"].includes(slide.scene) || slide.scene === "split";
    const foreground = lightScene ? palette.foreground : "#ffffff";
    context.fillStyle = foreground;
    context.textAlign = slide.align || "left";
    context.textBaseline = "alphabetic";
    const x = slide.align === "center" ? 540 : slide.align === "right" ? 980 : 100;
    const maxWidth = slide.scene === "split" ? 440 : 880;
    const fontFamily = `"${series.font.family}", Arial, sans-serif`;
    const bodyFontFamily = `"${series.font.body || companionFor(series.font.family)}", Arial, sans-serif`;
    const titleText = displayText(slide.title, slide.caseKind || series.font.caseKind);
    let titleSize = Math.max(40, Math.min(132, Number(slide.size) || 46));
    context.font = `800 ${titleSize}px ${fontFamily}`;
    let titleLines = wrapCanvasText(context, titleText, maxWidth);
    while (titleLines.length > 6 && titleSize > 42) {
      titleSize -= 4;
      context.font = `800 ${titleSize}px ${fontFamily}`;
      titleLines = wrapCanvasText(context, titleText, maxWidth);
    }
    const bodySize = Math.max(32, Math.min(58, Math.round(titleSize * .55)));
    context.font = `500 ${bodySize}px ${bodyFontFamily}`;
    const bodyLines = wrapCanvasText(context, slide.body, maxWidth);
    const titleHeight = titleLines.length * titleSize * .98;
    const bodyHeight = bodyLines.length * bodySize * 1.3;
    const blockHeight = titleHeight + (titleLines.length && bodyLines.length ? 50 : 0) + bodyHeight;
    let startY = slide.placement === "top" ? 210 : slide.placement === "bottom" ? 1180 - blockHeight : (1350 - blockHeight) / 2;
    if (["window"].includes(slide.scene)) startY = 720;
    if (slide.scene === "plate") {
      context.fillStyle = palette.background;
      context.beginPath();
      context.roundRect(65, startY - titleSize, 950, blockHeight + 100, 18);
      context.fill();
      context.fillStyle = palette.foreground;
    }
    context.font = `800 ${titleSize}px ${fontFamily}`;
    titleLines.forEach((line, lineIndex) => {
      context.fillText(line, x, startY + titleSize * (lineIndex + .85), maxWidth);
    });
    let bodyY = startY + titleHeight + (titleLines.length && bodyLines.length ? 50 : 0);
    context.font = `500 ${bodySize}px ${bodyFontFamily}`;
    bodyLines.forEach((line) => {
      bodyY += bodySize * (line ? 1.3 : .7);
      if (line) context.fillText(line, x, bodyY, maxWidth);
    });
    context.font = `700 24px Arial, sans-serif`;
    context.fillStyle = foreground;
    context.textAlign = "left";
    context.fillText(series.name, 100, 90);
    context.textAlign = "right";
    context.fillText(`${String(index + 1).padStart(2, "0")} / ${String(series.slides.length).padStart(2, "0")}`, 980, 1280);
    return canvas;
  }

  async function downloadSlide(slide, index) {
    try {
      setStatus("Собираем PNG 1080 × 1350…");
      ensureFont(series.font);
      try { await document.fonts.load(`800 ${slide.size}px "${series.font.family}"`); } catch {}
      const canvas = await makeSlideCanvas(slide, index);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("empty PNG");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${series.name.toLocaleLowerCase("ru-RU").replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "") || "carousel"}-${String(index + 1).padStart(2, "0")}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setStatus(`Слайд ${index + 1} скачан в PNG.`);
    } catch {
      setStatus("PNG не собрался. Откройте опубликованную версию и попробуйте ещё раз.");
    }
  }

  function exportSeries() {
    const blob = new Blob([JSON.stringify(series, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${series.name.toLocaleLowerCase("ru-RU").replace(/[^a-zа-яё0-9]+/gi, "-") || "carousel"}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus("Структура серии экспортирована в JSON.");
  }

  document.querySelectorAll("[data-carousel-stage]").forEach((button) => button.addEventListener("click", () => setStage(button.dataset.carouselStage)));
  document.querySelector(".carousel-studio-tabs").addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...document.querySelectorAll("[data-carousel-stage]")];
    const current = Math.max(0, tabs.indexOf(document.activeElement));
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    setStage(tabs[next].dataset.carouselStage, true);
  });
  document.querySelectorAll("[data-carousel-go]").forEach((button) => button.addEventListener("click", () => setStage(button.dataset.carouselGo)));

  ui.fontStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-carousel-system-key]");
    if (!button) return;
    const choice = fontChoices().find((font) => fontSystemKey(font) === button.dataset.carouselSystemKey);
    if (!choice) return;
    series.font = normalizeFontSystem(choice);
    ensureFont(series.font);
    renderFontStrip();
    renderCover();
    renderActiveEditor();
    markChanged();
    setStatus(`${series.font.family} × ${series.font.body} применены ко всей карусели.`);
  });
  ui.paletteStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-carousel-palette]");
    if (!button) return;
    series.palette = button.dataset.carouselPalette;
    const choice = paletteFor(series.palette);
    series.slides.forEach((slide, index) => {
      slide.palette = series.palette;
      if (choice.sourceId && ((choice.role === "cover" && index === 0) || (choice.role === "longread" && index > 0 && index < series.slides.length - 1) || (choice.role === "quote" && slide.role === "quote"))) slide.scene = choice.scene;
      slide.savedAt = null;
    });
    renderPaletteState();
    renderCover();
    renderSplitPreview();
    renderActiveEditor();
    markChanged();
    setStatus(choice.sourceId ? `Система «${choice.name}» применена вместе с подходящей сценой.` : "Палитра применена ко всей серии; любой слайд можно перекрасить отдельно.");
  });

  ui.importTaste.addEventListener("click", () => {
    setStatus("Откройте локальную примерочную и нажмите «Передать всё в монтаж» — страница сама перенесёт шрифты, пары и понравившиеся сцены сюда.");
    ui.importTaste.textContent = "Жду передачу из примерочной";
    setTimeout(() => { ui.importTaste.textContent = tasteBundle.importedAt ? "Обновить выбор" : "Импортировать выбор"; }, 3200);
  });

  [ui.seriesName, ui.coverTitle, ui.coverSubtitle, ui.coverSize, ui.coverPlacement, ui.coverAlign, ui.coverCase].forEach((control) => control.addEventListener("input", updateCoverFromForm));
  document.querySelectorAll("[data-carousel-scene]").forEach((button) => button.addEventListener("click", () => {
    coverSlide().scene = button.dataset.carouselScene;
    coverSlide().savedAt = null;
    document.querySelectorAll("[data-carousel-scene]").forEach((choice) => choice.classList.toggle("is-active", choice === button));
    renderCanvas(ui.coverCanvas, coverSlide(), 0);
    markChanged();
  }));
  ui.coverMedia.addEventListener("click", (event) => {
    const button = event.target.closest("[data-carousel-photo]");
    if (!button) return;
    coverSlide().photoId = button.dataset.carouselPhoto;
    if (["paper", "field", "dark", "quote"].includes(coverSlide().scene)) coverSlide().scene = "photo-dim";
    coverSlide().savedAt = null;
    renderCover();
    markChanged();
  });
  ui.coverMediaSearch.addEventListener("input", () => renderMediaStrip(ui.coverMedia, coverSlide().photoId, ui.coverMediaSearch.value));
  ui.saveCover.addEventListener("click", () => saveCurrentSlide(0));
  ui.downloadCover.addEventListener("click", () => downloadSlide(coverSlide(), 0));

  ui.longread.addEventListener("input", () => {
    series.longread = ui.longread.value;
    renderSplitPreview();
    markChanged();
  });
  ui.slideCount.addEventListener("change", renderSplitPreview);
  ui.splitText.addEventListener("click", performSplit);
  ui.splitPreview.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-split]");
    if (!button) return;
    series.activeSlide = Number(button.dataset.editSplit);
    setStage("slides");
  });

  ui.slideRail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-carousel-slide-index]");
    if (!button) return;
    series.activeSlide = Number(button.dataset.carouselSlideIndex);
    renderActiveEditor();
    markChanged();
  });
  [ui.slideTitle, ui.slideBody, ui.slideRole, ui.slideScene, ui.slidePalette, ui.slideSize, ui.slideAlign].forEach((control) => control.addEventListener("input", updateActiveFromForm));
  ui.slideMedia.addEventListener("click", (event) => {
    const button = event.target.closest("[data-carousel-photo]");
    if (!button) return;
    const slide = activeSlide();
    slide.photoId = button.dataset.carouselPhoto;
    if (["paper", "field", "dark", "quote"].includes(slide.scene)) slide.scene = "photo-dim";
    slide.savedAt = null;
    renderActiveEditor();
    markChanged();
  });
  ui.removePhoto.addEventListener("click", () => {
    const slide = activeSlide();
    slide.photoId = null;
    if (!["paper", "field", "dark", "quote"].includes(slide.scene)) slide.scene = "paper";
    slide.savedAt = null;
    renderActiveEditor();
    markChanged();
  });
  ui.saveSlide.addEventListener("click", () => saveCurrentSlide());
  ui.downloadActive.addEventListener("click", () => downloadSlide(activeSlide(), series.activeSlide));
  ui.duplicateSlide.addEventListener("click", () => {
    const source = deepClone(activeSlide());
    delete source.id;
    const clone = makeSlide({ ...source, savedAt: null });
    series.slides.splice(series.activeSlide + 1, 0, clone);
    series.activeSlide += 1;
    series.totalSlides = series.slides.length;
    renderAll();
    markChanged();
    setStatus(`Слайд продублирован. В серии теперь ${series.slides.length}.`);
  });

  ui.saveSeries.addEventListener("click", saveWholeSeries);
  ui.exportSeries.addEventListener("click", exportSeries);
  ui.newSeries.addEventListener("click", () => {
    if (!confirm("Начать новую серию? Текущий черновик останется только если вы сохранили серию.")) return;
    series = defaultSeries();
    setStage("cover");
    renderAll();
    markChanged();
    setStatus("Создана новая серия. Начните с обложки.");
  });

  ui.savedSeries.addEventListener("click", (event) => {
    const load = event.target.closest("[data-load-series]");
    const duplicate = event.target.closest("[data-duplicate-series]");
    const remove = event.target.closest("[data-delete-series]");
    if (load) {
      const item = savedSeries.find((entry) => entry.id === load.dataset.loadSeries);
      if (!item) return;
      series = normalizeSeries(deepClone(item));
      setStage("cover");
      renderAll();
      markChanged();
      setStatus(`Серия «${series.name}» открыта для монтажа.`);
    }
    if (duplicate) {
      const item = savedSeries.find((entry) => entry.id === duplicate.dataset.duplicateSeries);
      if (!item) return;
      series = normalizeSeries({ ...deepClone(item), id: `series-${Date.now()}`, name: `${item.name} — копия`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      setStage("cover");
      renderAll();
      markChanged();
      setStatus("Копия серии открыта как новый черновик.");
    }
    if (remove) {
      const item = savedSeries.find((entry) => entry.id === remove.dataset.deleteSeries);
      if (!item || !confirm(`Удалить сохранённую серию «${item.name}»?`)) return;
      savedSeries = savedSeries.filter((entry) => entry.id !== item.id);
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedSeries));
      renderSaved();
      setStatus("Сохранённая серия удалена.");
    }
  });

  window.addEventListener("sekta:seed-carousel-studio", (event) => {
    const detail = event.detail || {};
    const cover = coverSlide();
    if (detail.title) cover.title = detail.title;
    if (detail.subtitle) cover.body = detail.subtitle;
    if (detail.photoId) cover.photoId = detail.photoId;
    if (detail.font?.family) series.font = detail.font;
    if (paletteChoices()[detail.palette]) series.palette = detail.palette;
    cover.palette = series.palette;
    cover.savedAt = null;
    setStage("cover");
    renderAll();
    markChanged();
    setStatus("Обложка из конструктора перенесена в монтаж серии.");
  });
  window.addEventListener("sekta:open-carousel-studio", () => renderAll());

  ensureFont(series.font);
  renderAll();
  setStage("cover");
  if (importedOnLoad) {
    const choices = fontChoices();
    if (choices.length) series.font = normalizeFontSystem(choices[0]);
    const likedPalettes = layoutLikeIds();
    if (likedPalettes.length) series.palette = `layout-${likedPalettes[0]}`;
    series.slides.forEach((slide) => { slide.palette = series.palette; });
    document.querySelector('[data-view="typography"]')?.click();
    renderAll();
    setStatus(`Импортировано: ${choices.length} шрифтовых вариантов, ${tasteBundle.systems?.length || 0} сохранённых систем и ${likedPalettes.length} цветовых сцен.`);
  }
  markChanged();
})();
