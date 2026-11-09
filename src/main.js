import apps from "../data/apps.json";
import "./styles.css";

const BASE = import.meta.env.BASE_URL;
const MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="15" fill="#12352b"/><path d="M44.5 21.5A17 17 0 1 0 44.5 42.5" fill="none" stroke="#f4f1e8" stroke-width="8.5" stroke-linecap="round"/><circle cx="45" cy="32" r="5.2" fill="#c8f23d"/></svg>`;

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const iconSrc = (app) => `${BASE}${app.icon.replace(/^\//, "")}`;

function visual(app) {
  return app.icon
    ? `<img class="app__icon" src="${iconSrc(app)}" alt="" width="64" height="64" decoding="async" />`
    : `<span class="app__icon app__icon--text" aria-hidden="true">${esc(app.badge || app.name.slice(0, 3))}</span>`;
}

function row(app) {
  return `
    <li class="app">
      <a class="app__link" href="${esc(app.url)}" target="_blank" rel="noopener noreferrer">
        ${visual(app)}
        <span class="app__body">
          <span class="app__name">${esc(app.name)}</span>
          <span class="app__desc">${esc(app.description)}</span>
        </span>
        <span class="app__category">${esc(app.category)}</span>
        <span class="app__go" aria-hidden="true">↗</span>
        <span class="visually-hidden">(새 탭에서 열림)</span>
      </a>
    </li>`;
}

const heroIcons = apps
  .filter((a) => a.icon)
  .map(
    (a, i) =>
      `<img class="hero__tile hero__tile--${i}" src="${iconSrc(a)}" alt="" width="88" height="88" decoding="async" />`
  )
  .join("");

document.getElementById("app").innerHTML = `
  <header class="hero">
    <div class="hero__inner">
      <p class="hero__brand">${MARK}<span>Chehok Lab</span></p>
      <div class="hero__row">
        <div class="hero__text">
          <h1 class="hero__title"><span class="visually-hidden">Chehok Lab — </span>직접 만든 앱과 <em>실험</em>을 한곳에</h1>
          <p class="hero__lead">쓰고 싶은 웹 앱을 모아 두는 작은 디렉터리입니다. 바로 열어 보세요.</p>
        </div>
        <div class="hero__tiles" aria-hidden="true">${heroIcons}</div>
      </div>
    </div>
  </header>

  <main class="main" id="apps">
    <h2 class="main__title">앱</h2>
    <ul class="list">${apps.map(row).join("")}</ul>
  </main>

  <footer class="footer">
    <span>Chehok Lab</span>
    <span>앱은 새 탭에서 열려요</span>
  </footer>
`;
