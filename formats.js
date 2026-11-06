(() => {
  const kind = new URLSearchParams(location.search).get("kind") === "threads" ? "threads" : "email";
  const isEmail = kind === "email";
  const find = (id) => document.getElementById(id);
  const status = find("formatStatus");
  const saveButton = find("saveDraft");
  const openButton = find("openDraft");
  const importButton = find("importDraft");
  const importFile = find("draftFile");
  const draftSelect = find("drafts");
  const fields = (isEmail ? ["subject", "preheader", "heading", "image", "imageAlt", "emailBody", "cta", "ctaUrl"] : ["account", "threadsBody", "limit", "publishDate", "publishSlot", "editorialStatus", "themeId"]).map(find);
  let id = null;
  let revision = null;
  let dirty = false;
  let busy = false;
  let renderTimer;
  let drafts = [];
  let themes = [];
  const accounts = {
    school: "Sekta School", mama: "Sekta Мама", pregnancy: "Sekta Pregnancy", glp1: "Sekta GLP‑1",
  };
  const slots = { morning: "Утро", day: "День", evening: "Вечер" };
  const stages = { idea: "Идея", review: "На проверке", ready: "Готово", published: "Вышел", rejected: "Не берём" };
  const angleLabels = { q: "Вопрос", take: "Тезис", scene: "Сцена" };

  find("emailFields").hidden = !isEmail;
  find("emailPreview").hidden = !isEmail;
  find("threadsFields").hidden = isEmail;
  find("threadsPreview").hidden = isEmail;
  find(isEmail ? "emailLink" : "threadsLink").setAttribute("aria-current", "page");

  async function request(path, options) {
    const response = await fetch(path, { cache: "no-store", ...options });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Запрос не выполнен.");
    return body;
  }

  const read = () => Object.fromEntries(fields.map((field) => [field.id, field.value]));
  const escaped = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  function httpsUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch { return ""; }
  }

  function emailHtml(data, preview = false) {
    const image = httpsUrl(data.image);
    const url = httpsUrl(data.ctaUrl);
    const paragraphs = data.emailBody.trim().split(/\n\s*\n/).map((part) =>
      `<p style="margin:0 0 16px">${escaped(part).replace(/\n/g, "<br>")}</p>`).join("");
    return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escaped(data.subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f5f0">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escaped(data.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f5f0"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;color:#171814;font:16px/1.5 Arial,sans-serif">
<tr><td style="padding:28px"><p style="margin:0 0 16px;font-weight:bold">#Sekta</p>
<h1 style="margin:0 0 20px;font-size:28px;line-height:1.2">${escaped(data.heading)}</h1>
${image ? preview ? `<p style="padding:16px;background:#eee">Изображение · ${escaped(data.imageAlt || "без описания")}</p>` : `<img src="${escaped(image)}" alt="${escaped(data.imageAlt)}" width="544" style="display:block;width:100%;max-width:544px;height:auto;margin:0 0 20px">` : ""}
${paragraphs}
${url && data.cta.trim() ? `<a href="${preview ? "#preview" : escaped(url)}" style="display:inline-block;background:#171814;color:#fff;padding:12px 20px;text-decoration:none">${escaped(data.cta)}</a>` : ""}
</td></tr></table></td></tr></table></body></html>`;
  }

  const threadParts = (body) => body.split(/^\s*---\s*$/m).map((part) => part.trim()).filter(Boolean);
  const length = (value) => Array.from(value).length;
  const maxLength = (value) => Math.max(100, Math.min(1000, Number(value) || 500));

  function splitPart(part, limit) {
    const parts = [];
    let current = "";
    for (const token of part.match(/\S+\s*/gu) || []) {
      if (current && length(current + token) > limit) {
        parts.push(current.trim());
        current = "";
      }
      const chars = Array.from(token);
      while (chars.length > limit) parts.push(chars.splice(0, limit).join("").trim());
      current += chars.join("");
    }
    if (current.trim()) parts.push(current.trim());
    return parts.filter(Boolean);
  }

  function render() {
    const data = read();
    if (isEmail) {
      find("emailPreview").srcdoc = emailHtml(data, true);
      return;
    }
    const limit = maxLength(data.limit);
    const items = threadParts(data.threadsBody).map((part) => {
      const item = document.createElement("li");
      const counter = document.createElement("small");
      const size = length(part);
      counter.textContent = `${size} / ${limit}${size > limit ? " · сократите текст" : ""}`;
      item.append(part, counter);
      return item;
    });
    find("threadsPreview").replaceChildren(...items);
  }

  function fillDraft(draft) {
    id = draft?.id || null;
    revision = draft?.revision || null;
    find("title").value = draft?.title || "";
    fields.forEach((field) => {
      const fallback = field instanceof HTMLSelectElement ? field.options[0].value : field.defaultValue;
      field.value = draft?.document[field.id] ?? fallback;
    });
  }

  function element(tag, value) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function action(label, handler) {
    const button = element("button", label);
    button.type = "button";
    button.addEventListener("click", handler);
    return button;
  }

  const asDate = (value) => new Date(value + "T12:00:00Z");
  const dayKey = (date) => date.toISOString().slice(0, 10);

  function shiftDay(date, days) {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
  }

  function monday(date) {
    return shiftDay(date, -((date.getUTCDay() + 6) % 7));
  }

  function renderCalendar() {
    if (isEmail) return;
    const start = monday(asDate(find("weekDate").value));
    if (!Number.isFinite(start.getTime())) return;
    const accountKey = find("calendarAccount").value;
    const account = accounts[accountKey];
    const byDay = new Intl.DateTimeFormat("ru", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = shiftDay(start, index);
      const key = dayKey(date);
      const column = element("section");
      column.append(element("h3", byDay.format(date)));
      for (const [slot, label] of Object.entries(slots)) {
        const cell = element("div");
        cell.className = "threads-slot";
        cell.append(element("strong", label));
        const matching = drafts.filter((draft) => draft.publishDate === key && draft.publishSlot === slot && draft.account === account);
        if (!matching.length) cell.append(action("+ Запланировать", () => {
          if (busy || (dirty && !confirm("Создать черновик для этого слота? Сначала можно сохранить текущий текст."))) return;
          fillDraft(null);
          draftSelect.value = "";
          find("account").value = account;
          find("publishDate").value = key;
          find("publishSlot").value = slot;
          find("themeAccount").value = accountKey;
          find("threadsBank").open = true;
          dirty = true;
          renderThemes();
          render();
          find("themeSearch").focus();
        }));
        for (const draft of matching) {
          cell.append(action(draft.title, () => {
            draftSelect.value = draft.id;
            openButton.click();
          }), element("small", stages[draft.editorialStatus] || stages.idea));
        }
        column.append(cell);
      }
      return column;
    });
    find("threadsCalendar").replaceChildren(...days);
  }

  function useTheme(theme, angle) {
    if (busy || (find("threadsBody").value.trim() && !confirm("Заменить текущий текст выбранной подачей?"))) return;
    const current = read();
    const account = theme.accounts.some((key) => accounts[key] === current.account) ? current.account : accounts[theme.accounts[0]] || "";
    find("title").value = theme.title;
    find("account").value = account;
    find("threadsBody").value = theme[angle];
    find("themeId").value = theme.id;
    dirty = true;
    render();
    status.textContent = theme.kind === "Sekta Science" ? "Тема добавлена. Проверьте фактуру с экспертом перед публикацией." : "Подача добавлена в черновик.";
    find("threadsBody").focus();
  }

  function renderThemes() {
    const query = find("themeSearch").value.trim().toLocaleLowerCase("ru");
    const account = find("themeAccount").value;
    const category = find("themeKind").value;
    const matching = themes.filter((theme) => (!account || theme.accounts.includes(account))
      && (!category || theme.kind === category)
      && (!query || [theme.title, theme.summary, theme.kind, theme.fact].join(" ").toLocaleLowerCase("ru").includes(query)));
    find("themeCount").textContent = `Тем: ${matching.length} из ${themes.length}`;
    find("threadsThemes").replaceChildren(...matching.map((theme) => {
      const card = element("article");
      card.append(element("small", `${theme.kind} · ${theme.accounts.map((key) => accounts[key]).filter(Boolean).join(", ")}`),
        element("h3", theme.title), element("p", theme.summary));
      if (theme.fact) card.append(element("p", theme.fact));
      if (theme.source?.label) {
        const url = httpsUrl(theme.source.url || "");
        const source = element(url ? "a" : "small", theme.source.label);
        if (url) { source.href = url; source.target = "_blank"; source.rel = "noreferrer"; }
        card.append(source);
      }
      const angles = element("div");
      angles.className = "threads-angles";
      for (const [key, label] of Object.entries(angleLabels)) {
        const detail = element("details");
        detail.append(element("summary", label), element("p", theme[key]), action("В черновик", () => useTheme(theme, key)));
        angles.append(detail);
      }
      card.append(angles);
      return card;
    }));
  }

  function initThreads() {
    find("threadsDesk").hidden = false;
    const calendarAccount = find("calendarAccount");
    const themeAccount = find("themeAccount");
    themeAccount.add(new Option("Все", ""));
    for (const [key, label] of Object.entries(accounts)) {
      calendarAccount.add(new Option(label, key));
      themeAccount.add(new Option(label, key));
    }
    const dateField = find("weekDate");
    const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    dateField.value = dayKey(monday(asDate(today())));
    function navigate(delta) {
      const selected = dateField.value || today();
      dateField.value = dayKey(shiftDay(monday(asDate(selected)), delta));
      renderCalendar();
    }
    find("weekEarlier").addEventListener("click", () => navigate(-7));
    find("weekLater").addEventListener("click", () => navigate(7));
    find("weekToday").addEventListener("click", () => { dateField.value = today(); navigate(0); });
    dateField.addEventListener("change", () => navigate(0));
    calendarAccount.addEventListener("change", renderCalendar);
    find("themeSearch").addEventListener("input", renderThemes);
    themeAccount.addEventListener("change", renderThemes);
    find("themeKind").addEventListener("change", renderThemes);
    request("data/threads-desk-themes.json").then((data) => {
      themes = data;
      for (const kind of [...new Set(themes.map((theme) => theme.kind))].sort((a, b) => a.localeCompare(b, "ru"))) {
        find("themeKind").add(new Option(kind));
      }
      renderThemes();
    }).catch(() => { find("themeCount").textContent = "Банк тем не загрузился. Обновите страницу."; });
    renderCalendar();
  }

  async function refreshDrafts() {
    const { items } = await request(`/api/formats?kind=${kind}`);
    drafts = items;
    renderCalendar();
    const selected = draftSelect.value;
    draftSelect.replaceChildren(new Option("Новый черновик", ""), ...items.map((item) => new Option(item.title, item.id)));
    draftSelect.value = items.some((item) => item.id === (id || selected)) ? id || selected : "";
  }

  function setBusy(value) {
    busy = value;
    saveButton.disabled = openButton.disabled = importButton.disabled = value;
  }

  openButton.addEventListener("click", async () => {
    if (busy || (dirty && !confirm("Открыть другой черновик? Сначала можно сохранить или скачать текущий текст."))) return;
    setBusy(true);
    const selected = draftSelect.value;
    const before = JSON.stringify([find("title").value, read()]);
    try {
      const draft = selected ? await request(`/api/formats?kind=${kind}&id=${encodeURIComponent(selected)}`) : null;
      if (before !== JSON.stringify([find("title").value, read()])) return;
      fillDraft(draft);
      dirty = false;
      render();
      status.textContent = draft ? "Открыт общий черновик." : "Новый черновик.";
    } catch (error) { status.textContent = error.message; }
    finally { setBusy(false); }
  });

  saveButton.addEventListener("click", async () => {
    if (busy) return;
    const title = find("title").value.trim();
    if (!title) { status.textContent = "Укажите название черновика."; find("title").focus(); return; }
    const document = read();
    setBusy(true);
    try {
      const result = await request("/api/formats", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, revision, title, document }),
      });
      id = result.id;
      revision = result.revision;
      dirty = title !== find("title").value.trim() || JSON.stringify(document) !== JSON.stringify(read());
      status.textContent = dirty ? "Версия сохранена. Сохраните и последние правки." : "Черновик сохранён для команды.";
      await refreshDrafts().catch(() => { status.textContent += " Список не обновился."; });
    } catch (error) { status.textContent = error.message; }
    finally { setBusy(false); }
  });

  find("refreshDrafts").addEventListener("click", () => refreshDrafts().catch((error) => { status.textContent = error.message; }));
  find("splitThreads").addEventListener("click", () => {
    const data = read();
    const limit = maxLength(data.limit);
    find("threadsBody").value = threadParts(data.threadsBody)
      .flatMap((part) => length(part) > limit ? splitPart(part, limit) : [part]).join("\n\n---\n\n");
    dirty = true;
    render();
  });

  function download(payload, mime, extension) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([payload], { type: mime }));
    const stem = find("title").value.trim().replace(/[^\p{L}\p{N}-]+/gu, "-").slice(0, 120) || kind;
    link.download = `${stem}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  find("downloadDraft").addEventListener("click", () => {
    download(JSON.stringify({ kind, title: find("title").value.trim(), document: read() }, null, 2), "application/json", "json");
  });
  importButton.addEventListener("click", () => {
    if (!busy) importFile.click();
  });
  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    importFile.value = "";
    if (!file || busy || (dirty && !confirm("Заменить текущий текст копией из JSON?"))) return;
    const before = JSON.stringify([find("title").value, read()]);
    setBusy(true);
    try {
      if (file.size > 100000) throw new Error("Файл черновика больше 100 КБ.");
      const draft = JSON.parse(await file.text());
      if (draft?.kind !== kind || typeof draft.title !== "string" || draft.title.length > 160
        || !draft.document || typeof draft.document !== "object" || Array.isArray(draft.document)
        || Object.entries(draft.document).some(([key, value]) => {
          const field = fields.find((candidate) => candidate.id === key);
          const max = field instanceof HTMLSelectElement ? 12 : field?.maxLength > 0 ? field.maxLength : field?.type === "date" ? 10 : 4;
          return !field || typeof value !== "string" || value.length > max;
        })) throw new Error("Выберите JSON этого формата.");
      if (before !== JSON.stringify([find("title").value, read()])) return;
      fillDraft(draft);
      draftSelect.value = "";
      dirty = true;
      render();
      status.textContent = "Копия открыта. Её можно сохранить как новый общий черновик.";
    } catch (error) { status.textContent = error.message; }
    finally { setBusy(false); }
  });

  find("downloadFormat").addEventListener("click", () => {
    const data = read();
    const parts = isEmail ? [] : threadParts(data.threadsBody);
    if (isEmail && (!data.subject.trim() || !data.heading.trim() || !data.emailBody.trim())) {
      status.textContent = "Заполните тему, заголовок и текст письма."; return;
    }
    if (isEmail && ((data.image && (!httpsUrl(data.image) || !data.imageAlt.trim())) || (data.cta || data.ctaUrl) && (!data.cta.trim() || !httpsUrl(data.ctaUrl)))) {
      status.textContent = "Для изображения нужны HTTPS-ссылка и описание. Для кнопки нужны текст и HTTPS-ссылка."; return;
    }
    if (!isEmail && (!parts.length || parts.some((part) => length(part) > maxLength(data.limit)))) {
      status.textContent = "Добавьте текст и разбейте части, которые превышают лимит."; return;
    }
    const payload = isEmail ? emailHtml(data) : `${data.account ? data.account + "\n\n" : ""}${parts.join("\n\n---\n\n")}\n`;
    download(payload, isEmail ? "text/html;charset=utf-8" : "text/plain;charset=utf-8", isEmail ? "html" : "txt");
    status.textContent = isEmail ? "HTML скачан. В сервисе рассылки проверьте тему, подвал и ссылки." : "Текст треда скачан.";
  });

  for (const field of [find("title"), ...fields]) field.addEventListener("input", () => {
    dirty = true;
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 250);
  });
  window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
  if (!isEmail) initThreads();
  request("/api/me").then((user) => {
    saveButton.hidden = !["owner", "admin", "editor"].includes(user.role);
    return refreshDrafts();
  }).catch((error) => { status.textContent = error.message; });
  render();
})();
