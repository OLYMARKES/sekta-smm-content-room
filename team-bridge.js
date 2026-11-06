(() => {
  if (!location.pathname.startsWith("/editor/")) return;
  const button = document.querySelector("#carouselSaveToTeam");
  const status = document.querySelector("#carouselStudioStatus");
  const teamLink = document.querySelector("#carouselTeamLink");
  if (!button || !status || !teamLink) return;
  teamLink.hidden = false;
  const id = new URLSearchParams(location.search).get("team");
  let loading = Boolean(id);
  let remoteStatus = null;
  let remoteId = null;
  let revision = null;
  let dirty = true;
  let saving = false;
  let changeSerial = 0;
  let identitySerial = 0;
  let canEdit = false;
  let blocked = false;
  let saveTimer;
  const state = document.querySelector("#carouselTeamSaveState");

  function setStatus(message) { status.textContent = message; }
  function updateButton() {
    button.disabled = loading || saving || Boolean(remoteId && !dirty);
    button.textContent = saving ? "Сохраняем…" : remoteId && !dirty ? "Сохранено в команде" : "Сохранить в команде";
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    if (canEdit && remoteId && dirty && !loading && !saving && !blocked && remoteStatus === "draft") {
      state.textContent = "Есть правки для команды";
      saveTimer = setTimeout(() => void save(), 1500);
    }
  }
  async function request(path, options) {
    const response = await fetch(path, { cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
    const body = await response.json();
    if (!response.ok) { const error = new Error(body.error || "Не удалось сохранить серию."); error.status = response.status; throw error; }
    return body;
  }
  function getSeries() {
    let document;
    window.dispatchEvent(new CustomEvent("sekta:team-get-series", { detail: { receive: (value) => { document = value; } } }));
    return document;
  }
  window.addEventListener("sekta:team-dirty", () => {
    changeSerial += 1;
    dirty = true;
    updateButton();
    if (canEdit && remoteId && remoteStatus !== "draft") state.textContent = "Правки локальны · сохраните вручную";
    scheduleSave();
  });
  window.addEventListener("sekta:team-detach", () => {
    identitySerial += 1;
    loading = false;
    remoteStatus = null;
    clearTimeout(saveTimer);
    blocked = false;
    state.textContent = "";
    window.dispatchEvent(new CustomEvent("sekta:team-series", { detail: null }));
    remoteId = null;
    revision = null;
    dirty = true;
    history.replaceState(null, "", location.pathname);
    updateButton();
    setStatus("Новая локальная серия. Сохраните её в команде, когда будете готовы.");
  });
  request("/api/me").then((user) => {
    canEdit = ["owner", "admin", "editor"].includes(user.role);
    button.hidden = !canEdit;
    window.dispatchEvent(new CustomEvent("sekta:team-role", { detail: user.role }));
    scheduleSave();
    if (button.hidden) setStatus("Серия доступна для просмотра. Изменять общую версию может редактор.");
    updateButton();
  }).catch(() => setStatus("Не удалось подтвердить доступ к команде. Вернитесь в командную комнату."));
  async function save() {
    clearTimeout(saveTimer);
    if (loading || saving || !canEdit || (remoteId && !dirty)) return;
    if (remoteId && remoteStatus !== "draft" && remoteStatus !== "published"
      && !confirm("Сохранить правки и вернуть серию в черновики? Затем её нужно отправить на ревью снова.")) return;
    const document = getSeries();
    if (!document) { setStatus("Редактор ещё не готов. Попробуйте снова."); return; }
    const submittedSerial = changeSerial;
    const submittedIdentity = identitySerial;
    saving = true;
    blocked = false;
    state.textContent = "Сохраняем для команды…";
    updateButton();
    try {
      const response = remoteId
        ? await request(`/api/series/${encodeURIComponent(remoteId)}`, { method: "PUT", body: JSON.stringify({ revision, document }) })
        : await request("/api/series", { method: "POST", body: JSON.stringify(document) });
      if (identitySerial !== submittedIdentity) {
        setStatus("Предыдущая серия сохранена в команде. Новая серия осталась локальной — сохраните её отдельно.");
        return;
      }
      const created = !remoteId;
      remoteId = response.id;
      revision = response.revision;
      remoteStatus = response.status;
      dirty = changeSerial !== submittedSerial;
      history.replaceState(null, "", `${location.pathname}?team=${encodeURIComponent(remoteId)}`);
      if (created) window.dispatchEvent(new CustomEvent("sekta:team-series", { detail: remoteId }));
      state.textContent = dirty ? "Есть правки для команды" : "Сохранено для команды";
    } catch (error) {
      if (identitySerial !== submittedIdentity) return;
      blocked = true;
      state.textContent = "Правки пока только в этом браузере";
      if (error.status === 409) setStatus("Коллега уже изменил серию или она опубликована. Экспортируйте свою версию в JSON, затем откройте актуальную серию из команды.");
      else setStatus(error.message || "Не удалось сохранить серию в команде.");
    } finally { saving = false; updateButton(); scheduleSave(); }
  }
  button.addEventListener("click", () => void save());

  window.addEventListener("beforeunload", (event) => {
    if (canEdit && (saving || (remoteId && dirty))) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  if (!id) { updateButton(); return; }
  const loadingIdentity = identitySerial;
  const loadingSerial = changeSerial;
  request(`/api/series/${encodeURIComponent(id)}`).then((remote) => {
    if (identitySerial !== loadingIdentity) return;
    if (changeSerial !== loadingSerial) {
      setStatus("Локальный черновик изменён во время загрузки. Скачайте его или откройте общую серию заново.");
      return;
    }
    window.dispatchEvent(new CustomEvent("sekta:team-open-series", { detail: {
      document: remote.document,
      receive(accepted, error) {
        if (!accepted) { setStatus(error || "Общая серия не открыта. Локальный черновик сохранён."); return; }
        remoteId = remote.id;
        revision = remote.revision;
        remoteStatus = remote.status;
        dirty = false;
        state.textContent = "Открыта общая версия";
        window.dispatchEvent(new CustomEvent("sekta:team-series", { detail: remoteId }));
        updateButton();
      },
    } }));
  }).catch((error) => {
    if (identitySerial === loadingIdentity) setStatus(error.message || "Не удалось открыть общую серию.");
  }).finally(() => {
    if (identitySerial !== loadingIdentity) return;
    loading = false;
    updateButton();
  });
  updateButton();
})();
