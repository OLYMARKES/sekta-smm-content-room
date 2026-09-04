(() => {
  const labels = { export: "экспортная копия", original: "оригинал", preview: "превью" };

  function candidates(item) {
    const seen = new Set();
    return [
      ["export", item?.exportImage],
      ["original", item?.originalResolution?.remoteUrl],
      ["original", item?.originalUrl],
      ["preview", item?.thumb],
    ].flatMap(([kind, value]) => {
      if (typeof value !== "string" || !value.trim()) return [];
      try {
        const url = new URL(value, document.baseURI);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || seen.has(url.href)) return [];
        seen.add(url.href);
        return [{ kind, url: url.href, label: labels[kind] }];
      } catch {
        return [];
      }
    });
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const finish = (error) => {
        clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
        if (error) {
          image.removeAttribute("src");
          reject(error);
        } else resolve({ ...source, image });
      };
      const timeout = setTimeout(() => finish(new Error("Источник не ответил за 15 секунд.")), 15000);
      image.crossOrigin = "anonymous";
      image.onload = () => finish(image.naturalWidth && image.naturalHeight ? null : new Error("У изображения нет размеров."));
      image.onerror = () => finish(new Error("Изображение недоступно для экспорта. Проверьте ссылку, доступ и CORS."));
      image.src = source.url;
    });
  }

  async function loadForExport(item, { previewOnly = false, confirmPreview = () => false } = {}) {
    const sources = candidates(item);
    const originals = sources.filter((source) => source.kind !== "preview");
    const preview = candidates({ thumb: item?.thumb })[0];
    if (!previewOnly) {
      for (const source of originals) {
        try { return await loadImage(source); } catch { /* Try the next declared source, never an invented URL. */ }
      }
      if (preview) {
        const message = originals.length
          ? "Исходник не загрузился: возможна ошибка ссылки, доступа или CORS. Скачать PNG из превью с ограниченным качеством?"
          : "Для этого фото нет ссылки на исходник. Скачать PNG из превью с ограниченным качеством?";
        if (!confirmPreview(message)) throw new Error("Экспорт отменён. Превью не использовано вместо исходника.");
      }
    }
    if (!preview) throw new Error("Нет доступного изображения. Откройте приложение по HTTP(S) и выберите фото с доступной ссылкой.");
    return loadImage(preview);
  }

  window.SEKTA_MEDIA_SOURCE = { candidates, loadForExport };
})();
