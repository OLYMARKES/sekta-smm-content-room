(() => {
  // Read only this product's known keys, never the whole shared origin's storage.
  const keys = Object.freeze([
    "sekta-sandbox", "sekta-media-people-overrides-v1", "sekta-cover-builder-draft-v1",
    "olymarkes-cyrillic-font-taste-v1", "olymarkes-cover-builder-v1",
    "olymarkes-type-case-mode-v1", "olymarkes-text-layout-prefs-v1", "olymarkes-type-studio-picker-v1",
  ]);

  function collect({ getStorage, origin, coverDraft = null }) {
    const storage = getStorage();
    const entries = keys.map((key) => ({ key, raw: storage.getItem(key) }));
    // Keep raw strings, including damaged JSON, so a backup cannot erase evidence.
    for (const entry of entries) {
      if (entry.raw !== null && typeof entry.raw !== "string") throw new Error("Некорректный ответ хранилища.");
      if (storage.getItem(entry.key) !== entry.raw) throw new Error("Данные изменились в другой вкладке во время чтения. Повторите скачивание.");
    }
    return { schema: "sekta-local-backup", version: 1, createdAt: new Date().toISOString(), origin, entries, coverDraft };
  }

  window.SEKTA_WORKSPACE_BACKUP = { collect };
  const button = document.querySelector("#exportWorkspaceBackup");
  if (!button) return;
  const status = document.querySelector("#workspaceBackupStatus");
  button.addEventListener("click", () => {
    let url;
    let link;
    try {
      const detail = { coverDraft: null };
      window.dispatchEvent(new CustomEvent("sekta:collect-cover-draft", { detail }));
      const backup = collect({ getStorage: () => localStorage, origin: location.origin, coverDraft: detail.coverDraft });
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
      if (blob.size > 20 * 1024 * 1024) throw new Error("Копия больше 20 МБ. Скачайте черновик отдельно в конструкторе.");
      url = URL.createObjectURL(blob);
      link = document.createElement("a");
      link.href = url;
      link.download = `sekta-local-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.append(link);
      link.click();
      status.textContent = "JSON подготовлен к скачиванию. В нём есть имена и черновики — храните приватно. Автовосстановления пока нет.";
    } catch (error) {
      status.textContent = `Копия не создана: ${error.message || "хранилище недоступно"}. Текущую обложку можно скачать через «Экспорт JSON» в конструкторе.`;
    } finally {
      link?.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
})();
