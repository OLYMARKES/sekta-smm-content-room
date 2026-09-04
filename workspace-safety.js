(() => {
  // Escaping HTML does not make an arbitrary URL safe for navigation.
  function safeLink(value, base = document.baseURI) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value, base);
      const local = new URL(base);
      if (url.username || url.password) return "";
      if (url.protocol !== "https:" && !(url.protocol === "http:" && url.origin === local.origin)) return "";
      return url.href;
    } catch { return ""; }
  }

  function safeImage(value) {
    if (typeof value !== "string") return "";
    // Generated covers are raster data URLs, never SVG or HTML documents.
    if (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value)) return value;
    return safeLink(value);
  }

  function normalizeSandbox(value) {
    if (!Array.isArray(value) || value.length > 9) throw new Error("Некорректная сетка.");
    return value.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item) ||
          !["id", "title", "source", "thumb"].every((key) => typeof item[key] === "string") ||
          !item.id || item.id.length > 2000 || item.title.length > 100000 ||
          item.source.length > 2000 || !safeImage(item.thumb)) throw new Error("Некорректный материал сетки.");
      return { id: item.id, title: item.title, source: item.source, thumb: safeImage(item.thumb) };
    });
  }

  function createSandbox({ getStorage, fallback, key = "sekta-sandbox" }) {
    let raw = null;
    let unreadable = false;
    let items = normalizeSandbox(fallback);
    try {
      raw = getStorage().getItem(key);
      if (raw !== null) items = normalizeSandbox(JSON.parse(raw));
    } catch { unreadable = true; }

    function storage() {
      if (unreadable) throw new Error("Сетку не удалось прочитать. Сохранённая копия не перезаписана. Восстановите доступ к хранилищу и перезагрузите страницу.");
      let target;
      let current;
      try { target = getStorage(); current = target.getItem(key); }
      catch { throw new Error("Хранилище браузера недоступно. Сетка не изменена."); }
      if (current !== raw) throw new Error("Сетка изменена в другой вкладке. Перезагрузите страницу перед редактированием.");
      return target;
    }
    function commit(next) {
      const normalized = normalizeSandbox(next);
      const target = storage();
      const serialized = JSON.stringify(normalized);
      try { target.setItem(key, serialized); }
      catch { throw new Error("Не удалось сохранить сетку: хранилище недоступно или заполнено. Предыдущая сетка сохранена; скачайте новую обложку отдельно."); }
      raw = serialized;
      items = normalized;
      return get();
    }
    function get() { return items.map((item) => ({ ...item })); }
    function error() { try { storage(); return ""; } catch (failure) { return failure.message; } }
    return { get, commit, error };
  }

  window.SEKTA_WORKSPACE_SAFETY = { safeLink, safeImage, normalizeSandbox, createSandbox };
})();
