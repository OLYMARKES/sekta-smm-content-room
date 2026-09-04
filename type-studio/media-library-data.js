(() => {
  const source = window.SEKTA_LIBRARY || { items: [] };
  const items = (Array.isArray(source.items) ? source.items : [])
    .filter((item) => item && item.mediaType !== "video" && item.publicationStatus !== "not-public" && typeof item.thumb === "string");
  const categories = [...new Set(items.map((item) => item.folderLabel || item.sourceCategory || "Медиатека"))].sort((a, b) => a.localeCompare(b, "ru"));

  window.OLYMARKES_MEDIA_LIBRARY = {
    generatedAt: source.generatedAt || new Date().toISOString(),
    total: items.length,
    categories,
    photos: items.map((item) => ({
      id: item.id,
      name: String(item.fileName || item.id).replace(/\.[^.]+$/, ""),
      category: item.folderLabel || item.sourceCategory || "Медиатека",
      src: /^(?:https?:)?\/\//i.test(item.thumb) ? item.thumb : `../${item.thumb}`,
    })),
  };
})();
