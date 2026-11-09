import apps from "../data/apps.json";
import "./styles.css";

const BASE = import.meta.env.BASE_URL;

const state = {
  query: "",
  category: "all",
};

function uniqueCategories(list) {
  return [...new Set(list.map((a) => a.category))].sort((a, b) =>
    a.localeCompare(b, "ko")
  );
}

function matchesQuery(app, q) {
  if (!q) return true;
  const haystack = [app.name, app.description, app.category, ...(app.tags || [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function filterApps() {
  return apps.filter((app) => {
    const catOk = state.category === "all" || app.category === state.category;
    return catOk && matchesQuery(app, state.query.trim());
  });
}

function iconUrl(app) {
  if (!app.icon) return null;
  return `${BASE}${app.icon.replace(/^\//, "")}`;
}

function renderCard(app) {
  const href = app.url;
  const icon = iconUrl(app);
  const iconMarkup = icon
    ? `<img class="card__icon" src="${icon}" alt="" width="72" height="72" loading="lazy" decoding="async" />`
    : `<div class="card__badge" aria-hidden="true"><span class="card__badge-text">맞춤법</span></div>`;

  const tagList =
    app.tags?.length &&
    `<ul class="card__tags" aria-label="태그">
      ${app.tags
        .slice(0, 4)
        .map((t) => `<li class="card__tag">${escapeHtml(t)}</li>`)
        .join("")}
    </ul>`;

  return `
    <article class="card">
      <a
        class="card__link"
        href="${escapeHtml(href)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="card__visual">${iconMarkup}</div>
        <div class="card__body">
          <span class="card__category">${escapeHtml(app.category)}</span>
          <h2 class="card__title">${escapeHtml(app.name)}</h2>
          <p class="card__desc">${escapeHtml(app.description)}</p>
          ${tagList || ""}
          <span class="card__cta">앱 열기<span class="card__external" aria-hidden="true">↗</span></span>
        </div>
      </a>
    </article>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render() {
  const root = document.getElementById("app");
  if (!root) return;

  const categories = uniqueCategories(apps);
  const filtered = filterApps();

  root.innerHTML = `
    <header class="site-header">
      <div class="site-header__inner">
        <p class="site-header__eyebrow">개인 실험실</p>
        <h1 class="site-header__title">Chehok Lab</h1>
        <p class="site-header__lead">
          쓰고 싶은 웹 앱을 모아 두는 작은 디렉터리입니다. 검색하거나 분류로 골라 바로 열어 보세요.
        </p>
      </div>
    </header>

    <main id="main" class="main">
      <section class="toolbar" aria-label="검색 및 필터">
        <label class="search">
          <span class="search__label">이름·설명 검색</span>
          <input
            type="search"
            class="search__input"
            id="search-input"
            placeholder="예: 기타, 모임, 맞춤법"
            autocomplete="off"
            value="${escapeHtml(state.query)}"
          />
        </label>
        <div class="filters" role="group" aria-label="카테고리">
          <button type="button" class="chip ${state.category === "all" ? "chip--active" : ""}" data-category="all">
            전체
          </button>
          ${categories
            .map(
              (c) =>
                `<button type="button" class="chip ${state.category === c ? "chip--active" : ""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`
            )
            .join("")}
        </div>
      </section>

      <section class="results" aria-live="polite" aria-atomic="true">
        ${
          filtered.length === 0
            ? `
          <div class="empty" id="empty-state">
            <p class="empty__title">일치하는 앱이 없어요</p>
            <p class="empty__hint">검색어를 바꾸거나 <strong>전체</strong> 분류를 선택해 보세요.</p>
          </div>`
            : `
          <p class="results__count">총 ${filtered.length}개</p>
          <div class="grid" id="app-grid">
            ${filtered.map(renderCard).join("")}
          </div>`
        }
      </section>
    </main>

    <footer class="site-footer">
      <p>각 앱은 새 탭에서 열립니다. 아이콘은 해당 앱의 기존 홈 화면 이미지입니다.</p>
    </footer>
  `;

  const searchInput = document.getElementById("search-input");
  searchInput?.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
    document.getElementById("search-input")?.focus();
    const pos = state.query.length;
    const input = document.getElementById("search-input");
    if (input) input.setSelectionRange(pos, pos);
  });

  root.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.getAttribute("data-category") || "all";
      render();
    });
  });
}

render();
