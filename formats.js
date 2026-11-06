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
  const fields = (isEmail ? ["subject", "preheader", "heading", "image", "imageAlt", "emailBody", "cta", "ctaUrl"] : ["account", "threadsBody", "limit"]).map(find);
  let id = null;
  let revision = null;
  let dirty = false;
  let busy = false;
  let renderTimer;

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

  async function refreshDrafts() {
    const { items } = await request(`/api/formats?kind=${kind}`);
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
      id = draft?.id || null;
      revision = draft?.revision || null;
      find("title").value = draft?.title || "";
      fields.forEach((field) => { field.value = draft?.document[field.id] ?? field.defaultValue; });
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
          return !field || typeof value !== "string" || value.length > (field.maxLength > 0 ? field.maxLength : 4);
        })) throw new Error("Выберите JSON этого формата.");
      if (before !== JSON.stringify([find("title").value, read()])) return;
      id = revision = null;
      draftSelect.value = "";
      find("title").value = draft.title;
      fields.forEach((field) => { field.value = draft.document[field.id] ?? field.defaultValue; });
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
  request("/api/me").then((user) => {
    saveButton.hidden = !["owner", "admin", "editor"].includes(user.role);
    return refreshDrafts();
  }).catch((error) => { status.textContent = error.message; });
  render();
})();
