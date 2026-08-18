(() => {
  const source = window.SEKTA_LIBRARY || { items: [] };
  const items = Array.isArray(source.items) ? source.items : [];
  const categories = [...new Set(items.map((item) => item.folderLabel || item.sourceCategory || "Медиатека"))].sort((a, b) => a.localeCompare(b, "ru"));

  window.OLYMARKES_MEDIA_LIBRARY = {
    generatedAt: source.generatedAt || new Date().toISOString(),
    total: items.length,
    categories,
    photos: items.map((item) => ({
      id: item.id,
      name: String(item.fileName || item.id).replace(/\.[^.]+$/, ""),
      category: item.folderLabel || item.sourceCategory || "Медиатека",
      src: `../${item.thumb}`,
    })),
  };
})();
