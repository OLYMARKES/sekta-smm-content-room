(() => {
  const demo = window.SEKTA_GROWTH_COACH_DEMO || { notice: "Демонстрационные данные", posts: [] };
  const dataKey = "sekta-growth-coach-data-v1";
  const experimentKey = "sekta-growth-coach-experiments-v1";
  const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
  const integerFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

  const ui = {
    dataState: document.querySelector("#coachDataState"),
    dataTitle: document.querySelector("#coachDataTitle"),
    dataNote: document.querySelector("#coachDataNote"),
    importInput: document.querySelector("#coachImportInput"),
    period: document.querySelector("#coachPeriod"),
    metric: document.querySelector("#coachMetric"),
    downloadTemplate: document.querySelector("#coachDownloadTemplate"),
    clearData: document.querySelector("#coachClearData"),
    sourceRange: document.querySelector("#coachSourceRange"),
    kpis: document.querySelector("#coachKpis"),
    mobileSignal: document.querySelector("#coachMobileSignal"),
    chart: document.querySelector("#coachChart"),
    chartCaption: document.querySelector("#coachChartCaption"),
    next: document.querySelector("#coachNext"),
    insights: document.querySelector("#coachInsights"),
    segments: document.querySelector("#coachSegments"),
    updatedAt: document.querySelector("#coachUpdatedAt"),
    experiments: document.querySelector("#coachExperiments"),
    experimentCount: document.querySelector("#coachExperimentCount"),
    materialContext: document.querySelector("#coachMaterialContext"),
  };
  if (!ui.kpis) return;

  function loadJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  let savedPayload = loadJson(dataKey, null);
  let posts = Array.isArray(savedPayload?.posts) && savedPayload.posts.length ? savedPayload.posts : demo.posts;
  let isDemo = !savedPayload?.posts?.length;
  let experiments = loadJson(experimentKey, []);
  let materialContext = loadJson("sekta-growth-coach-material-v1", null);
  let currentAnalysis = null;

  const sum = (items, key) => items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
  const rate = (value, base) => base ? value / base * 100 : 0;
  const median = (values) => {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const percent = (value, digits = 1) => `${numberFormat.format(Number(value || 0).toFixed(digits))}%`;
  const shortNumber = (value) => {
    const number = Number(value) || 0;
    if (number >= 1_000_000) return `${numberFormat.format(number / 1_000_000)} млн`;
    if (number >= 1_000) return `${numberFormat.format(number / 1_000)} тыс.`;
    return integerFormat.format(number);
  };
  const normalizeFormat = (value) => {
    const text = String(value || "Пост").trim().toLowerCase();
    if (text.includes("reel") || text.includes("рил") || text.includes("video") || text.includes("видео")) return "Reel";
    if (text.includes("карус")) return "Карусель";
    if (text.includes("фото") || text.includes("image")) return "Фото";
    return String(value || "Пост").trim();
  };
  const normalizeMechanic = (value, title = "") => {
    if (String(value || "").trim()) return String(value).trim().toLowerCase();
    const text = title.toLowerCase();
    if (/почему|на самом деле|не .*а /.test(text)) return "контринтуиция";
    if (/как|шаг|способ|упражнен|минут/.test(text)) return "практика";
    if (/знаком|бывает|пропуст|можно/.test(text)) return "узнавание";
    if (/курс|старт|поток|присоедин/.test(text)) return "анонс";
    return "наблюдение";
  };
  const dateValue = (value) => {
    const text = String(value || "").trim();
    const ru = text.match(/^(\d{1,2})[.\/]([0-1]?\d)[.\/](\d{4})$/);
    const normalized = ru ? `${ru[3]}-${ru[2].padStart(2, "0")}-${ru[1].padStart(2, "0")}` : text;
    const date = new Date(`${normalized}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const enrich = (item) => {
    const reach = Number(item.reach) || 0;
    const interactions = ["likes", "comments", "saves", "shares"].reduce((total, key) => total + (Number(item[key]) || 0), 0);
    return {
      ...item,
      format: normalizeFormat(item.format),
      mechanic: normalizeMechanic(item.mechanic, item.title || ""),
      reach,
      engagementRate: rate(interactions, reach),
      saveRate: rate(Number(item.saves) || 0, reach),
      shareRate: rate(Number(item.shares) || 0, reach),
      followRate: rate(Number(item.follows) || 0, reach),
      dateObject: dateValue(item.date),
    };
  };

  function summarize(items) {
    const reach = sum(items, "reach");
    const interactions = sum(items, "likes") + sum(items, "comments") + sum(items, "saves") + sum(items, "shares");
    return {
      count: items.length,
      reach,
      engagement: rate(interactions, reach),
      saves: rate(sum(items, "saves"), reach),
      shares: rate(sum(items, "shares"), reach),
      follows: rate(sum(items, "follows"), reach),
      followsTotal: sum(items, "follows"),
    };
  }

  function segment(items, key) {
    const groups = new Map();
    items.forEach((item) => {
      const label = item[key] || "Без метки";
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(item);
    });
    return [...groups.entries()].map(([label, rows]) => ({ label, rows, ...summarize(rows), averageReach: sum(rows, "reach") / rows.length })).sort((a, b) => b.engagement - a.engagement);
  }

  function analyze() {
    const all = posts.map(enrich).filter((item) => item.dateObject && item.reach > 0).sort((a, b) => a.dateObject - b.dateObject);
    const days = Number(ui.period.value) || 14;
    const latest = all.at(-1)?.dateObject || new Date();
    const currentStart = new Date(latest); currentStart.setDate(currentStart.getDate() - days + 1);
    const previousStart = new Date(currentStart); previousStart.setDate(previousStart.getDate() - days);
    const current = all.filter((item) => item.dateObject >= currentStart && item.dateObject <= latest);
    const previous = all.filter((item) => item.dateObject >= previousStart && item.dateObject < currentStart);
    const currentSummary = summarize(current);
    const previousSummary = summarize(previous);
    const bestShare = [...current].sort((a, b) => b.shareRate - a.shareRate)[0];
    const bestSave = [...current].sort((a, b) => b.saveRate - a.saveRate)[0];
    const strongest = [...current].sort((a, b) => (b.engagementRate + b.shareRate) - (a.engagementRate + a.shareRate))[0];
    const weakest = [...current].sort((a, b) => (a.engagementRate + a.shareRate) - (b.engagementRate + b.shareRate))[0];
    const mechanics = segment(current, "mechanic");
    const formats = segment(current, "format");
    return { all, current, previous, days, latest, currentStart, previousStart, currentSummary, previousSummary, bestShare, bestSave, strongest, weakest, mechanics, formats };
  }

  function compare(current, previous) {
    if (!previous) return { label: "нет базы", className: "is-neutral" };
    const change = (current - previous) / previous * 100;
    if (!Number.isFinite(change)) return { label: "нет базы", className: "is-neutral" };
    const sign = change > 0 ? "+" : "";
    return { label: `${sign}${numberFormat.format(change)}% к прошлому периоду`, className: change >= 0 ? "is-up" : "is-down" };
  }

  function renderState() {
    const sourceDate = (date) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date);
    ui.dataState.classList.toggle("is-live", !isDemo);
    ui.dataState.querySelector("strong").textContent = isDemo ? "Демо-режим" : "Внутренние данные";
    ui.dataState.querySelector("small").textContent = isDemo ? "не статистика #Sekta" : `${posts.length} публикаций`;
    ui.dataTitle.textContent = isDemo ? "Сейчас показан безопасный демонстрационный сценарий" : `Загружена выгрузка: ${savedPayload?.name || "Instagram Insights"}`;
    ui.dataNote.textContent = isDemo ? demo.notice : `Данные хранятся локально. Последняя загрузка: ${new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(savedPayload.savedAt))}.`;
    ui.sourceRange.textContent = currentAnalysis?.current.length
      ? `Источник: ${sourceDate(currentAnalysis.currentStart)}—${sourceDate(currentAnalysis.latest)} · ${currentAnalysis.current.length} публикаций`
      : "Источник: в периоде нет публикаций";
    ui.clearData.hidden = isDemo;
    renderMaterialContext();
  }

  function renderMaterialContext() {
    if (!ui.materialContext) return;
    ui.materialContext.hidden = !materialContext?.id;
    if (!materialContext?.id) return;
    ui.materialContext.innerHTML = `<div><strong>Разбираем материал: ${escapeHtml(materialContext.title)}</strong><span>${escapeHtml(materialContext.format || "Публикация")} · ${escapeHtml(materialContext.account || "@sektaschool")} · ${escapeHtml(materialContext.publicationDate || "дата не указана")}</span></div><a href="${escapeHtml(materialContext.publicationUrl)}" target="_blank" rel="noreferrer">Открыть публикацию ↗</a>`;
  }

  function renderKpis(analysis) {
    const { currentSummary: now, previousSummary: before } = analysis;
    const cards = [
      ["Охват", shortNumber(now.reach), compare(now.reach, before.reach), `${now.count} публикаций в периоде`],
      ["Вовлечение", percent(now.engagement), compare(now.engagement, before.engagement), "лайки + комментарии + сохранения + репосты / охват"],
      ["Сохранения", percent(now.saves), compare(now.saves, before.saves), `${integerFormat.format(sum(analysis.current, "saves"))} сохранений`],
      ["Подписки", integerFormat.format(now.followsTotal), compare(now.follows, before.follows), `${percent(now.follows, 2)} от охвата`],
    ];
    ui.kpis.innerHTML = cards.map(([label, value, delta, note]) => `<article class="coach-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small class="${delta.className}">${escapeHtml(delta.label)}</small><p>${escapeHtml(note)}</p></article>`).join("");
  }

  const metricConfig = {
    reach: { label: "охват", value: (item) => item.reach, format: shortNumber },
    engagement: { label: "вовлечение", value: (item) => item.engagementRate, format: percent },
    saves: { label: "сохранения", value: (item) => item.saveRate, format: percent },
    shares: { label: "репосты", value: (item) => item.shareRate, format: percent },
    follows: { label: "подписки", value: (item) => item.followRate, format: (value) => percent(value, 2) },
  };

  function renderChart(analysis) {
    const config = metricConfig[ui.metric.value] || metricConfig.reach;
    const items = [...analysis.current].sort((a, b) => config.value(b) - config.value(a)).slice(0, 8);
    const values = items.map(config.value);
    const maximum = Math.max(...values, 1);
    const midpoint = median(values);
    ui.chartCaption.textContent = `Показатель «${config.label}» · медиана ${config.format(midpoint)} · ${analysis.days} дней`;
    ui.chart.setAttribute("aria-label", `Рейтинг публикаций по показателю ${config.label}`);
    ui.chart.innerHTML = items.length ? items.map((item) => {
      const value = config.value(item);
      const width = Math.max(3, value / maximum * 100);
      return `<article class="coach-bar-row" role="listitem"><div class="coach-bar-label"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.format)} · ${escapeHtml(item.mechanic)}</span></div><div class="coach-bar-track" aria-hidden="true"><i class="${value >= midpoint ? "is-strong" : ""}" style="--bar:${width}%"></i></div><b>${escapeHtml(config.format(value))}</b></article>`;
    }).join("") : `<div class="coach-empty">В выбранном периоде нет публикаций с охватом.</div>`;
  }

  function nextExperiment(analysis) {
    const source = analysis.strongest;
    const mechanic = source?.mechanic || "практика";
    const format = source?.format || "Карусель";
    const sourceMetric = source?.shareRate >= source?.saveRate ? "репосты от охвата" : "сохранения от охвата";
    const sourceMetricValue = sourceMetric.startsWith("репосты") ? source?.shareRate : source?.saveRate;
    return {
      id: `${Date.now()}-${mechanic}`,
      title: `Повторить механику «${mechanic}» в формате ${format.toLowerCase()}`,
      hypothesis: `Если оставить формат, механику, визуальный ритм и CTA, но заменить только тему, результат по ключевой метрике останется не ниже исходного поста.`,
      keep: `${format}, механика «${mechanic}», визуальный ритм и CTA`,
      change: "Только тема публикации",
      metric: sourceMetric,
      baseline: source ? `${percent(sourceMetricValue)} у «${source.title}»` : "медиана периода",
      mechanic,
      format,
      sourceTitle: source?.title || "лучший материал периода",
      status: "planned",
      createdAt: new Date().toISOString(),
    };
  }

  function renderNext(analysis) {
    const experiment = nextExperiment(analysis);
    currentAnalysis.experiment = experiment;
    ui.next.innerHTML = `<div class="coach-next-head"><span>Следующий управляемый тест</span><strong>${escapeHtml(experiment.title)}</strong><p>${escapeHtml(experiment.hypothesis)}</p></div><dl class="coach-test-spec"><div><dt>Оставить</dt><dd>${escapeHtml(experiment.keep)}</dd></div><div><dt>Изменить</dt><dd>${escapeHtml(experiment.change)}</dd></div><div><dt>Метрика успеха</dt><dd>${escapeHtml(experiment.metric)}</dd></div><div><dt>База сравнения</dt><dd>${escapeHtml(experiment.baseline)}</dd></div></dl><div class="coach-next-actions"><button class="button button-primary" type="button" data-coach-accept>Принять эксперимент</button><button class="button button-secondary" type="button" data-coach-build>Собрать пост</button></div>`;
    ui.mobileSignal.innerHTML = analysis.strongest ? `<div><span>Главный сигнал периода</span><strong>${escapeHtml(analysis.strongest.title)}</strong><small>${percent(analysis.strongest.engagementRate)} вовлечения · ${escapeHtml(analysis.strongest.format)} · ${escapeHtml(analysis.strongest.mechanic)}</small></div><div><span>Следующий тест</span><strong>${escapeHtml(experiment.change)}</strong><small>База: ${escapeHtml(experiment.baseline)}</small></div>` : `<div class="coach-empty">Нет публикаций для следующего теста.</div>`;
  }

  function insightCard(kind, title, observation, evidence, action, actionLabel, mechanic) {
    return `<article class="coach-insight coach-insight-${kind}"><span>${kind === "repeat" ? "Повторить" : kind === "change" ? "Изменить" : "Проверить"}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(observation)}</p><div><strong>Основание</strong><small>${escapeHtml(evidence)}</small></div><button class="text-button" type="button" data-coach-bank data-mechanic="${escapeHtml(mechanic || "all")}">${escapeHtml(actionLabel || action)} →</button></article>`;
  }

  function renderInsights(analysis) {
    if (!analysis.current.length) {
      ui.insights.innerHTML = `<div class="coach-empty">В выбранном периоде нет строк для анализа. Выберите более длинный период или загрузите новую выгрузку.</div>`;
      return;
    }
    const bestShare = analysis.bestShare;
    const bestSave = analysis.bestSave;
    const weak = analysis.weakest;
    ui.insights.innerHTML = [
      insightCard("repeat", `Заход «${bestShare.mechanic}» люди передают дальше`, `У «${bestShare.title}» самая высокая доля репостов в периоде — ${percent(bestShare.shareRate)}. Повторять стоит механику, а не копировать тему.`, `${integerFormat.format(bestShare.shares)} репостов при охвате ${integerFormat.format(bestShare.reach)}`, "Открыть похожие заходы", "Найти похожие идеи", bestShare.mechanic),
      insightCard("change", `Прямой анонс требует другого входа`, `«${weak.title}» дал самую слабую глубину реакции. Не отменяем продуктовую задачу: меняем первый тезис с объявления на узнаваемую ситуацию аудитории.`, `${percent(weak.engagementRate)} вовлечения · ${percent(weak.shareRate)} репостов`, "Найти человеческий заход", "Пересобрать заход", "узнавание"),
      insightCard("test", `Практическая польза удерживает внимание`, `«${bestSave.title}» чаще других сохраняли. Следующий тест — оставить плотность пользы, но проверить более короткую обложку и один конкретный CTA.`, `${integerFormat.format(bestSave.saves)} сохранений · ${percent(bestSave.saveRate)} от охвата`, "Открыть практические идеи", "Найти практические идеи", "практика"),
    ].join("");
  }

  function renderSegments(analysis) {
    const rows = [...analysis.formats.slice(0, 3), ...analysis.mechanics.slice(0, 4)];
    ui.segments.innerHTML = `<div class="coach-segment-head"><span>Сегмент</span><span>Постов</span><span>Средний охват</span><span>Вовлечение</span><span>Репосты</span></div>${rows.map((item, index) => `<article class="coach-segment-row"><strong>${escapeHtml(item.label)}</strong><span>${item.count}</span><span>${shortNumber(item.averageReach)}</span><span>${percent(item.engagement)}</span><span>${percent(item.shares)}</span>${index === 0 || index === 3 ? `<em>лидер группы</em>` : ""}</article>`).join("")}`;
  }

  function renderExperiments() {
    const active = experiments.filter((item) => item.status !== "done");
    ui.experimentCount.textContent = `${active.length} ${active.length === 1 ? "активный" : "активных"}`;
    ui.experiments.innerHTML = experiments.length ? experiments.slice(0, 5).map((item, index) => `<article class="coach-experiment ${item.status === "done" ? "is-done" : ""}"><div><span>${item.status === "done" ? "Завершён" : "Запланирован"}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.metric)} · база: ${escapeHtml(item.baseline)}</small></div><button class="text-button" type="button" data-coach-experiment="${index}">${item.status === "done" ? "Вернуть" : "Зафиксировать результат"}</button></article>`).join("") : `<div class="coach-empty"><strong>Пока нет принятых экспериментов</strong><span>Примите тест справа — он появится здесь и не потеряется после перезагрузки.</span></div>`;
  }

  function render() {
    currentAnalysis = analyze();
    renderState();
    renderKpis(currentAnalysis);
    renderChart(currentAnalysis);
    renderNext(currentAnalysis);
    renderInsights(currentAnalysis);
    renderSegments(currentAnalysis);
    renderExperiments();
    ui.updatedAt.textContent = `пересчитано ${new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
  }

  function parseCsv(text) {
    const firstLine = text.split(/\r?\n/, 1)[0] || "";
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = !quoted;
      else if (character === delimiter && !quoted) { row.push(cell.trim()); cell = ""; }
      else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
      } else cell += character;
    }
    row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  const aliases = {
    date: ["date", "дата", "дата публикации"], title: ["title", "контент", "название", "описание", "публикация"], format: ["format", "type", "тип", "формат"], mechanic: ["mechanic", "механика", "заход"], objective: ["objective", "цель"],
    reach: ["reach", "accounts reached", "охват"], views: ["views", "просмотры", "plays"], likes: ["likes", "лайки", "отметки нравится"], comments: ["comments", "комментарии"], saves: ["saves", "сохранения"], shares: ["shares", "репосты", "поделились"], profile_visits: ["profile visits", "profile_visits", "визиты профиля", "посещения профиля"], follows: ["follows", "подписки", "новые подписчики"],
  };
  function headerKey(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " ");
    return Object.entries(aliases).find(([, variants]) => variants.includes(normalized))?.[0] || null;
  }
  function numeric(value) {
    const normalized = String(value ?? "").replace(/\s/g, "").replace(/%$/, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
    return Number(normalized) || 0;
  }
  function normalizeRows(rawRows) {
    if (rawRows.length < 2) throw new Error("В файле нет строк с публикациями");
    const keys = rawRows[0].map(headerKey);
    if (!["date", "title", "reach"].every((required) => keys.includes(required))) throw new Error("Нужны колонки date/дата, title/название и reach/охват");
    return rawRows.slice(1).map((cells) => {
      const item = {};
      keys.forEach((key, index) => { if (key) item[key] = ["date", "title", "format", "mechanic", "objective"].includes(key) ? cells[index] : numeric(cells[index]); });
      return item;
    }).filter((item) => dateValue(item.date) && item.title && item.reach > 0);
  }

  function showImportError(message) {
    ui.dataTitle.textContent = "Не удалось прочитать выгрузку";
    ui.dataNote.textContent = message;
    ui.dataState.classList.remove("is-live");
  }

  ui.importInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const normalized = normalizeRows(parseCsv(await file.text()));
      if (!normalized.length) throw new Error("Не найдено публикаций с датой, названием и охватом больше нуля");
      posts = normalized;
      isDemo = false;
      savedPayload = { name: file.name, savedAt: new Date().toISOString(), posts };
      localStorage.setItem(dataKey, JSON.stringify(savedPayload));
      render();
    } catch (error) {
      showImportError(error.message || "Проверьте формат CSV");
    } finally {
      event.target.value = "";
    }
  });
  ui.period.addEventListener("change", render);
  ui.metric.addEventListener("change", () => renderChart(currentAnalysis));
  ui.clearData.addEventListener("click", () => {
    localStorage.removeItem(dataKey); savedPayload = null; posts = demo.posts; isDemo = true; render();
  });
  ui.downloadTemplate.addEventListener("click", () => {
    const csv = "date,title,format,mechanic,objective,reach,views,likes,comments,saves,shares,profile_visits,follows\n2026-08-25,Название публикации,Карусель,узнавание,сохранения,0,0,0,0,0,0,0,0\n";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    link.download = "sekta-instagram-insights-template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-coach-accept]")) {
      const exists = experiments.some((item) => item.title === currentAnalysis.experiment.title && item.status !== "done");
      if (!exists) experiments.unshift(currentAnalysis.experiment);
      localStorage.setItem(experimentKey, JSON.stringify(experiments));
      renderExperiments();
    }
    if (event.target.closest("[data-coach-build]")) {
      const experiment = currentAnalysis.experiment;
      document.querySelector('[data-view="postbuilder"]')?.click();
      window.dispatchEvent(new CustomEvent("sekta:post-builder-load", { detail: { id: experiment.id, kind: experiment.format === "Reel" ? "reel" : "post", title: experiment.title, hook: experiment.title, objective: `Проверить: ${experiment.metric}`, cta: "Сохраните и вернитесь к этому тесту через неделю", asset: `Механика: ${experiment.mechanic}`, readiness: "Гипотеза коуча" } }));
    }
    const bankButton = event.target.closest("[data-coach-bank]");
    if (bankButton) {
      document.querySelector('[data-view="growth"]')?.click();
      const mechanic = document.querySelector("#ideaMechanicFilter");
      if (mechanic && [...mechanic.options].some((option) => option.value === bankButton.dataset.mechanic)) {
        mechanic.value = bankButton.dataset.mechanic;
        mechanic.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    const experimentButton = event.target.closest("[data-coach-experiment]");
    if (experimentButton) {
      const item = experiments[Number(experimentButton.dataset.coachExperiment)];
      if (item) item.status = item.status === "done" ? "planned" : "done";
      localStorage.setItem(experimentKey, JSON.stringify(experiments));
      renderExperiments();
    }
  });

  window.addEventListener("sekta:growth-coach-material", (event) => {
    materialContext = event.detail || null;
    renderMaterialContext();
  });

  render();
})();
