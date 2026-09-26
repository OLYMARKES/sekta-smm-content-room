(() => {
  if (!location.pathname.startsWith("/editor/")) return;
  const button = document.querySelector("#carouselSaveToTeam");
  const status = document.querySelector("#carouselStudioStatus");
  const teamLink = document.querySelector("#carouselTeamLink");
  if (!button || !status || !teamLink) return;
  teamLink.hidden = false;
  let remoteId = null;
  let revision = null;
  let dirty = true;
  let saving = false;
  let changeSerial = 0;
  let identitySerial = 0;

  function setStatus(message) { status.textContent = message; }
  function updateButton() {
    button.disabled = saving || Boolean(remoteId && !dirty);
    button.textContent = saving ? "Сохраняем…" : remoteId && !dirty ? "Сохранено в команде" : "Сохранить в команде";
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
  window.addEventListener("sekta:team-dirty", () => { changeSerial += 1; dirty = true; updateButton(); });
  window.addEventListener("sekta:team-detach", () => {
    identitySerial += 1;
    remoteId = null;
    revision = null;
    dirty = true;
    history.replaceState(null, "", location.pathname);
    updateButton();
    setStatus("Новая локальная серия. Сохраните её в команде, когда будете готовы.");
  });
  request("/api/me").then((user) => {
    button.hidden = !["owner", "admin", "editor"].includes(user.role);
    if (button.hidden) setStatus("Серия доступна для просмотра. Изменять общую версию может редактор.");
    updateButton();
  }).catch(() => setStatus("Не удалось подтвердить доступ к команде. Вернитесь в командную комнату."));
  button.addEventListener("click", async () => {
    if (saving) return;
    const document = getSeries();
    if (!document) { setStatus("Редактор ещё не готов. Попробуйте снова."); return; }
    const submittedSerial = changeSerial;
    const submittedIdentity = identitySerial;
    saving = true;
    updateButton();
    try {
      const response = remoteId
        ? await request(`/api/series/${encodeURIComponent(remoteId)}`, { method: "PUT", body: JSON.stringify({ revision, document }) })
        : await request("/api/series", { method: "POST", body: JSON.stringify(document) });
      if (identitySerial !== submittedIdentity) {
        setStatus("Предыдущая серия сохранена в команде. Новая серия осталась локальной — сохраните её отдельно.");
        return;
      }
      remoteId = response.id;
      revision = response.revision;
      dirty = changeSerial !== submittedSerial;
      history.replaceState(null, "", `${location.pathname}?team=${encodeURIComponent(remoteId)}`);
      setStatus(dirty ? "Версия сохранена в команде. Новые правки ещё локальны — сохраните их повторно." : "Серия сохранена для команды. Коллеги увидят эту версию в общих материалах.");
    } catch (error) {
      if (error.status === 409) setStatus("Коллега уже изменил серию или она опубликована. Экспортируйте свою версию в JSON, затем откройте актуальную серию из команды.");
      else setStatus(error.message || "Не удалось сохранить серию в команде.");
    } finally { saving = false; updateButton(); }
  });

  const id = new URLSearchParams(location.search).get("team");
  if (!id) { updateButton(); return; }
  const loadingIdentity = identitySerial;
  request(`/api/series/${encodeURIComponent(id)}`).then((remote) => {
    if (identitySerial !== loadingIdentity) return;
    window.dispatchEvent(new CustomEvent("sekta:team-open-series", { detail: {
      document: remote.document,
      receive(accepted, error) {
        if (!accepted) { setStatus(error || "Общая серия не открыта. Локальный черновик сохранён."); return; }
        remoteId = remote.id;
        revision = remote.revision;
        dirty = false;
        updateButton();
      },
    } }));
  }).catch((error) => setStatus(error.message || "Не удалось открыть общую серию."));
  updateButton();
})();
