(() => {
  const payload = window.SEKTA_GRID_DIRECTIONS;
  if (!payload) return;

  const tasteKey = "sekta-grid-direction-choice-v1";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const ui = {
    rail: document.querySelector("#identityDirectionRail"),
    grid: document.querySelector("#identityGrid"),
    detail: document.querySelector("#identityDetail"),
    compare: document.querySelector("#identityCompare"),
    profileStatus: document.querySelector("#identityProfileStatus")
  };
  if (!ui.rail || !ui.grid || !ui.detail || !ui.compare) return;

  let activeId = localStorage.getItem(tasteKey) || "tempo-signal";
  if (!payload.directions.some((item) => item.id === activeId)) activeId = "tempo-signal";

  function cover(post, direction, compact = false) {
    const words = post.headline.split(" ");
    const splitAt = Math.max(1, Math.ceil(words.length / 2));
    const lineOne = words.slice(0, splitAt).join(" ");
    const lineTwo = words.slice(splitAt).join(" ");
    return `<article class="identity-cover identity-cover-${escapeHtml(post.layout)}${compact ? " is-compact" : ""}" data-post="${escapeHtml(post.id)}">
      <img src="${escapeHtml(post.image)}" alt="" loading="lazy">
      <span class="identity-cover-wash"></span>
      <span class="identity-cover-label">${escapeHtml(post.label)}</span>
      <strong><span>${escapeHtml(lineOne)}</span>${lineTwo ? `<span>${escapeHtml(lineTwo)}</span>` : ""}</strong>
      <small>#sekta</small>
    </article>`;
  }

  function gridMarkup(direction, compact = false) {
    return `<div class="identity-feed-grid${compact ? " identity-feed-grid-compact" : ""}" data-direction="${escapeHtml(direction.id)}" style="--identity-head:'${escapeHtml(direction.headlineFont)}';--identity-body:'${escapeHtml(direction.bodyFont)}';--c1:${direction.palette[0]};--c2:${direction.palette[1]};--c3:${direction.palette[2]};--paper:${direction.palette[3]};--ink:${direction.palette[4]};--field-text:${direction.fieldText};--plate-text:${direction.plateText};--signal-text:${direction.signalText}">${payload.posts.map((post) => cover(post, direction, compact)).join("")}</div>`;
  }

  function renderRail() {
    ui.rail.innerHTML = payload.directions.map((direction) => `<button type="button" class="identity-direction${direction.id === activeId ? " is-active" : ""}" data-identity-direction="${escapeHtml(direction.id)}" aria-pressed="${direction.id === activeId}">
      <span>${direction.number}</span><span><strong>${escapeHtml(direction.name)}</strong><small>${escapeHtml(direction.descriptor)}</small></span><i style="--chip:${direction.palette[0]}"></i>
    </button>`).join("") + '<span class="identity-rail-cue" aria-hidden="true">4 режима цвета</span>';
  }

  function renderDetail(direction) {
    const saved = localStorage.getItem(tasteKey) === direction.id;
    ui.detail.innerHTML = `<div class="identity-detail-head">
      <div><span>Направление ${direction.number}</span><h2>${escapeHtml(direction.name)}</h2><p>${escapeHtml(direction.thesis)}</p></div>
      <div class="identity-palette" aria-label="Цветовые роли направления">${direction.palette.map((color, index) => `<span class="identity-color-role"><i style="--swatch:${color}" title="${color}"></i><b>${escapeHtml(direction.paletteLabels[index])}</b></span>`).join("")}</div>
    </div>
    <div class="identity-type-pair"><span>Пара</span><strong style="font-family:'${escapeHtml(direction.headlineFont)}'">${escapeHtml(direction.headlineFont)}</strong><b>×</b><strong style="font-family:'${escapeHtml(direction.bodyFont)}'">${escapeHtml(direction.bodyFont)}</strong><small>${escapeHtml(direction.register)}</small></div>
    <div class="identity-brightness"><span>Яркость системы</span><div><i style="--level:${direction.brightness}%"></i></div><strong>${direction.brightness}%</strong></div>
    <div class="identity-contrast-recipes"><span>Контрастные пары</span><div>${direction.contrastRecipes.map((recipe) => `<b>${escapeHtml(recipe)}</b>`).join("")}</div></div>
    <dl class="identity-facts"><div><dt>Ритм девятки</dt><dd>${escapeHtml(direction.rhythm)}</dd></div><div><dt>Лучше всего</dt><dd>${escapeHtml(direction.goodFor)}</dd></div><div><dt>Риск</dt><dd>${escapeHtml(direction.risk)}</dd></div></dl>
    <div class="identity-rules"><h3>Правила, которые повторяем</h3><ol>${direction.rules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ol></div>
    <button class="button ${saved ? "button-primary" : "button-secondary"} identity-save" type="button" data-save-identity="${escapeHtml(direction.id)}">${saved ? "Кандидат отмечен" : "Отметить кандидатом"}</button>`;
  }

  function renderCompare() {
    ui.compare.innerHTML = payload.directions.map((direction) => `<div class="identity-compare-card${direction.id === activeId ? " is-active" : ""}" data-identity-direction="${escapeHtml(direction.id)}" role="button" tabindex="0" aria-label="Открыть цветовой режим ${escapeHtml(direction.name)}" aria-pressed="${direction.id === activeId}">
      <span class="identity-compare-title"><b>${direction.number}</b><strong>${escapeHtml(direction.name)}</strong><small>${escapeHtml(direction.headlineFont)} × ${escapeHtml(direction.bodyFont)}</small></span>
      <div aria-hidden="true">${gridMarkup(direction, true)}</div>
    </div>`).join("");
  }

  function render() {
    const focusedDirection = document.activeElement?.dataset?.identityDirection;
    const focusedSurface = document.activeElement?.classList.contains("identity-compare-card") ? "compare" : document.activeElement?.classList.contains("identity-direction") ? "rail" : null;
    const saveHadFocus = document.activeElement?.classList.contains("identity-save");
    const direction = payload.directions.find((item) => item.id === activeId) || payload.directions[0];
    renderRail();
    ui.grid.outerHTML = gridMarkup(direction).replace("identity-feed-grid\"", "identity-feed-grid\" id=\"identityGrid\"");
    ui.grid = document.querySelector("#identityGrid");
    renderDetail(direction);
    renderCompare();
    if (focusedDirection && focusedSurface) {
      const selector = focusedSurface === "compare" ? `.identity-compare-card[data-identity-direction="${focusedDirection}"]` : `.identity-direction[data-identity-direction="${focusedDirection}"]`;
      document.querySelector(selector)?.focus({ preventScroll: true });
    } else if (saveHadFocus) {
      document.querySelector(".identity-save")?.focus({ preventScroll: true });
    }
  }

  document.addEventListener("click", (event) => {
    const directionButton = event.target.closest("[data-identity-direction]");
    if (directionButton) {
      activeId = directionButton.dataset.identityDirection;
      render();
      document.querySelector("#identityWorkspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const saveButton = event.target.closest("[data-save-identity]");
    if (saveButton) {
      localStorage.setItem(tasteKey, saveButton.dataset.saveIdentity);
      activeId = saveButton.dataset.saveIdentity;
      render();
    }
  });

  document.addEventListener("keydown", (event) => {
    const compareCard = event.target.closest(".identity-compare-card");
    if (compareCard && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      compareCard.click();
    }
  });

  fetch(payload.profile.source)
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("profile unavailable")))
    .then((profile) => {
      const usedFrames = payload.directions.flatMap((direction) => [direction.headlineFrame, direction.bodyFrame]);
      const missing = usedFrames.filter((key) => !profile.likedFrames.includes(key));
      ui.profileStatus.textContent = missing.length ? `Профиль загружен · ${profile.likedFrames.length} отметок · ${missing.length} пар требуют проверки` : `Профиль загружен · ${profile.likedFrames.length} отметок · все пары из любимых`;
      ui.profileStatus.dataset.state = missing.length ? "warning" : "ready";
    })
    .catch(() => {
      ui.profileStatus.textContent = "Четыре режима доступны · профиль не удалось перепроверить";
      ui.profileStatus.dataset.state = "warning";
    });

  render();
})();
