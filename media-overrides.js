(() => {
  // Keep the existing storage format; pendingFields is optional for older records.
  function create({ getStorage, key, write }) {
    let records = {};
    let lastRaw = null;
    let unreadable = false;
    let syncTail = Promise.resolve();

    try {
      lastRaw = getStorage().getItem(key);
      if (lastRaw !== null) {
        const saved = JSON.parse(lastRaw);
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Invalid records");
        records = saved;
      }
    } catch {
      unreadable = true;
    }

    function get(id) {
      return Object.hasOwn(records, id) ? records[id] : undefined;
    }

    function availableFields(record) {
      const fields = [];
      if (Array.isArray(record?.people)) fields.push("people");
      if (typeof record?.top === "boolean") fields.push("top");
      return fields;
    }

    function pendingFields(record) {
      if (!record?.pending) return [];
      const available = availableFields(record);
      return Array.isArray(record.pendingFields)
        ? available.filter((field) => record.pendingFields.includes(field))
        : available;
    }

    function unchangedStorage() {
      if (unreadable) throw new Error("Локальные правки не удалось прочитать. Они не перезаписаны. Восстановите доступ к хранилищу и перезагрузите страницу.");
      let storage;
      let current;
      try {
        storage = getStorage();
        current = storage.getItem(key);
      } catch {
        throw new Error("Хранилище браузера недоступно. Изменение не сохранено.");
      }
      if (current !== lastRaw) throw new Error("Правки медиатеки изменены в другой вкладке. Скопируйте введённые имена и перезагрузите страницу перед сохранением.");
      return storage;
    }

    function commit(next) {
      const storage = unchangedStorage();
      const serialized = JSON.stringify(next);
      try {
        storage.setItem(key, serialized);
      } catch {
        throw new Error("Не удалось записать правку в браузере. Возможно, хранилище заполнено. Изменение не сохранено.");
      }
      records = next;
      lastRaw = serialized;
    }

    function storageError() {
      try { unchangedStorage(); return ""; } catch (error) { return error.message; }
    }

    function stage(id, patch) {
      if (typeof id !== "string" || !id || !patch) throw new Error("Не указан материал или правка.");
      const fields = availableFields(patch);
      if (!fields.length) throw new Error("Нет имён или отметки для сохранения.");
      if (fields.includes("people") && (patch.people.length > 12 || patch.people.some((name) => typeof name !== "string" || name.length > 80))) {
        throw new Error("Можно указать до 12 имён, каждое не длиннее 80 символов.");
      }
      const previous = get(id);
      const next = { ...previous, pending: true, updatedAt: new Date().toISOString(),
        pendingFields: [...new Set([...pendingFields(previous), ...fields])] };
      for (const field of fields) next[field] = field === "people" ? [...patch.people] : patch.top;
      // Only change in-memory state after the durable write succeeds.
      commit({ ...records, [id]: next });
    }

    function sync(id) {
      const task = syncTail.then(async () => {
        const snapshot = get(id);
        const fields = pendingFields(snapshot);
        if (!fields.length) return true;
        unchangedStorage();
        const patch = {};
        for (const field of fields) patch[field] = field === "people" ? [...snapshot.people] : snapshot.top;
        await write(id, patch);
        // A response to an old request must not acknowledge a newer local edit.
        if (get(id) !== snapshot) return false;
        commit({ ...records, [id]: { ...snapshot, pending: false, pendingFields: [] } });
        return true;
      });
      // Serialize foreground edits and startup retries; a rejection must not stall the queue.
      syncTail = task.catch(() => {});
      return task;
    }

    return { get, stage, sync, storageError, pendingIds: () => Object.keys(records).filter((id) => pendingFields(get(id)).length) };
  }

  window.SEKTA_MEDIA_OVERRIDES = { create };
})();
