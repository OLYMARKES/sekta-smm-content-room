(() => {
  const library = window.SEKTA_LIBRARY?.items || [];
  const root = document.querySelector('[data-view-panel="postbuilder"]');
  if (!root) return;

  const DRAFT_KEY = "sekta-carousel-studio-draft-v2";
  const SAVED_KEY = "sekta-carousel-studio-series-v1";
  const IMPORT_KEY = "sekta-carousel-studio-taste-import-v1";
  const DEFAULT_LONGREAD = document.querySelector("#carouselLongreadText")?.value || "";
  const palettes = {
    ink: { name: "Контрастная", background: "#17221f", foreground: "#ffffff", accent: "#f7f7f2", ink: "#17221f" },
    pink: { name: "Розовая", background: "#f35ba7", foreground: "#17221f", accent: "#ffffff", ink: "#17221f" },
    blue: { name: "Синяя", background: "#3155e4", foreground: "#ffffff", accent: "#dce5ff", ink: "#17211e" },
    lime: { name: "Лайм", background: "#d4f04a", foreground: "#17221f", accent: "#ffffff", ink: "#17221f" },
    paper: { name: "Бумага", background: "#fff7e6", foreground: "#5b493b", accent: "#f35ba7", ink: "#392f29" },
    "sekta-yellow": { name: "#Sekta · жёлтый", background: "#17221f", foreground: "#ffe36a", accent: "#ffffff", ink: "#17221f" },
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
    coverLayerText: document.querySelector("#carouselCoverLayerText"),
    coverLayerVisible: document.querySelector("#carouselCoverLayerVisible"),
    coverLayerRemove: document.querySelector("#carouselCoverLayerRemove"),
    coverLayerAdd: document.querySelector("#carouselCoverLayerAdd"),
    coverTypeLayerLabel: document.querySelector("#carouselCoverTypeLayerLabel"),
    coverTypeFont: document.querySelector("#carouselCoverTypeFont"),
    coverTypeWeight: document.querySelector("#carouselCoverTypeWeight"),
    coverTypeWeightValue: document.querySelector("#carouselCoverTypeWeightValue"),
    coverTypeSize: document.querySelector("#carouselCoverTypeSize"),
    coverTypeSizeValue: document.querySelector("#carouselCoverTypeSizeValue"),
    coverTypeLineHeight: document.querySelector("#carouselCoverTypeLineHeight"),
    coverTypeLineHeightValue: document.querySelector("#carouselCoverTypeLineHeightValue"),
    coverTypeTracking: document.querySelector("#carouselCoverTypeTracking"),
    coverTypeTrackingValue: document.querySelector("#carouselCoverTypeTrackingValue"),
    coverPlacement: document.querySelector("#carouselCoverPlacement"),
    coverAlign: document.querySelector("#carouselCoverAlign"),
    coverCase: document.querySelector("#carouselCoverCase"),
    coverShowLabel: document.querySelector("#carouselCoverShowLabel"),
    coverMoveTarget: document.querySelector("#carouselCoverMoveTarget"),
    coverOffsetX: document.querySelector("#carouselCoverOffsetX"),
    coverOffsetXValue: document.querySelector("#carouselCoverOffsetXValue"),
    coverOffsetY: document.querySelector("#carouselCoverOffsetY"),
    coverOffsetYValue: document.querySelector("#carouselCoverOffsetYValue"),
    gridPreview: document.querySelector("#carouselGridPreview"),
    gridCells: document.querySelector("#carouselGridCells"),
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
    slideLayerText: document.querySelector("#carouselSlideLayerText"),
    slideLayerVisible: document.querySelector("#carouselSlideLayerVisible"),
    slideLayerRemove: document.querySelector("#carouselSlideLayerRemove"),
    slideLayerAdd: document.querySelector("#carouselSlideLayerAdd"),
    bodyBold: document.querySelector("#carouselBodyBold"),
    slideShowLabel: document.querySelector("#carouselSlideShowLabel"),
    slideMoveTarget: document.querySelector("#carouselSlideMoveTarget"),
    slideRole: document.querySelector("#carouselSlideRole"),
    slideScene: document.querySelector("#carouselSlideScene"),
    slidePalette: document.querySelector("#carouselSlidePalette"),
    slideFont: document.querySelector("#carouselSlideFont"),
    slideTypeLayerLabel: document.querySelector("#carouselSlideTypeLayerLabel"),
    slideTypeFont: document.querySelector("#carouselSlideTypeFont"),
    slideTypeWeight: document.querySelector("#carouselSlideTypeWeight"),
    slideTypeWeightValue: document.querySelector("#carouselSlideTypeWeightValue"),
    slideTypeSize: document.querySelector("#carouselSlideTypeSize"),
    slideTypeSizeValue: document.querySelector("#carouselSlideTypeSizeValue"),
    slideTypeLineHeight: document.querySelector("#carouselSlideTypeLineHeight"),
    slideTypeLineHeightValue: document.querySelector("#carouselSlideTypeLineHeightValue"),
    slideTypeTracking: document.querySelector("#carouselSlideTypeTracking"),
    slideTypeTrackingValue: document.querySelector("#carouselSlideTypeTrackingValue"),
    slidePlacement: document.querySelector("#carouselSlidePlacement"),
    slideAlign: document.querySelector("#carouselSlideAlign"),
    slideOffsetX: document.querySelector("#carouselSlideOffsetX"),
    slideOffsetXValue: document.querySelector("#carouselSlideOffsetXValue"),
    slideOffsetY: document.querySelector("#carouselSlideOffsetY"),
    slideOffsetYValue: document.querySelector("#carouselSlideOffsetYValue"),
    slideMedia: document.querySelector("#carouselSlideMedia"),
    slideMediaSearch: document.querySelector("#carouselSlideMediaSearch"),
    shuffleSlideMedia: document.querySelector("#carouselShuffleSlideMedia"),
    slidePhotoName: document.querySelector("#carouselSlidePhotoName"),
    removePhoto: document.querySelector("#carouselRemovePhoto"),
    saveSlide: document.querySelector("#carouselSaveSlide"),
    downloadActive: document.querySelector("#carouselDownloadActive"),
    duplicateSlide: document.querySelector("#carouselDuplicateSlide"),
    savedSeries: document.querySelector("#carouselSavedSeries"),
    exportSeries: document.querySelector("#carouselExportSeries"),
    sourceTitle: document.querySelector("#postSourceTitle"),
    sourceHook: document.querySelector("#postSourceHook"),
    sourceObjective: document.querySelector("#postSourceObjective"),
    sourceAsset: document.querySelector("#postSourceAsset"),
    sourceCta: document.querySelector("#postSourceCta"),
    sourceReadiness: document.querySelector("#postSourceReadiness"),
    generateLongread: document.querySelector("#carouselGenerateLongread"),
    regenerateLongread: document.querySelector("#carouselRegenerateLongread"),
    longreadDraftState: document.querySelector("#carouselLongreadDraftState"),
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const inlineMarkupHtml = (value) => escapeHtml(value).replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  const stripInlineMarkup = (value) => String(value || "").replace(/\*\*([^*]+)\*\*/g, "$1");
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
  const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  };
  const builtInLikedFrames = [
    "Akt|lower", "Akt|upper", "Alegreya Sans|lower", "Alegreya Sans|upper", "Alice|lower",
    "Alumni Sans|lower", "Alumni Sans|upper", "Comfortaa|lower", "Commissioner|lower", "Commissioner|upper",
    "Geologica|lower", "Geologica|upper", "Golos Text|lower", "Golos Text|upper", "Manrope|lower", "Manrope|upper",
    "PT Sans Narrow|lower", "PT Sans Narrow|upper", "Rubik|lower", "Rubik|upper",
  ];
  let slideMediaOrder = [...library];
  let coverMediaLimit = 48;
  let slideMediaLimit = 48;
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
    add("PT Sans Narrow", "upper", "Manrope", "система #Sekta");
    add("Golos Text", "lower", "Golos Text", "спокойный текст");
    builtInLikedFrames.forEach((key) => {
      const split = key.lastIndexOf("|");
      add(key.slice(0, split), key.slice(split + 1), "", "из профиля Оли");
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

  function numberOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
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
      bodySize: 34,
      align: "left",
      placement: "middle",
      showSeriesLabel: true,
      showTitle: true,
      showBody: true,
      showCounter: true,
      labelText: "",
      counterText: "",
      customLayers: [],
      titleOffsetX: 0,
      titleOffsetY: 0,
      bodyOffsetX: 0,
      bodyOffsetY: 0,
      labelOffsetX: 0,
      labelOffsetY: 0,
      counterOffsetX: 0,
      counterOffsetY: 0,
      titleFontFamily: "",
      titleWeight: 800,
      titleLineHeight: .96,
      titleTracking: -.035,
      bodyFontFamily: "",
      bodyWeight: 470,
      bodyLineHeight: 1.25,
      bodyTracking: 0,
      labelFontFamily: "",
      labelWeight: 750,
      labelSize: 24,
      labelLineHeight: 1,
      labelTracking: .06,
      counterFontFamily: "",
      counterWeight: 750,
      counterSize: 24,
      counterLineHeight: 1,
      counterTracking: .08,
      caseKind: "original",
      font: null,
      photoId: null,
      photoFocusX: 50,
      photoFocusY: 50,
      textColor: "",
      savedAt: null,
      ...overrides,
    };
  }

  function defaultSeries() {
    const firstPhoto = preferredPhoto();
    const firstFont = fontChoices().find((font) => font.family === "PT Sans Narrow") || { family: "PT Sans Narrow", body: "Manrope", caseKind: "upper" };
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
        makeSlide({ role: "cover", title: "Пропустили пять дней? Ничего не сломалось", body: "10 слайдов · сохрани", labelText: "@sektaschool", scene: "photo-clean", palette: "sekta-yellow", size: 106, bodySize: 20, labelSize: 22, titleWeight: 700, titleLineHeight: .86, titleTracking: -.012, caseKind: "upper", showCounter: false, placement: "bottom", photoId: firstPhoto?.id || null }),
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
      slides: candidate.slides.map((slide) => makeSlide({
        ...slide,
        showSeriesLabel: slide.showSeriesLabel !== false,
        titleOffsetX: Number(slide.titleOffsetX ?? slide.offsetX) || 0,
        titleOffsetY: Number(slide.titleOffsetY ?? slide.offsetY) || 0,
        bodyOffsetX: Number(slide.bodyOffsetX ?? slide.offsetX) || 0,
        bodyOffsetY: Number(slide.bodyOffsetY ?? slide.offsetY) || 0,
        labelOffsetX: Number(slide.labelOffsetX) || 0,
        labelOffsetY: Number(slide.labelOffsetY) || 0,
        counterOffsetX: Number(slide.counterOffsetX) || 0,
        counterOffsetY: Number(slide.counterOffsetY) || 0,
        titleFontFamily: slide.titleFontFamily || "",
        titleWeight: numberOr(slide.titleWeight, 800),
        titleLineHeight: numberOr(slide.titleLineHeight, .96),
        titleTracking: numberOr(slide.titleTracking, -.035),
        bodyFontFamily: slide.bodyFontFamily || "",
        bodyWeight: numberOr(slide.bodyWeight, 470),
        bodyLineHeight: numberOr(slide.bodyLineHeight, 1.25),
        bodyTracking: numberOr(slide.bodyTracking, 0),
        labelFontFamily: slide.labelFontFamily || "",
        labelWeight: numberOr(slide.labelWeight, 750),
        labelSize: numberOr(slide.labelSize, 24),
        labelLineHeight: numberOr(slide.labelLineHeight, 1),
        labelTracking: numberOr(slide.labelTracking, .06),
        counterFontFamily: slide.counterFontFamily || "",
        counterWeight: numberOr(slide.counterWeight, 750),
        counterSize: numberOr(slide.counterSize, 24),
        counterLineHeight: numberOr(slide.counterLineHeight, 1),
        counterTracking: numberOr(slide.counterTracking, .08),
        customLayers: Array.isArray(slide.customLayers) ? slide.customLayers.map((layer) => ({
          id: layer.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: layer.text || "Новый текст",
          visible: layer.visible !== false,
          x: Number(layer.x) || 0,
          y: Number(layer.y) || 0,
          fontFamily: layer.fontFamily || "",
          weight: numberOr(layer.weight, 700),
          size: numberOr(layer.size, 32),
          lineHeight: numberOr(layer.lineHeight, 1),
          tracking: numberOr(layer.tracking, 0),
        })) : [],
        font: slide.font?.family ? normalizeFontSystem(slide.font) : null,
      })),
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
  let coverMoveTarget = "title";
  let slideMoveTarget = "body";
  if (!Array.isArray(savedSeries)) savedSeries = [];
  let activeStage = "cover";
  let generationVariant = 0;
  let saveTimer;

  const fallbackIdea = { id: "post-1", kind: "post", title: "Возвращение без наказания", hook: "Пауза не обнуляет навык возвращаться", objective: "Теплота", asset: "Домашние фото или спокойный портрет", cta: "Рассказать, как вы возвращаетесь", readiness: "Текст + фото" };

  function activeIdea() {
    return series.idea || fallbackIdea;
  }

  function renderSource() {
    const idea = activeIdea();
    ui.sourceTitle.textContent = idea.title;
    ui.sourceHook.textContent = idea.hook;
    ui.sourceObjective.textContent = idea.objective;
    ui.sourceAsset.textContent = idea.asset;
    ui.sourceCta.textContent = idea.cta;
    ui.sourceReadiness.textContent = idea.readiness;
    document.querySelector("#postSourceBar")?.classList.toggle("needs-review", /ревью|специалист|методическ|эксперт/i.test(idea.readiness));
  }

  function generatedLongread(idea, variant = 0) {
    const hookSentence = /[.!?…]$/.test(idea.hook.trim()) ? idea.hook.trim() : `${idea.hook.trim()}.`;
    const openings = [
      `${hookSentence} Эта мысль важна именно в обычный день — не тогда, когда всё получается, а когда план снова не совпал с жизнью.`,
      `Есть момент, в котором особенно легко решить, что с вами что-то не так: ${idea.title.toLocaleLowerCase("ru")}. Но привычное объяснение здесь редко помогает.`,
      `Попробуем посмотреть на это без героизма и без чувства вины. ${hookSentence} Не как красивый лозунг, а как рабочее правило для реальной жизни.`
    ];
    const middles = [
      `Мы часто замечаем только итог: сколько минут сделали, насколько устали, выполнили ли план полностью. Но устойчивость складывается из другого — из способности заметить своё состояние, выбрать подходящий объём и не превращать движение в проверку характера.`,
      `Проблема не в недостатке силы воли. Чаще всего слишком большой следующий шаг просто не помещается в конкретный день. Тогда полезнее не уговаривать себя на максимум, а уменьшить порог входа до действия, которое действительно можно повторить.`,
      `У движения нет задачи доказать, что вы хороший человек. Оно может быть способом вернуть контакт с телом, чуть изменить состояние и оставить себе возможность продолжить завтра. Этого уже достаточно, чтобы опыт не был пустым.`
    ];
    const proof = `Для этого материала мы используем ${idea.asset.toLocaleLowerCase("ru")}. Визуал должен не изображать идеальную дисциплину, а показывать живой момент: паузу, выбор, короткое действие или возвращение к знакомому движению.`;
    const step = `Практический шаг на сегодня: сначала спросите себя не «сколько я должна сделать?», а «какой объём сейчас поддержит меня и не потребует расплаты завтра?». Выберите самый короткий честный вариант, начните с него и оставьте право остановиться.`;
    const close = `Так появляется не идеальная серия дней, а навык, который выдерживает разные обстоятельства. Если эта рамка вам подходит — ${idea.cta.toLocaleLowerCase("ru")}.`;
    const review = /ревью|специалист|методическ|эксперт/i.test(idea.readiness) ? `\n\nРедакторская пометка: формулировки о нагрузке и результате нужно проверить со специалистом перед публикацией.` : "";
    return [openings[variant % openings.length], middles[variant % middles.length], proof, step, close].join("\n\n") + review;
  }

  function generateFromIdea(advance = false) {
    if (advance) generationVariant += 1;
    const idea = activeIdea();
    series.longread = generatedLongread(idea, generationVariant);
    ui.longread.value = series.longread;
    series = splitSeries(series, Number(ui.slideCount.value || 10), ui.keepParagraphs.checked, ui.photoRhythm.checked);
    ui.longreadDraftState.textContent = `Черновик ${generationVariant + 1} · требует редакторской проверки`;
    renderAll();
    markChanged();
    setStatus(`Лонгрид по теме «${idea.title}» создан. Его можно править перед разбиением.`);
  }

  function loadIdea(detail) {
    const idea = { ...fallbackIdea, ...detail };
    series.idea = idea;
    series.name = idea.title;
    if (idea.font?.family) {
      series.font = normalizeFontSystem(idea.font);
      ensureFont(series.font);
    }
    const requestedSlides = Math.min(20, Math.max(6, Number(idea.slideCount) || 10));
    ui.slideCount.value = String(requestedSlides);
    const cover = coverSlide();
    cover.title = idea.hook;
    cover.body = idea.objective;
    if (idea.photoId && photoById(idea.photoId)) cover.photoId = idea.photoId;
    cover.savedAt = null;
    const final = series.slides.at(-1);
    if (final?.role === "cta") {
      final.title = "Что можно сделать сейчас";
      final.body = idea.cta;
      final.savedAt = null;
    }
    generationVariant = 0;
    if (idea.longread?.trim()) {
      series.longread = idea.longread.trim();
      ui.longread.value = series.longread;
      series = splitSeries(series, requestedSlides, ui.keepParagraphs.checked, ui.photoRhythm.checked);
      if (Array.isArray(idea.slides) && idea.slides.length === series.slides.length) {
        series.slides = series.slides.map((slide, index) => makeSlide({
          ...slide,
          title: idea.slides[index]?.title ?? slide.title,
          body: idea.slides[index]?.body ?? slide.body,
          role: idea.slides[index]?.role || slide.role,
        }));
      }
      if (Array.isArray(idea.visualPlan)) {
        series.slides.forEach((slide, index) => {
          const visual = idea.visualPlan[index];
          if (!visual) return;
          if (sceneLabels[visual.scene]) slide.scene = visual.scene;
          if (paletteChoices()[visual.palette]) slide.palette = visual.palette;
          if (visual.photoId && photoById(visual.photoId)) slide.photoId = visual.photoId;
          else if (["paper", "field", "dark", "quote"].includes(slide.scene)) slide.photoId = null;
        });
      }
      if (idea.coverDesign) {
        const target = series.slides[0];
        target.scene = sceneLabels[idea.coverDesign.scene] ? idea.coverDesign.scene : target.scene;
        target.palette = paletteChoices()[idea.coverDesign.palette] ? idea.coverDesign.palette : target.palette;
        target.title = idea.coverDesign.titleText || target.title;
        target.body = idea.coverDesign.subtitleText || target.body;
        target.labelText = idea.coverDesign.labelText || "@sektaschool";
        target.placement = idea.coverDesign.placement || target.placement;
        target.photoFocusX = Number(idea.coverDesign.focusX) || 50;
        target.photoFocusY = Number(idea.coverDesign.focusY) || 50;
        target.textColor = idea.coverDesign.textColor || "";
        [["title", idea.coverDesign.title], ["body", idea.coverDesign.body], ["label", idea.coverDesign.label]].forEach(([layerName, source]) => {
          if (!source) return;
          const type = typographyLayers[layerName];
          const offsets = movableLayers[layerName];
          target[type.family] = source.family || target[type.family];
          target[type.weight] = Number(source.weight) || target[type.weight];
          target[type.size] = Number(source.size) || target[type.size];
          target[type.lineHeight] = Number(source.lineHeight) || target[type.lineHeight];
          target[type.tracking] = Number(source.tracking) || 0;
          target[offsets.x] = Number(source.x) || 0;
          target[offsets.y] = Number(source.y) || 0;
          setLayerVisible(target, layerName, source.visible !== false);
        });
        target.showCounter = false;
      }
      ui.longreadDraftState.textContent = "Сценарий из банка идей · можно редактировать";
      series.activeSlide = Math.min(Math.max(Number(idea.activeSlide) || 0, 0), series.slides.length - 1);
      renderAll();
      markChanged();
      setStatus(`Сценарий на ${requestedSlides} слайдов перенесён из банка идей.`);
    } else {
      generateFromIdea(false);
    }
    renderSource();
    renderAll();
    setStage(idea.openSlides ? "slides" : "longread");
  }

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

  const movableLayers = {
    title: { x: "titleOffsetX", y: "titleOffsetY", label: "заголовок" },
    body: { x: "bodyOffsetX", y: "bodyOffsetY", label: "основной текст" },
    label: { x: "labelOffsetX", y: "labelOffsetY", label: "аккаунт / подпись" },
    counter: { x: "counterOffsetX", y: "counterOffsetY", label: "номер слайда" },
  };

  const layerContent = {
    title: { text: "title", visible: "showTitle", fallback: () => "" },
    body: { text: "body", visible: "showBody", fallback: () => "" },
    label: { text: "labelText", visible: "showSeriesLabel", fallback: () => series.name },
    counter: { text: "counterText", visible: "showCounter", fallback: (index) => `${String(index + 1).padStart(2, "0")} / ${String(series.slides.length).padStart(2, "0")}` },
  };

  const isCustomTarget = (target) => String(target || "").startsWith("custom:");
  const customLayer = (slide, target) => slide.customLayers?.find((layer) => `custom:${layer.id}` === target);
  const layerLabel = (slide, target) => isCustomTarget(target) ? customLayer(slide, target)?.text || "текстовый блок" : movableLayers[target]?.label || "текст";

  function layerText(slide, target, index = series.activeSlide) {
    if (isCustomTarget(target)) return String(customLayer(slide, target)?.text || "");
    const layer = layerContent[target];
    return String(slide[layer.text] || layer.fallback(index));
  }

  function layerVisible(slide, target) {
    if (isCustomTarget(target)) return customLayer(slide, target)?.visible !== false;
    return slide[layerContent[target].visible] !== false;
  }

  function setLayerText(slide, target, value) {
    if (isCustomTarget(target)) {
      const layer = customLayer(slide, target);
      if (layer) layer.text = value;
      return;
    }
    slide[layerContent[target].text] = value;
  }

  function setLayerVisible(slide, target, visible) {
    if (isCustomTarget(target)) {
      const layer = customLayer(slide, target);
      if (layer) layer.visible = Boolean(visible);
      return;
    }
    slide[layerContent[target].visible] = Boolean(visible);
  }

  const typographyLayers = {
    title: { family: "titleFontFamily", weight: "titleWeight", size: "size", lineHeight: "titleLineHeight", tracking: "titleTracking", fallbackWeight: 800, fallbackSize: 46, fallbackLineHeight: .96, fallbackTracking: -.035 },
    body: { family: "bodyFontFamily", weight: "bodyWeight", size: "bodySize", lineHeight: "bodyLineHeight", tracking: "bodyTracking", fallbackWeight: 470, fallbackSize: 34, fallbackLineHeight: 1.25, fallbackTracking: 0 },
    label: { family: "labelFontFamily", weight: "labelWeight", size: "labelSize", lineHeight: "labelLineHeight", tracking: "labelTracking", fallbackWeight: 750, fallbackSize: 24, fallbackLineHeight: 1, fallbackTracking: .06 },
    counter: { family: "counterFontFamily", weight: "counterWeight", size: "counterSize", lineHeight: "counterLineHeight", tracking: "counterTracking", fallbackWeight: 750, fallbackSize: 24, fallbackLineHeight: 1, fallbackTracking: .08 },
  };

  function slideFontSystem(slide) {
    return slide.font?.family ? normalizeFontSystem(slide.font) : series.font;
  }

  function systemFamilyForLayer(slide, target) {
    const system = slideFontSystem(slide);
    return target === "title" ? system.family : system.body || companionFor(system.family);
  }

  function layerTypography(slide, target) {
    if (isCustomTarget(target)) {
      const layer = customLayer(slide, target) || {};
      return {
        family: layer.fontFamily || "",
        resolvedFamily: layer.fontFamily || systemFamilyForLayer(slide, target),
        weight: numberOr(layer.weight, 700),
        size: numberOr(layer.size, 32),
        lineHeight: numberOr(layer.lineHeight, 1),
        tracking: numberOr(layer.tracking, 0),
      };
    }
    const layer = typographyLayers[target] || typographyLayers.body;
    return {
      family: slide[layer.family] || "",
      resolvedFamily: slide[layer.family] || systemFamilyForLayer(slide, target),
      weight: numberOr(slide[layer.weight], layer.fallbackWeight),
      size: numberOr(slide[layer.size], layer.fallbackSize),
      lineHeight: numberOr(slide[layer.lineHeight], layer.fallbackLineHeight),
      tracking: numberOr(slide[layer.tracking], layer.fallbackTracking),
    };
  }

  function setLayerTypography(slide, target, values) {
    if (isCustomTarget(target)) {
      const custom = customLayer(slide, target);
      if (!custom) return;
      custom.fontFamily = values.family || "";
      custom.weight = Number(values.weight);
      custom.size = Number(values.size);
      custom.lineHeight = Number(values.lineHeight);
      custom.tracking = Number(values.tracking);
      return;
    }
    const layer = typographyLayers[target] || typographyLayers.body;
    slide[layer.family] = values.family || "";
    slide[layer.weight] = Number(values.weight);
    slide[layer.size] = Number(values.size);
    slide[layer.lineHeight] = Number(values.lineHeight);
    slide[layer.tracking] = Number(values.tracking);
  }

  function layerFontFamilies() {
    const families = fontChoices().flatMap((font) => [font.family, font.body]);
    return [...new Set(families.filter(Boolean))];
  }

  function renderLayerFontOptions(select, slide, target) {
    const typography = layerTypography(slide, target);
    const families = layerFontFamilies();
    if (typography.family && !families.includes(typography.family)) families.unshift(typography.family);
    select.innerHTML = `<option value="">Из системы · ${escapeHtml(systemFamilyForLayer(slide, target))}</option>${families.map((family) => `<option value="${escapeHtml(family)}">${escapeHtml(family)}</option>`).join("")}`;
    select.value = typography.family;
  }

  function formatTracking(value) {
    const number = Number(value) || 0;
    return `${number < 0 ? "−" : number > 0 ? "+" : ""}${Math.abs(number).toFixed(3)} em`;
  }

  function syncTypographyControls(mode) {
    const cover = mode === "cover";
    const slide = cover ? coverSlide() : activeSlide();
    const target = cover ? coverMoveTarget : slideMoveTarget;
    const typography = layerTypography(slide, target);
    const controls = cover ? {
      label: ui.coverTypeLayerLabel, font: ui.coverTypeFont, weight: ui.coverTypeWeight, weightValue: ui.coverTypeWeightValue,
      size: ui.coverTypeSize, sizeValue: ui.coverTypeSizeValue, lineHeight: ui.coverTypeLineHeight, lineHeightValue: ui.coverTypeLineHeightValue,
      tracking: ui.coverTypeTracking, trackingValue: ui.coverTypeTrackingValue,
    } : {
      label: ui.slideTypeLayerLabel, font: ui.slideTypeFont, weight: ui.slideTypeWeight, weightValue: ui.slideTypeWeightValue,
      size: ui.slideTypeSize, sizeValue: ui.slideTypeSizeValue, lineHeight: ui.slideTypeLineHeight, lineHeightValue: ui.slideTypeLineHeightValue,
      tracking: ui.slideTypeTracking, trackingValue: ui.slideTypeTrackingValue,
    };
    controls.label.textContent = layerLabel(slide, target);
    renderLayerFontOptions(controls.font, slide, target);
    controls.weight.value = typography.weight;
    controls.weightValue.textContent = typography.weight;
    controls.size.value = typography.size;
    controls.sizeValue.textContent = `${typography.size} px`;
    controls.lineHeight.value = typography.lineHeight;
    controls.lineHeightValue.textContent = Number(typography.lineHeight).toFixed(2);
    controls.tracking.value = typography.tracking;
    controls.trackingValue.textContent = formatTracking(typography.tracking);
  }

  function syncLayerContentControls(mode) {
    const cover = mode === "cover";
    const slide = cover ? coverSlide() : activeSlide();
    const target = cover ? coverMoveTarget : slideMoveTarget;
    const textControl = cover ? ui.coverLayerText : ui.slideLayerText;
    const visibleControl = cover ? ui.coverLayerVisible : ui.slideLayerVisible;
    const removeControl = cover ? ui.coverLayerRemove : ui.slideLayerRemove;
    textControl.value = layerText(slide, target, cover ? 0 : series.activeSlide);
    visibleControl.checked = layerVisible(slide, target);
    removeControl.textContent = visibleControl.checked ? "Удалить элемент" : "Вернуть элемент";
  }

  function applyLayerVariables(element, slide) {
    const set = (name, value) => element.style.setProperty(name, value);
    const previewSize = (value) => Math.round(Math.max(8, value) * 48) / 100;
    const titleType = layerTypography(slide, "title");
    const bodyType = layerTypography(slide, "body");
    const labelType = layerTypography(slide, "label");
    const counterType = layerTypography(slide, "counter");
    [titleType, bodyType, labelType, counterType].forEach((type) => ensureFontFamily(type.resolvedFamily));
    set("--carousel-title-x", `${Number(slide.titleOffsetX) || 0}cqw`);
    set("--carousel-title-y", `${(Number(slide.titleOffsetY) || 0) * 1.25}cqw`);
    set("--carousel-body-x", `${Number(slide.bodyOffsetX) || 0}cqw`);
    set("--carousel-body-y", `${(Number(slide.bodyOffsetY) || 0) * 1.25}cqw`);
    set("--carousel-label-x", `${Number(slide.labelOffsetX) || 0}cqw`);
    set("--carousel-label-y", `${(Number(slide.labelOffsetY) || 0) * 1.25}cqw`);
    set("--carousel-counter-x", `${Number(slide.counterOffsetX) || 0}cqw`);
    set("--carousel-counter-y", `${(Number(slide.counterOffsetY) || 0) * 1.25}cqw`);
    set("--carousel-title-font", `"${titleType.resolvedFamily}"`);
    set("--carousel-title-weight", titleType.weight);
    set("--carousel-title-size", `${previewSize(titleType.size)}px`);
    set("--carousel-title-line", titleType.lineHeight);
    set("--carousel-title-tracking", `${titleType.tracking}em`);
    set("--carousel-body-font", `"${bodyType.resolvedFamily}"`);
    set("--carousel-body-weight", bodyType.weight);
    set("--carousel-body-size", `${previewSize(bodyType.size)}px`);
    set("--carousel-body-line", bodyType.lineHeight);
    set("--carousel-body-tracking", `${bodyType.tracking}em`);
    set("--carousel-label-font", `"${labelType.resolvedFamily}"`);
    set("--carousel-label-weight", labelType.weight);
    set("--carousel-label-size", `${previewSize(labelType.size)}px`);
    set("--carousel-label-line", labelType.lineHeight);
    set("--carousel-label-tracking", `${labelType.tracking}em`);
    set("--carousel-counter-font", `"${counterType.resolvedFamily}"`);
    set("--carousel-counter-weight", counterType.weight);
    set("--carousel-counter-size", `${previewSize(counterType.size)}px`);
    set("--carousel-counter-line", counterType.lineHeight);
    set("--carousel-counter-tracking", `${counterType.tracking}em`);
  }

  function renderCanvas(element, slide, index) {
    if (!element || !slide) return;
    const photo = photoById(slide.photoId);
    const palette = paletteFor(slide.palette || series.palette);
    const slideFont = slide.font?.family ? normalizeFontSystem(slide.font) : series.font;
    ensureFont(slideFont);
    const directEditing = element === ui.coverCanvas || element === ui.activeCanvas;
    const selectedLayer = element === ui.coverCanvas ? coverMoveTarget : element === ui.activeCanvas ? slideMoveTarget : "";
    element.className = `carousel-slide-canvas${directEditing ? " is-direct-editing" : ""}`;
    element.dataset.scene = slide.scene;
    element.dataset.palette = slide.palette;
    element.dataset.placement = slide.placement || "middle";
    element.dataset.align = slide.align || "left";
    element.dataset.role = slide.role;
    element.style.setProperty("--carousel-head-font", `"${slideFont.family}"`);
    element.style.setProperty("--carousel-body-font", `"${slideFont.body || companionFor(slideFont.family)}"`);
    element.style.setProperty("--carousel-bg", palette.background);
    element.style.setProperty("--carousel-fg", slide.textColor || palette.foreground);
    element.style.setProperty("--carousel-accent", palette.accent);
    element.style.setProperty("--carousel-ink", palette.ink);
    element.style.setProperty("--carousel-title-size", `${Math.max(24, Math.round((slide.size || 46) * .48))}px`);
    element.style.setProperty("--carousel-body-size", `${Math.max(12, Math.min(31, Math.round((slide.bodySize || 34) * .48)))}px`);
    applyLayerVariables(element, slide);
    const image = photo && !["paper", "field", "dark", "quote"].includes(slide.scene)
      ? `<img class="carousel-render-photo" src="${escapeHtml(photo.thumb)}" alt="" style="object-position:${Number(slide.photoFocusX) || 50}% ${Number(slide.photoFocusY) || 50}%">`
      : "";
    const titleText = layerText(slide, "title", index);
    const bodyText = layerText(slide, "body", index);
    const title = layerVisible(slide, "title") && titleText ? `<strong class="carousel-render-title${directEditing ? ` carousel-direct-layer${selectedLayer === "title" ? " is-selected-layer" : ""}` : ""}"${directEditing ? ` data-carousel-layer="title" data-layer-label="${movableLayers.title.label}"` : ""}>${escapeHtml(displayText(stripInlineMarkup(titleText), slide.caseKind || slideFont.caseKind))}</strong>` : "";
    const body = layerVisible(slide, "body") && bodyText ? `<div class="carousel-render-body${directEditing ? ` carousel-direct-layer${selectedLayer === "body" ? " is-selected-layer" : ""}` : ""}"${directEditing ? ` data-carousel-layer="body" data-layer-label="${movableLayers.body.label}"` : ""}><p>${inlineMarkupHtml(bodyText).replace(/\n\s*\n/g, "</p><p>")}</p></div>` : "";
    const label = !layerVisible(slide, "label") ? "" : `<span class="carousel-render-series${directEditing ? ` carousel-direct-layer${selectedLayer === "label" ? " is-selected-layer" : ""}` : ""}"${directEditing ? ` data-carousel-layer="label" data-layer-label="${movableLayers.label.label}"` : ""}>${escapeHtml(layerText(slide, "label", index))}</span>`;
    const counter = !layerVisible(slide, "counter") ? "" : `<small class="carousel-render-counter${directEditing ? ` carousel-direct-layer${selectedLayer === "counter" ? " is-selected-layer" : ""}` : ""}"${directEditing ? ` data-carousel-layer="counter" data-layer-label="${movableLayers.counter.label}"` : ""}>${escapeHtml(layerText(slide, "counter", index))}</small>`;
    const custom = (slide.customLayers || []).filter((layer) => layer.visible !== false && layer.text).map((layer) => {
      const target = `custom:${layer.id}`;
      const type = layerTypography(slide, target);
      ensureFontFamily(type.resolvedFamily);
      const style = `--custom-x:${Number(layer.x) || 0}cqw;--custom-y:${(Number(layer.y) || 0) * 1.25}cqw;font-family:'${escapeHtml(type.resolvedFamily)}',sans-serif;font-weight:${type.weight};font-size:${Math.round(type.size * 48) / 100}px;line-height:${type.lineHeight};letter-spacing:${type.tracking}em`;
      return `<div class="carousel-render-custom${directEditing ? ` carousel-direct-layer${selectedLayer === target ? " is-selected-layer" : ""}` : ""}" style="${style}"${directEditing ? ` data-carousel-layer="${escapeHtml(target)}" data-layer-label="текстовый блок"` : ""}>${escapeHtml(layer.text)}</div>`;
    }).join("");
    element.innerHTML = `${image}<div class="carousel-render-shade"></div>${label}<div class="carousel-render-content">${title}${body}</div>${counter}${custom}`;
  }

  function renderFontStrip() {
    const choices = fontChoices();
    const activeKey = fontSystemKey(series.font);
    if (!choices.some((font) => fontSystemKey(font) === activeKey)) choices.unshift(normalizeFontSystem(series.font));
    const familyCount = new Set(choices.map((font) => font.family)).size;
    const savedCount = choices.filter((font) => font.recipe && font.recipe !== "стартовая система").length;
    const transferredSystem = series.font?.recipe && series.font.recipe !== "стартовая система";
    ui.fontSummary.textContent = transferredSystem
      ? `${series.font.family} × ${series.font.body} · сохранённая пара перенесена вместе с идеей`
      : tasteBundle.importedAt || Object.keys(readJson("olymarkes-cyrillic-font-taste-v1", {})).length
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

  function renderSlideFontOptions(slide) {
    const choices = fontChoices();
    const selectedKey = slide.font?.family ? fontSystemKey(slide.font) : "series";
    ui.slideFont.innerHTML = `<option value="series">Как во всей серии · ${escapeHtml(series.font.family)}</option>${choices.map((font) => `<option value="${escapeHtml(fontSystemKey(font))}">${escapeHtml(font.family)} · ${font.caseKind === "upper" ? "КАПС" : font.caseKind === "lower" ? "строчные" : "исходный регистр"}</option>`).join("")}`;
    ui.slideFont.value = selectedKey;
    if (ui.slideFont.value !== selectedKey) ui.slideFont.value = "series";
    choices.forEach(ensureFont);
  }

  function mediaPool(query = "", order = library) {
    const normalized = query.trim().toLocaleLowerCase("ru");
    const pool = normalized ? order.filter((item) => [item.fileName, item.folderLabel, ...(item.contentThemes || []), ...(item.carouselRoles || [])].join(" ").toLocaleLowerCase("ru").includes(normalized)) : order;
    return order === library ? [...pool].sort((a, b) => Number(b.orientation === "portrait") - Number(a.orientation === "portrait")) : [...pool];
  }

  function renderMediaStrip(element, selectedId, query = "", order = library) {
    const pool = mediaPool(query, order);
    const limit = element === ui.coverMedia ? coverMediaLimit : slideMediaLimit;
    const visible = pool.slice(0, limit);
    element.dataset.mediaTotal = pool.length;
    element.innerHTML = visible.length ? visible.map((photo) => `<button type="button" class="${photo.id === selectedId ? "is-selected" : ""}" data-carousel-photo="${escapeHtml(photo.id)}" aria-label="Выбрать ${escapeHtml(photo.fileName)}"><img src="${escapeHtml(photo.thumb)}" alt="" loading="lazy"></button>`).join("") : `<span class="carousel-media-empty">Ничего не найдено.</span>`;
  }

  function bindInfiniteMedia(element, mode) {
    element.addEventListener("scroll", () => {
      if (element.scrollTop + element.clientHeight < element.scrollHeight - 180) return;
      const total = Number(element.dataset.mediaTotal) || 0;
      if (mode === "cover") {
        if (coverMediaLimit >= total) return;
        coverMediaLimit = Math.min(coverMediaLimit + 48, total);
        renderMediaStrip(element, coverSlide().photoId, ui.coverMediaSearch.value);
      } else {
        if (slideMediaLimit >= total) return;
        slideMediaLimit = Math.min(slideMediaLimit + 48, total);
        renderMediaStrip(element, activeSlide().photoId, ui.slideMediaSearch.value, slideMediaOrder);
      }
    }, { passive: true });
  }

  function coverSlide() {
    return series.slides[0];
  }

  function activeSlide() {
    return series.slides[series.activeSlide] || series.slides[0];
  }

  function layerOffsets(slide, target) {
    if (isCustomTarget(target)) {
      const custom = customLayer(slide, target);
      return { x: Number(custom?.x) || 0, y: Number(custom?.y) || 0 };
    }
    const layer = movableLayers[target] || movableLayers.body;
    return { x: Number(slide[layer.x]) || 0, y: Number(slide[layer.y]) || 0 };
  }

  function setLayerOffsets(slide, target, x, y) {
    if (isCustomTarget(target)) {
      const custom = customLayer(slide, target);
      if (custom) { custom.x = x; custom.y = y; }
      return;
    }
    const layer = movableLayers[target] || movableLayers.body;
    slide[layer.x] = x;
    slide[layer.y] = y;
  }

  function syncCoverOffsets() {
    const slide = coverSlide();
    if (isCustomTarget(coverMoveTarget) && !customLayer(slide, coverMoveTarget)) coverMoveTarget = "title";
    renderLayerTargetOptions(ui.coverMoveTarget, slide, coverMoveTarget);
    const offsets = layerOffsets(slide, coverMoveTarget);
    ui.coverMoveTarget.value = coverMoveTarget;
    ui.coverOffsetX.value = offsets.x;
    ui.coverOffsetY.value = offsets.y;
    ui.coverOffsetXValue.textContent = `${offsets.x}%`;
    ui.coverOffsetYValue.textContent = `${offsets.y}%`;
  }

  function syncActiveOffsets() {
    const slide = activeSlide();
    if (isCustomTarget(slideMoveTarget) && !customLayer(slide, slideMoveTarget)) slideMoveTarget = "body";
    renderLayerTargetOptions(ui.slideMoveTarget, slide, slideMoveTarget);
    const offsets = layerOffsets(slide, slideMoveTarget);
    ui.slideMoveTarget.value = slideMoveTarget;
    ui.slideOffsetX.value = offsets.x;
    ui.slideOffsetXValue.textContent = `${offsets.x}%`;
    ui.slideOffsetY.value = offsets.y;
    ui.slideOffsetYValue.textContent = `${offsets.y}%`;
  }

  function renderLayerTargetOptions(select, slide, selected) {
    const builtIns = [
      ["title", "Заголовок"], ["body", "Основной текст"], ["label", "Аккаунт / подпись"], ["counter", "Номер слайда"],
    ];
    const custom = (slide.customLayers || []).map((layer, index) => [`custom:${layer.id}`, `Текстовый блок ${index + 1}`]);
    select.innerHTML = [...builtIns, ...custom].map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
    select.value = selected;
  }

  function renderGridPreview() {
    if (!ui.gridCells) return;
    const currentGrid = window.SEKTA_CURRENT_GRID || [];
    ui.gridCells.innerHTML = `<div class="carousel-grid-cell is-draft"><div class="carousel-slide-canvas" data-carousel-grid-draft></div><span class="carousel-grid-new">NEW</span></div>${currentGrid.slice(0, 8).map((item) => `<div class="carousel-grid-cell"><img src="${escapeHtml(item.image)}" alt="" loading="lazy"><span class="carousel-grid-kind">${item.pinned ? "◆" : item.type === "Reel" ? "▶" : "▣"}</span></div>`).join("")}`;
    renderCanvas(ui.gridCells.querySelector("[data-carousel-grid-draft]"), coverSlide(), 0);
  }

  function syncCoverForm() {
    const slide = coverSlide();
    ui.seriesName.value = series.name;
    ui.coverTitle.value = slide.title;
    ui.coverSubtitle.value = slide.body;
    ui.coverPlacement.value = slide.placement || "bottom";
    ui.coverAlign.value = slide.align || "left";
    ui.coverCase.value = slide.caseKind || "original";
    ui.coverShowLabel.checked = slide.showSeriesLabel !== false;
    syncCoverOffsets();
    syncTypographyControls("cover");
    syncLayerContentControls("cover");
    ui.longread.value = series.longread;
    ui.slideCount.value = String(series.totalSlides || series.slides.length);
    document.querySelectorAll("[data-carousel-scene]").forEach((button) => button.classList.toggle("is-active", button.dataset.carouselScene === slide.scene));
    const photo = photoById(slide.photoId);
    ui.coverPhotoName.textContent = photo?.fileName || "без фотографии";
    renderMediaStrip(ui.coverMedia, slide.photoId, ui.coverMediaSearch.value);
  }

  function renderCover() {
    renderCanvas(ui.coverCanvas, coverSlide(), 0);
    renderGridPreview();
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
    const slideFont = slide.font?.family ? slide.font : series.font;
    const photo = photoById(slide.photoId);
    const image = photo && !["paper", "field", "dark", "quote"].includes(slide.scene) ? `<img src="${escapeHtml(photo.thumb)}" alt="">` : "";
    const label = slide.title || slide.body || roleLabels[slide.role];
    return `<button type="button" class="carousel-mini-slide${index === series.activeSlide ? " is-active" : ""}${slide.savedAt ? " is-saved" : ""}" data-carousel-slide-index="${index}" style="--mini-bg:${palette.background};--mini-fg:${palette.foreground};--mini-font:'${escapeHtml(slideFont.family)}'"><span>${String(index + 1).padStart(2, "0")}</span><div>${image}<strong>${escapeHtml(label)}</strong></div><small>${escapeHtml(roleLabels[slide.role] || slide.role)}</small></button>`;
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
    renderSlideFontOptions(slide);
    ui.slidePlacement.value = slide.placement || "middle";
    ui.slideAlign.value = slide.align || "left";
    ui.slideShowLabel.checked = slide.showSeriesLabel !== false;
    syncActiveOffsets();
    syncTypographyControls("slide");
    syncLayerContentControls("slide");
    const photo = photoById(slide.photoId);
    ui.slidePhotoName.textContent = photo?.fileName || "без фотографии";
    ui.removePhoto.disabled = !slide.photoId;
    renderMediaStrip(ui.slideMedia, slide.photoId, ui.slideMediaSearch.value, slideMediaOrder);
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
    renderSource();
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
    slide.placement = ui.coverPlacement.value;
    slide.align = ui.coverAlign.value;
    slide.caseKind = ui.coverCase.value;
    slide.showSeriesLabel = ui.coverShowLabel.checked;
    setLayerOffsets(slide, coverMoveTarget, Number(ui.coverOffsetX.value), Number(ui.coverOffsetY.value));
    setLayerTypography(slide, coverMoveTarget, {
      family: ui.coverTypeFont.value,
      weight: ui.coverTypeWeight.value,
      size: ui.coverTypeSize.value,
      lineHeight: ui.coverTypeLineHeight.value,
      tracking: ui.coverTypeTracking.value,
    });
    ensureFontFamily(layerTypography(slide, coverMoveTarget).resolvedFamily);
    slide.savedAt = null;
    syncCoverOffsets();
    syncTypographyControls("cover");
    syncLayerContentControls("cover");
    renderCanvas(ui.coverCanvas, slide, 0);
    renderGridPreview();
    markChanged();
  }

  function updateActiveFromForm() {
    const slide = activeSlide();
    slide.title = ui.slideTitle.value;
    slide.body = ui.slideBody.value;
    slide.role = ui.slideRole.value;
    slide.scene = ui.slideScene.value;
    slide.palette = ui.slidePalette.value;
    slide.placement = ui.slidePlacement.value;
    slide.align = ui.slideAlign.value;
    slide.showSeriesLabel = ui.slideShowLabel.checked;
    setLayerOffsets(slide, slideMoveTarget, Number(ui.slideOffsetX.value), Number(ui.slideOffsetY.value));
    setLayerTypography(slide, slideMoveTarget, {
      family: ui.slideTypeFont.value,
      weight: ui.slideTypeWeight.value,
      size: ui.slideTypeSize.value,
      lineHeight: ui.slideTypeLineHeight.value,
      tracking: ui.slideTypeTracking.value,
    });
    ensureFontFamily(layerTypography(slide, slideMoveTarget).resolvedFamily);
    slide.savedAt = null;
    syncTypographyControls("slide");
    syncLayerContentControls("slide");
    const offsets = layerOffsets(slide, slideMoveTarget);
    ui.slideOffsetXValue.textContent = `${offsets.x}%`;
    ui.slideOffsetYValue.textContent = `${offsets.y}%`;
    renderCanvas(ui.activeCanvas, slide, series.activeSlide);
    if (series.activeSlide === 0) renderGridPreview();
    ui.activeMeta.textContent = `${roleLabels[slide.role] || slide.role} · есть изменения`;
    renderRail();
    markChanged();
  }

  function updateSelectedLayerContent(mode) {
    const cover = mode === "cover";
    const slide = cover ? coverSlide() : activeSlide();
    const target = cover ? coverMoveTarget : slideMoveTarget;
    const textControl = cover ? ui.coverLayerText : ui.slideLayerText;
    const visibleControl = cover ? ui.coverLayerVisible : ui.slideLayerVisible;
    setLayerText(slide, target, textControl.value);
    setLayerVisible(slide, target, visibleControl.checked);
    if (cover && target === "title") ui.coverTitle.value = slide.title;
    if (cover && target === "body") ui.coverSubtitle.value = slide.body;
    if (!cover && target === "title") ui.slideTitle.value = slide.title;
    if (!cover && target === "body") ui.slideBody.value = slide.body;
    if (target === "label") {
      if (cover) ui.coverShowLabel.checked = visibleControl.checked;
      else ui.slideShowLabel.checked = visibleControl.checked;
    }
    slide.savedAt = null;
    renderCanvas(cover ? ui.coverCanvas : ui.activeCanvas, slide, cover ? 0 : series.activeSlide);
    if (cover || series.activeSlide === 0) renderGridPreview();
    if (!cover) renderRail();
    syncLayerContentControls(mode);
    syncTypographyControls(mode);
    markChanged();
  }

  function addCustomTextLayer(mode) {
    const cover = mode === "cover";
    const slide = cover ? coverSlide() : activeSlide();
    const layer = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: "Новый текст",
      visible: true,
      x: 0,
      y: 0,
      fontFamily: "",
      weight: 700,
      size: 32,
      lineHeight: 1,
      tracking: 0,
    };
    slide.customLayers ||= [];
    slide.customLayers.push(layer);
    if (cover) coverMoveTarget = `custom:${layer.id}`;
    else slideMoveTarget = `custom:${layer.id}`;
    slide.savedAt = null;
    if (cover) renderCover();
    else renderActiveEditor();
    const input = cover ? ui.coverLayerText : ui.slideLayerText;
    input.focus();
    input.select();
    markChanged();
    setStatus("Добавлен новый текстовый блок — напишите текст и переместите его мышью.");
  }

  const clampLayerOffset = (value) => Math.max(-35, Math.min(35, Math.round(value * 10) / 10));
  let gridPreviewFrame = 0;

  function scheduleGridPreview() {
    if (gridPreviewFrame) return;
    gridPreviewFrame = requestAnimationFrame(() => {
      gridPreviewFrame = 0;
      renderGridPreview();
    });
  }

  function selectCanvasLayer(mode, layer, canvas) {
    const slide = mode === "cover" ? coverSlide() : activeSlide();
    if (!movableLayers[layer] && !customLayer(slide, layer)) return;
    if (mode === "cover") {
      coverMoveTarget = layer;
      syncCoverOffsets();
      syncTypographyControls("cover");
      syncLayerContentControls("cover");
    } else {
      slideMoveTarget = layer;
      syncActiveOffsets();
      syncTypographyControls("slide");
      syncLayerContentControls("slide");
    }
    canvas.querySelectorAll("[data-carousel-layer]").forEach((element) => element.classList.toggle("is-selected-layer", element.dataset.carouselLayer === layer));
  }

  function bindCanvasLayerDrag(canvas, mode) {
    let drag = null;
    canvas.addEventListener("pointerdown", (event) => {
      const layerElement = event.target.closest("[data-carousel-layer]");
      if (!layerElement || !canvas.contains(layerElement)) return;
      const layer = layerElement.dataset.carouselLayer;
      const slide = mode === "cover" ? coverSlide() : activeSlide();
      if (!movableLayers[layer] && !customLayer(slide, layer)) return;
      event.preventDefault();
      selectCanvasLayer(mode, layer, canvas);
      const offsets = layerOffsets(slide, layer);
      const rect = canvas.getBoundingClientRect();
      drag = {
        id: event.pointerId,
        layer,
        element: layerElement,
        startX: event.clientX,
        startY: event.clientY,
        originX: offsets.x,
        originY: offsets.y,
        width: rect.width,
        height: rect.height,
        moved: false,
      };
      layerElement.setPointerCapture(event.pointerId);
      setStatus(`${layerLabel(slide, layer)} · двигайте мышкой`);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const slide = mode === "cover" ? coverSlide() : activeSlide();
      const x = clampLayerOffset(drag.originX + (event.clientX - drag.startX) / drag.width * 100);
      const y = clampLayerOffset(drag.originY + (event.clientY - drag.startY) / drag.height * 100);
      drag.moved ||= Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 2;
      setLayerOffsets(slide, drag.layer, x, y);
      if (isCustomTarget(drag.layer)) {
        drag.element.style.setProperty("--custom-x", `${x}cqw`);
        drag.element.style.setProperty("--custom-y", `${y * 1.25}cqw`);
      } else applyLayerVariables(canvas, slide);
      if (mode === "cover") syncCoverOffsets();
      else syncActiveOffsets();
      slide.savedAt = null;
      if (mode === "cover" || series.activeSlide === 0) scheduleGridPreview();
      markChanged();
    });
    const finishDrag = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const movedLayer = drag.layer;
      const moved = drag.moved;
      drag = null;
      if (moved) {
        const slide = mode === "cover" ? coverSlide() : activeSlide();
        renderCanvas(canvas, slide, mode === "cover" ? 0 : series.activeSlide);
        if (mode === "cover" || series.activeSlide === 0) renderGridPreview();
        markChanged();
      }
      const slide = mode === "cover" ? coverSlide() : activeSlide();
      setStatus(moved ? `${layerLabel(slide, movedLayer)} перемещён — координаты сохранены.` : `${layerLabel(slide, movedLayer)} выбран.`);
    };
    canvas.addEventListener("pointerup", finishDrag);
    canvas.addEventListener("pointercancel", finishDrag);
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

  function cropImage(context, image, x, y, width, height, focusX = 50, focusY = 50) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) * Math.max(0, Math.min(100, Number(focusX) || 50)) / 100;
    const sourceY = (image.naturalHeight - sourceHeight) * Math.max(0, Math.min(100, Number(focusY) || 50)) / 100;
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

  function richCanvasWords(text) {
    const paragraphs = String(text || "").split(/\n\s*\n/);
    return paragraphs.flatMap((paragraph, paragraphIndex) => {
      const tokens = [];
      const pattern = /\*\*([^*]+)\*\*/g;
      let cursor = 0;
      const add = (value, bold) => words(value).forEach((word) => tokens.push({ word, bold }));
      let match;
      while ((match = pattern.exec(paragraph))) {
        add(paragraph.slice(cursor, match.index), false);
        add(match[1], true);
        cursor = match.index + match[0].length;
      }
      add(paragraph.slice(cursor), false);
      if (paragraphIndex < paragraphs.length - 1) tokens.push({ paragraphBreak: true });
      return tokens;
    });
  }

  function setCanvasTracking(context, tracking, size) {
    if ("letterSpacing" in context) context.letterSpacing = `${Number(tracking || 0) * Number(size || 0)}px`;
  }

  function wrapRichCanvasText(context, text, maxWidth, size, family, weight, tracking) {
    if (!String(text || "").trim()) return [];
    const lines = [[]];
    const boldWeight = Math.min(900, Math.max(700, Number(weight) + 220));
    richCanvasWords(text).forEach((token) => {
      if (token.paragraphBreak) {
        if (lines.at(-1).length) lines.push([]);
        lines.push([]);
        return;
      }
      context.font = `${token.bold ? boldWeight : weight} ${size}px ${family}`;
      setCanvasTracking(context, tracking, size);
      const width = context.measureText(token.word).width;
      context.font = `${weight} ${size}px ${family}`;
      setCanvasTracking(context, tracking, size);
      const space = lines.at(-1).length ? context.measureText(" ").width : 0;
      const current = lines.at(-1).reduce((sum, item, itemIndex) => sum + item.width + (itemIndex ? item.space : 0), 0);
      if (lines.at(-1).length && current + space + width > maxWidth) lines.push([]);
      lines.at(-1).push({ ...token, width, space: lines.at(-1).length ? space : 0 });
    });
    return lines;
  }

  function drawRichCanvasLines(context, lines, options) {
    let y = options.startY;
    const boldWeight = Math.min(900, Math.max(700, Number(options.weight) + 220));
    lines.forEach((line) => {
      y += options.size * (line.length ? options.lineHeight : Math.max(.7, options.lineHeight * .55));
      if (!line.length) return;
      const width = line.reduce((sum, token, index) => sum + token.width + (index ? token.space : 0), 0);
      let x = options.align === "center" ? options.x - width / 2 : options.align === "right" ? options.x - width : options.x;
      context.textAlign = "left";
      line.forEach((token, tokenIndex) => {
        if (tokenIndex) x += token.space;
        context.font = `${token.bold ? boldWeight : options.weight} ${options.size}px ${options.family}`;
        setCanvasTracking(context, options.tracking, options.size);
        context.fillText(token.word, x, y);
        x += token.width;
      });
    });
    return y;
  }

  async function makeSlideCanvas(slide, index) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    const palette = paletteFor(slide.palette);
    const photo = photoById(slide.photoId);
    const slideFont = slide.font?.family ? normalizeFontSystem(slide.font) : series.font;
    const usesPhoto = photo && !["paper", "field", "dark", "quote"].includes(slide.scene);
    context.fillStyle = palette.background;
    context.fillRect(0, 0, 1080, 1350);
    if (usesPhoto) {
      const image = await loadImage(photo.exportImage || photo.thumb);
      if (slide.scene === "split") cropImage(context, image, 600, 0, 480, 1350, slide.photoFocusX, slide.photoFocusY);
      else if (slide.scene === "window") cropImage(context, image, 90, 90, 900, 520, slide.photoFocusX, slide.photoFocusY);
      else cropImage(context, image, 0, 0, 1080, 1350, slide.photoFocusX, slide.photoFocusY);
      if (slide.scene === "photo-dim" || slide.scene === "plate") {
        const gradient = context.createLinearGradient(0, 250, 0, 1350);
        gradient.addColorStop(0, "rgba(10,16,14,.08)");
        gradient.addColorStop(1, "rgba(10,16,14,.88)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1080, 1350);
      }
    }
    const lightScene = ["paper", "quote", "field", "dark"].includes(slide.scene) || slide.scene === "split";
    const foreground = slide.textColor || (lightScene || slide.palette === "sekta-yellow" ? palette.foreground : "#ffffff");
    context.fillStyle = foreground;
    context.textAlign = slide.align || "left";
    context.textBaseline = "alphabetic";
    const baseX = slide.align === "center" ? 540 : slide.align === "right" ? 980 : 100;
    const titleXShift = (Number(slide.titleOffsetX) || 0) * 10.8;
    const titleYShift = (Number(slide.titleOffsetY) || 0) * 13.5;
    const bodyXShift = (Number(slide.bodyOffsetX) || 0) * 10.8;
    const bodyYShift = (Number(slide.bodyOffsetY) || 0) * 13.5;
    const titleX = baseX + titleXShift;
    const bodyX = baseX + bodyXShift;
    const maxWidth = slide.scene === "split" ? 440 : 880;
    const titleType = layerTypography(slide, "title");
    const bodyType = layerTypography(slide, "body");
    const labelType = layerTypography(slide, "label");
    const counterType = layerTypography(slide, "counter");
    const fontFamily = `"${titleType.resolvedFamily}", Arial, sans-serif`;
    const bodyFontFamily = `"${bodyType.resolvedFamily}", Arial, sans-serif`;
    const titleText = layerVisible(slide, "title") ? displayText(stripInlineMarkup(layerText(slide, "title", index)), slide.caseKind || slideFont.caseKind) : "";
    let titleSize = Math.max(8, Math.min(132, titleType.size));
    context.font = `${titleType.weight} ${titleSize}px ${fontFamily}`;
    setCanvasTracking(context, titleType.tracking, titleSize);
    let titleLines = wrapCanvasText(context, titleText, maxWidth);
    while (titleLines.length > 6 && titleSize > 18) {
      titleSize -= 4;
      context.font = `${titleType.weight} ${titleSize}px ${fontFamily}`;
      setCanvasTracking(context, titleType.tracking, titleSize);
      titleLines = wrapCanvasText(context, titleText, maxWidth);
    }
    const bodySize = Math.max(8, Math.min(132, bodyType.size));
    const bodyLines = layerVisible(slide, "body") ? wrapRichCanvasText(context, layerText(slide, "body", index), maxWidth, bodySize, bodyFontFamily, bodyType.weight, bodyType.tracking) : [];
    const titleHeight = titleLines.length * titleSize * titleType.lineHeight;
    const bodyHeight = bodyLines.length * bodySize * bodyType.lineHeight;
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
    context.font = `${titleType.weight} ${titleSize}px ${fontFamily}`;
    setCanvasTracking(context, titleType.tracking, titleSize);
    titleLines.forEach((line, lineIndex) => {
      context.fillText(line, titleX, startY + titleYShift + titleSize * (.85 + lineIndex * titleType.lineHeight), maxWidth);
    });
    const bodyStartY = startY + titleHeight + (titleLines.length && bodyLines.length ? 50 : 0) + bodyYShift;
    drawRichCanvasLines(context, bodyLines, { x: bodyX, startY: bodyStartY, size: bodySize, family: bodyFontFamily, weight: bodyType.weight, lineHeight: bodyType.lineHeight, tracking: bodyType.tracking, align: slide.align || "left" });
    context.fillStyle = foreground;
    context.textAlign = "left";
    const labelXShift = (Number(slide.labelOffsetX) || 0) * 10.8;
    const labelYShift = (Number(slide.labelOffsetY) || 0) * 13.5;
    const counterXShift = (Number(slide.counterOffsetX) || 0) * 10.8;
    const counterYShift = (Number(slide.counterOffsetY) || 0) * 13.5;
    context.font = `${labelType.weight} ${labelType.size}px "${labelType.resolvedFamily}", Arial, sans-serif`;
    setCanvasTracking(context, labelType.tracking, labelType.size);
    if (layerVisible(slide, "label")) context.fillText(layerText(slide, "label", index), 100 + labelXShift, 90 + labelYShift);
    context.textAlign = "right";
    context.font = `${counterType.weight} ${counterType.size}px "${counterType.resolvedFamily}", Arial, sans-serif`;
    setCanvasTracking(context, counterType.tracking, counterType.size);
    if (layerVisible(slide, "counter")) context.fillText(layerText(slide, "counter", index), 980 + counterXShift, 1280 + counterYShift);
    (slide.customLayers || []).filter((layer) => layer.visible !== false && layer.text).forEach((layer) => {
      const target = `custom:${layer.id}`;
      const type = layerTypography(slide, target);
      const family = `"${type.resolvedFamily}", Arial, sans-serif`;
      context.textAlign = "left";
      context.fillStyle = foreground;
      context.font = `${type.weight} ${type.size}px ${family}`;
      setCanvasTracking(context, type.tracking, type.size);
      const lines = wrapCanvasText(context, layer.text, 860);
      const x = 100 + (Number(layer.x) || 0) * 10.8;
      const y = 675 + (Number(layer.y) || 0) * 13.5;
      lines.forEach((line, lineIndex) => context.fillText(line, x, y + lineIndex * type.size * type.lineHeight));
    });
    return canvas;
  }

  async function downloadSlide(slide, index) {
    try {
      setStatus("Собираем PNG 1080 × 1350…");
      const slideFont = slide.font?.family ? normalizeFontSystem(slide.font) : series.font;
      ensureFont(slideFont);
      const textLayers = [
        ...Object.keys(typographyLayers).map((layer) => layerTypography(slide, layer)),
        ...(slide.customLayers || []).map((layer) => layerTypography(slide, `custom:${layer.id}`)),
      ];
      textLayers.forEach((type) => ensureFontFamily(type.resolvedFamily));
      try { await Promise.all(textLayers.map((type) => document.fonts.load(`${type.weight} ${type.size}px "${type.resolvedFamily}"`))); } catch {}
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

  function makeSelectionBold(textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      setStatus("Сначала выделите фрагмент основного текста.");
      textarea.focus();
      return;
    }
    const selected = textarea.value.slice(start, end);
    const alreadyBold = selected.startsWith("**") && selected.endsWith("**");
    const replacement = alreadyBold ? selected.slice(2, -2) : `**${selected}**`;
    textarea.setRangeText(replacement, start, end, "select");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
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

  document.querySelectorAll("[data-carousel-preview]").forEach((button) => button.addEventListener("click", () => {
    const showGrid = button.dataset.carouselPreview === "grid";
    ui.coverCanvas.hidden = showGrid;
    ui.gridPreview.hidden = !showGrid;
    document.querySelectorAll("[data-carousel-preview]").forEach((choice) => {
      const active = choice === button;
      choice.classList.toggle("is-active", active);
      choice.setAttribute("aria-selected", String(active));
    });
    if (showGrid) renderGridPreview();
  }));
  ui.coverMoveTarget.addEventListener("change", () => {
    coverMoveTarget = movableLayers[ui.coverMoveTarget.value] || customLayer(coverSlide(), ui.coverMoveTarget.value) ? ui.coverMoveTarget.value : "title";
    syncCoverOffsets();
    syncTypographyControls("cover");
    syncLayerContentControls("cover");
    renderCanvas(ui.coverCanvas, coverSlide(), 0);
  });
  [ui.coverLayerText, ui.coverLayerVisible].forEach((control) => control.addEventListener("input", () => updateSelectedLayerContent("cover")));
  ui.coverLayerAdd.addEventListener("click", () => addCustomTextLayer("cover"));
  ui.coverLayerRemove.addEventListener("click", () => {
    if (isCustomTarget(coverMoveTarget)) {
      coverSlide().customLayers = coverSlide().customLayers.filter((layer) => `custom:${layer.id}` !== coverMoveTarget);
      coverMoveTarget = "title";
      renderCover();
      markChanged();
      setStatus("Текстовый блок удалён с обложки.");
      return;
    }
    ui.coverLayerVisible.checked = !ui.coverLayerVisible.checked;
    updateSelectedLayerContent("cover");
    setStatus(ui.coverLayerVisible.checked ? "Элемент возвращён на обложку." : "Элемент удалён с обложки.");
  });
  [ui.seriesName, ui.coverTitle, ui.coverSubtitle, ui.coverTypeFont, ui.coverTypeWeight, ui.coverTypeSize, ui.coverTypeLineHeight, ui.coverTypeTracking, ui.coverPlacement, ui.coverAlign, ui.coverCase, ui.coverShowLabel, ui.coverOffsetX, ui.coverOffsetY].forEach((control) => control.addEventListener("input", updateCoverFromForm));
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
  ui.coverMediaSearch.addEventListener("input", () => {
    coverMediaLimit = 48;
    renderMediaStrip(ui.coverMedia, coverSlide().photoId, ui.coverMediaSearch.value);
    ui.coverMedia.scrollTop = 0;
  });
  ui.saveCover.addEventListener("click", () => saveCurrentSlide(0));
  ui.downloadCover.addEventListener("click", () => downloadSlide(coverSlide(), 0));

  ui.longread.addEventListener("input", () => {
    series.longread = ui.longread.value;
    renderSplitPreview();
    markChanged();
  });
  ui.generateLongread?.addEventListener("click", () => generateFromIdea(false));
  ui.regenerateLongread?.addEventListener("click", () => generateFromIdea(true));
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
  ui.bodyBold.addEventListener("click", () => makeSelectionBold(ui.slideBody));
  ui.slideMoveTarget.addEventListener("change", () => {
    slideMoveTarget = movableLayers[ui.slideMoveTarget.value] || customLayer(activeSlide(), ui.slideMoveTarget.value) ? ui.slideMoveTarget.value : "body";
    syncActiveOffsets();
    syncTypographyControls("slide");
    syncLayerContentControls("slide");
    renderCanvas(ui.activeCanvas, activeSlide(), series.activeSlide);
  });
  [ui.slideLayerText, ui.slideLayerVisible].forEach((control) => control.addEventListener("input", () => updateSelectedLayerContent("slide")));
  ui.slideLayerAdd.addEventListener("click", () => addCustomTextLayer("slide"));
  ui.slideLayerRemove.addEventListener("click", () => {
    if (isCustomTarget(slideMoveTarget)) {
      activeSlide().customLayers = activeSlide().customLayers.filter((layer) => `custom:${layer.id}` !== slideMoveTarget);
      slideMoveTarget = "body";
      renderActiveEditor();
      markChanged();
      setStatus("Текстовый блок удалён со слайда.");
      return;
    }
    ui.slideLayerVisible.checked = !ui.slideLayerVisible.checked;
    updateSelectedLayerContent("slide");
    setStatus(ui.slideLayerVisible.checked ? "Элемент возвращён на слайд." : "Элемент удалён со слайда.");
  });
  [ui.slideTitle, ui.slideBody, ui.slideRole, ui.slideScene, ui.slidePalette, ui.slideTypeFont, ui.slideTypeWeight, ui.slideTypeSize, ui.slideTypeLineHeight, ui.slideTypeTracking, ui.slidePlacement, ui.slideAlign, ui.slideShowLabel, ui.slideOffsetX, ui.slideOffsetY].forEach((control) => control.addEventListener("input", updateActiveFromForm));
  ui.slideFont.addEventListener("change", () => {
    const slide = activeSlide();
    if (ui.slideFont.value === "series") slide.font = null;
    else {
      const choice = fontChoices().find((font) => fontSystemKey(font) === ui.slideFont.value);
      slide.font = choice ? normalizeFontSystem(choice) : null;
      ensureFont(slide.font || series.font);
    }
    slide.savedAt = null;
    renderActiveEditor();
    markChanged();
    setStatus(slide.font ? `${slide.font.family} применён только к слайду ${series.activeSlide + 1}.` : `Слайд ${series.activeSlide + 1} снова использует шрифт всей серии.`);
  });
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
  ui.slideMediaSearch.addEventListener("input", () => {
    slideMediaLimit = 48;
    renderMediaStrip(ui.slideMedia, activeSlide().photoId, ui.slideMediaSearch.value, slideMediaOrder);
    ui.slideMedia.scrollTop = 0;
  });
  window.addEventListener("sekta:library-updated", () => {
    slideMediaOrder = [...library];
    renderMediaStrip(ui.coverMedia, coverSlide().photoId, ui.coverMediaSearch.value);
    renderMediaStrip(ui.slideMedia, activeSlide().photoId, ui.slideMediaSearch.value, slideMediaOrder);
  });
  ui.shuffleSlideMedia.addEventListener("click", () => {
    slideMediaOrder = shuffle(slideMediaOrder);
    slideMediaLimit = 48;
    renderMediaStrip(ui.slideMedia, activeSlide().photoId, ui.slideMediaSearch.value, slideMediaOrder);
    ui.slideMedia.scrollTop = 0;
    setStatus("Фотографии для этого слайда перемешаны.");
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
  window.addEventListener("sekta:post-builder-load", (event) => loadIdea(event.detail || fallbackIdea));

  bindCanvasLayerDrag(ui.coverCanvas, "cover");
  bindCanvasLayerDrag(ui.activeCanvas, "slide");
  bindInfiniteMedia(ui.coverMedia, "cover");
  bindInfiniteMedia(ui.slideMedia, "slide");
  ensureFont(series.font);
  renderAll();
  setStage("cover");
  if (importedOnLoad) {
    const choices = fontChoices();
    if (choices.length) series.font = normalizeFontSystem(choices[0]);
    const likedPalettes = layoutLikeIds();
    if (likedPalettes.length) series.palette = `layout-${likedPalettes[0]}`;
    series.slides.forEach((slide) => { slide.palette = series.palette; });
    document.querySelector('[data-view="postbuilder"]')?.click();
    renderAll();
    setStatus(`Импортировано: ${choices.length} шрифтовых вариантов, ${tasteBundle.systems?.length || 0} сохранённых систем и ${likedPalettes.length} цветовых сцен.`);
  }
  markChanged();
})();
