self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate" || request.method !== "GET") return;

  // shortcut: the directory needs a connection, cache the app shell if offline browsing is needed.
  event.respondWith(fetch(request).catch(() => new Response(
    '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Chehok Lab</title><h1>인터넷에 연결해 주세요</h1><p>연결한 뒤 페이지를 새로고침하면 앱 목록을 볼 수 있습니다.</p></html>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  )));
});
