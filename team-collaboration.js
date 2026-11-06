(() => {
  if (!location.pathname.startsWith("/editor/")) return;
  const find = (id) => document.getElementById(id);
  const panel = find("teamCommentsPanel");
  const body = find("teamCommentBody");
  const mention = find("teamMention");
  const list = find("teamCommentList");
  const more = find("teamCommentMore");
  const commentStatus = find("teamCommentStatus");
  const upload = find("teamMediaUpload");
  const fileInput = find("teamMediaFile");
  const drop = find("teamMediaDrop");
  let droppedFile = null;
  const mediaStatus = find("teamMediaStatus");
  let seriesId = null;
  let next = null;
  let listRequest = 0;
  let posting = false;

  async function request(url, options) {
    const response = await fetch(url, { cache: "no-store", ...options });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Запрос не выполнен.");
    return result;
  }

  function currentSeries() {
    let series;
    window.dispatchEvent(new CustomEvent("sekta:team-get-series", { detail: { receive: (value) => { series = value; } } }));
    return series;
  }

  function addComment(comment, slides) {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const text = document.createElement("p");
    const index = slides.findIndex((slide) => slide.id === comment.slideId);
    const target = comment.slideId ? index >= 0 ? `слайд ${index + 1}` : "слайд из другой версии" : "серия";
    title.textContent = `${comment.authorName} · ${target} · ${new Date(comment.createdAt).toLocaleString("ru-RU")}`;
    // Mentions are visible to the team in the thread. They do not send notifications.
    for (const part of comment.body.split(/(@[^\s@<>]+@[^\s@<>]+|@[\p{L}\p{N}_.-]+)/u)) {
      if (part.startsWith("@")) {
        const mention = document.createElement("b");
        mention.textContent = part;
        text.append(mention);
      } else text.append(part);
    }
    item.append(title, text);
    list.append(item);
  }

  async function refreshComments(append = false) {
    if (!seriesId) return;
    const token = ++listRequest;
    more.disabled = true;
    try {
      const page = append && next ? `?before=${encodeURIComponent(next)}` : "";
      const result = await request(`/api/series/${seriesId}/comments${page}`);
      if (token !== listRequest) return;
      if (!append) list.replaceChildren();
      const slides = currentSeries()?.slides || [];
      result.items.forEach((comment) => addComment(comment, slides));
      next = result.next;
      more.hidden = !next;
      commentStatus.textContent = list.children.length ? "" : "Комментариев пока нет.";
    } catch (error) {
      if (token === listRequest) commentStatus.textContent = error.message;
    } finally {
      if (token === listRequest) more.disabled = false;
    }
  }

  async function postComment(forSlide) {
    const id = seriesId;
    const message = body.value.trim();
    if (!id || posting || !message) return;
    const series = forSlide ? currentSeries() : null;
    const slide = series?.slides[series.activeSlide];
    if (forSlide && !slide?.id) { commentStatus.textContent = "Выберите слайд."; return; }
    posting = true;
    try {
      await request(`/api/series/${id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: message, slideId: slide?.id ?? null }),
      });
      if (id !== seriesId) return;
      if (body.value.trim() === message) body.value = "";
      await refreshComments();
    } catch (error) {
      if (id === seriesId) commentStatus.textContent = error.message;
    } finally { posting = false; }
  }

  function addMedia(items) {
    window.dispatchEvent(new CustomEvent("sekta:team-media", { detail: items.map((item) => {
      const url = `/api/media/${item.id}`;
      return { id: `team-${item.id}`, fileName: item.name, thumb: `${url}?preview`, originalUrl: url,
        folderLabel: "Фото команды", sourceCategory: item.credit, contentThemes: item.tags.split(/,\s*/), mediaType: "photo" };
    }) }));
  }

  window.addEventListener("sekta:team-role", (event) => {
    const role = event.detail;
    const canEdit = ["owner", "admin", "editor"].includes(role);
    const canComment = canEdit || role === "reviewer";
    find("teamCommentComposer").hidden = !canComment;
    if (canComment) request("/api/mentions").then(({ members }) => {
      members.forEach(({ name, email }) => mention.add(new Option(name || email, email)));
    }).catch(() => { mention.disabled = true; });
    find("teamMediaPanel").hidden = !canEdit;
    request("/api/media").then(({ items }) => addMedia(items)).catch((error) => { mediaStatus.textContent = error.message; });
  });
  window.addEventListener("sekta:team-series", (event) => {
    seriesId = event.detail;
    listRequest += 1;
    next = null;
    body.value = "";
    list.replaceChildren();
    more.hidden = true;
    panel.hidden = !seriesId;
    if (seriesId) void refreshComments();
  });
  mention.addEventListener("change", () => {
    if (!mention.value) return;
    const token = `@${mention.value} `;
    if (body.value.length + token.length + 1 <= body.maxLength) {
      body.value += `${body.value && !/\s$/.test(body.value) ? " " : ""}${token}`;
      body.focus();
    }
    mention.value = "";
  });
  find("teamCommentPost").addEventListener("click", () => void postComment(false));
  find("teamCommentSlide").addEventListener("click", () => void postComment(true));
  find("teamCommentRefresh").addEventListener("click", () => void refreshComments());
  more.addEventListener("click", () => void refreshComments(true));

  async function makePreview(file) {
    const image = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    try {
      const scale = Math.min(1, 480 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .8));
      if (!blob) throw new Error("Не удалось создать превью.");
      return blob;
    } finally {
      image.close();
      canvas.width = canvas.height = 0;
    }
  }

  fileInput.addEventListener("change", () => { droppedFile = null; mediaStatus.textContent = ""; });
  drop.addEventListener("dragover", (event) => event.preventDefault());
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    if (upload.disabled) return;
    droppedFile = event.dataTransfer?.files[0] || null;
    if (droppedFile) {
      fileInput.value = "";
      mediaStatus.textContent = `Выбрано фото: ${droppedFile.name}`;
    }
  });
  find("teamMediaRefresh").addEventListener("click", async () => {
    try {
      addMedia((await request("/api/media")).items);
      mediaStatus.textContent = "Медиатека обновлена.";
    } catch (error) { mediaStatus.textContent = error.message; }
  });

  upload.addEventListener("click", async () => {
    const file = droppedFile || fileInput.files?.[0];
    const tags = find("teamMediaTags");
    const credit = find("teamMediaCredit");
    if (!file || file.size > 5_000_000 || !credit.value.trim()) {
      mediaStatus.textContent = "Выберите фото до 5 МБ и укажите источник или разрешение.";
      return;
    }
    upload.disabled = true;
    try {
      const data = new FormData();
      data.set("photo", file, file.name);
      data.set("tags", tags.value);
      data.set("credit", credit.value);
      data.set("preview", await makePreview(file), "preview.jpg");
      const item = await request("/api/media", { method: "POST", body: data });
      addMedia([item]);
      fileInput.value = "";
      droppedFile = null;
      tags.value = "";
      credit.value = "";
      mediaStatus.textContent = "Фото доступно в редакторе. Найдите его по названию или тегам.";
    } catch (error) { mediaStatus.textContent = error.message; }
    finally { upload.disabled = false; }
  });
})();
