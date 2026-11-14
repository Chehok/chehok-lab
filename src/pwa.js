// "앱 설치" (browser) ↔ "링크 공유" (installed PWA) button.
export const SHARE_URL = "https://chehok.github.io/chehok-lab/";

const ICON_INSTALL = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_LINK = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function isStandalone(win = window) {
  return (
    win.matchMedia?.("(display-mode: standalone)").matches ||
    win.matchMedia?.("(display-mode: fullscreen)").matches ||
    win.matchMedia?.("(display-mode: minimal-ui)").matches ||
    win.navigator.standalone === true
  );
}

export function isIos(nav = navigator) {
  return /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

export function setupPwaAction(button, hint) {
  if (!button) return;
  let deferredPrompt = null;
  let hintTimer;

  const say = (msg, ms = 4000) => {
    if (!hint) return;
    clearTimeout(hintTimer);
    hint.textContent = msg;
    hint.classList.toggle("is-visible", Boolean(msg));
    if (msg && ms) hintTimer = setTimeout(() => say(""), ms);
  };

  const render = () => {
    const shareMode = isStandalone();
    button.dataset.mode = shareMode ? "share" : "install";
    button.innerHTML = shareMode ? `${ICON_LINK}<span>링크 공유</span>` : `${ICON_INSTALL}<span>앱 설치</span>`;
    button.setAttribute("aria-label", shareMode ? "Chehok Lab 링크 복사" : "Chehok Lab 앱 설치");
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    say("앱이 설치됐어요. 홈 화면이나 앱 목록에서 열 수 있어요.");
  });

  window.matchMedia?.("(display-mode: standalone)").addEventListener?.("change", render);

  button.addEventListener("click", async () => {
    if (button.dataset.mode === "share") {
      const ok = await copyText(SHARE_URL);
      say(ok ? "링크를 복사했어요." : `복사하지 못했어요. 주소: ${SHARE_URL}`, ok ? 2500 : 0);
      return;
    }

    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome !== "accepted") say("");
      return;
    }

    say(
      isIos()
        ? "Safari 아래쪽 공유 버튼(□↑)을 누른 뒤 ‘홈 화면에 추가’를 선택하세요."
        : "브라우저 메뉴(⋮)에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요. 이미 설치했다면 설치된 앱에서 열어 주세요.",
      0
    );
  });

  render();
}
