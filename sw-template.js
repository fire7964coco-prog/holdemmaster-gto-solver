/*
 * 서비스워커 원본 — webpack이 빌드할 때 아래 __자리표시자__를 실제 값으로 채워
 * dist/sw.js 로 내보낸다 (webpack.config.js의 GenerateServiceWorkerPlugin).
 * 이 파일은 번들에 들어가지 않으므로 import 문법을 쓰지 말 것.
 *
 * 캐시 무효화 원칙 (본체 요청서의 🔴 항목):
 *   1. 캐시 이름에 빌드 해시가 들어간다 → 배포하면 캐시 이름이 통째로 바뀌고,
 *      activate에서 옛 캐시를 전부 지운다. "옛 셸이 남는" 상태가 원천적으로 없다.
 *   2. HTML(문서 요청)은 항상 네트워크 우선. 오프라인일 때만 캐시로 떨어진다.
 *      → 온라인 사용자는 배포 즉시 새 버전을 본다.
 *   3. skipWaiting을 쓰지 않는다. 이미 열려 있는 탭이 옛 번들을 쓰는 도중에
 *      캐시가 갈아엎히면 지연 로딩 청크가 깨지기 때문. 새 워커는 탭을 다 닫은 뒤 켜진다.
 */

const VERSION = "__CACHE_VERSION__";
const CACHE = "hm-solver-" + VERSION;

// 설치 즉시 저장하는 앱 셸 (HTML·CSS·진입 번들·아이콘). 수백 KB 수준.
const SHELL = __SHELL__;

// 설치한 사용자에게만 추가로 저장하는 학습 데이터 (트레이너 1.6MB + 교육 예제 13종).
// 일반 방문자에게 이걸 강제로 받게 하면 첫 방문 데이터 요금만 축낸다 →
// 홈 화면에 설치했거나 사용자가 직접 요청했을 때만 앱이 메시지로 지시한다.
const DATA = __DATA__;

const putAll = async (cache, urls) => {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      // 배포마다 캐시 이름이 바뀌므로 HTTP 캐시가 아닌 네트워크에서 받아온다.
      const res = await fetch(url, { cache: "no-cache", credentials: "same-origin" });
      if (!res.ok) throw new Error(url + " " + res.status);
      await cache.put(url, res);
    })
  );
  return results.filter((r) => r.status === "rejected").length;
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const failed = await putAll(cache, SHELL);
      // 셸 일부가 실패해도 설치는 진행한다. 못 받은 것은 나중에 런타임 캐시가 메운다.
      if (failed) console.warn("[sw] 셸 " + failed + "건 저장 실패");
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("hm-solver-") && n !== CACHE).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

const isCacheable = (res) =>
  res && res.ok && (res.type === "basic" || res.type === "default") && res.status === 200;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // 다른 출처(Supabase 로그인·동기화 등)는 건드리지 않는다.
  if (url.origin !== self.location.origin) return;

  // ① 문서 요청: 네트워크 우선 → 실패 시 캐시된 셸
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (isCacheable(fresh)) {
            const cache = await caches.open(CACHE);
            // 문서는 주소에 ?view=·?spot= 등이 붙으므로 항상 같은 키로 저장한다.
            cache.put("/index.html", fresh.clone());
          }
          return fresh;
        } catch (e) {
          const cached = await caches.match("/index.html");
          if (cached) return cached;
          throw e;
        }
      })()
    );
    return;
  }

  // ② 그 외 같은 출처 자원: 캐시 우선 (파일명에 해시가 박혀 있어 안전)
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (isCacheable(res)) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    })()
  );
});

// 앱이 보내는 지시 처리
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  const reply = (payload) => {
    if (event.source) event.source.postMessage(payload);
  };

  // 오프라인 학습 데이터 저장 (설치 직후 또는 사용자가 버튼을 눌렀을 때)
  if (msg.type === "cache-data") {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        const missing = [];
        for (const url of DATA) {
          if (!(await cache.match(url))) missing.push(url);
        }
        const failed = await putAll(cache, missing);
        reply({ type: "cache-data-done", total: DATA.length, failed });
      })()
    );
    return;
  }

  // 저장 상태 조회
  if (msg.type === "cache-status") {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        let have = 0;
        for (const url of DATA) if (await cache.match(url)) have++;
        reply({ type: "cache-status", have, total: DATA.length, version: VERSION });
      })()
    );
  }
});
