/**
 * AdBlock global do site.
 * - Bloqueia requisições (fetch / XHR / WebSocket / beacon) para redes de anúncios
 * - Remove scripts, iframes e imagens de anúncio injetados no DOM
 * - Impede pop-ups, pop-unders e redirecionamentos forçados por terceiros
 */

const AD_HOST_PATTERNS = [
  'doubleclick', 'googlesyndication', 'googleadservices', 'google-analytics',
  'googletagservices', 'googletagmanager', 'adservice.google', 'adsterra',
  'propellerads', 'popads', 'popcash', 'poptm', 'exoclick', 'exosrv',
  'juicyads', 'trafficjunky', 'clickadu', 'hilltopads', 'adcash',
  'mgid', 'revcontent', 'taboola', 'outbrain', 'zedo', 'bidvertiser',
  'adnxs', 'rubiconproject', 'pubmatic', 'openx', 'criteo', 'taboolasyndication',
  'monetag', 'onclickalgo', 'onclckpjs', 'highperformanceformat', 'effectivegatecpm',
  'profitableratecpm', 'displaycontentnetwork', 'yandex.ru/ads', 'ads.', '/ads/',
  'adserver', 'adform', 'smartadserver', 'sharethrough', 'teads', 'vidoomy',
  'aniview', 'histats', 'statcounter', 'clarity.ms', 'hotjar', 'quantserve',
  'scorecardresearch', 'moatads', 'sitescout', 'lijit', 'bidswitch',
  'trafficfactory', 'tsyndicate', 'stpd.cloud', 'a-ads', 'coinzilla',
  'cointraffic', 'adbluemedia', 'notifpush', 'push-notify', 'pushwhy',
];

// Padrões que só podem casar no início do host (evita bloquear domínios
// legítimos como "uploads.example.com" ou "downloads.example.com").
const AD_HOST_PREFIXES = ['ads.', 'ad.', 'adserver.'];
const AD_PATH_PATTERNS = ['/ads/', '/adframe', '/advert'];

// Hosts que NUNCA devem ser bloqueados (backend, imagens, players, APIs).
const ALLOWED_POPUP_HOSTS = ['t.me', 'telegram.me', 'unsplash.com', 'images.unsplash.com'];

const AD_SELECTORS = [
  'ins.adsbygoogle',
  '[id*="google_ads"]',
  '[id^="aswift"]',
  '[class*="adsbygoogle"]',
  '[data-ad-client]',
  '[data-ad-slot]',
  '[id*="banner-ad"]',
  '[class*="ad-banner"]',
];

const isBlockedUrl = (raw: unknown): boolean => {
  if (typeof raw !== 'string' || !raw) return false;
  const url = raw.toLowerCase();
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) return false;

  let host = '';
  let path = url;
  try {
    const u = new URL(url, window.location.href);
    host = u.hostname;
    path = u.pathname + u.search;
  } catch {
    /* URL relativa ou inválida: usa a string crua no match de path */
  }

  if (host && ALLOWED_POPUP_HOSTS.includes(host)) return false;
  if (AD_HOST_PATTERNS.some((p) => host.includes(p))) return true;
  if (host && AD_HOST_PREFIXES.some((p) => host.startsWith(p))) return true;
  return AD_PATH_PATTERNS.some((p) => path.includes(p));
};

const looksLikeAdNode = (el: Element): boolean => {
  const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
  if (isBlockedUrl(src)) return true;
  return AD_SELECTORS.some((sel) => {
    try {
      return el.matches(sel);
    } catch {
      return false;
    }
  });
};

const cleanNode = (node: Node) => {
  if (!(node instanceof Element)) return;
  if (looksLikeAdNode(node)) {
    node.remove();
    return;
  }
  node.querySelectorAll?.('script,iframe,ins,img,embed,object,link').forEach((child) => {
    if (looksLikeAdNode(child)) child.remove();
  });
};

let installed = false;

export function installAdBlock() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // 1) Bloqueia chamadas de rede (API e site) para domínios de anúncio
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
    if (isBlockedUrl(url)) {
      return Promise.resolve(new Response('', { status: 204, statusText: 'Blocked by AdBlock' }));
    }
    return originalFetch(input as RequestInfo, init);
  }) as typeof window.fetch;

  // XHR: marcamos a requisição como bloqueada no open() e abortamos no send().
  // (Trocar a URL por "about:blank" lançava exceção e quebrava o chamador.)
  const BLOCKED_FLAG = '__adblockBlocked';
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { [BLOCKED_FLAG]?: boolean },
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    this[BLOCKED_FLAG] = isBlockedUrl(typeof url === 'string' ? url : url?.href);
    return originalOpen.call(this, method, url as string, ...(rest as []));
  } as typeof XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { [BLOCKED_FLAG]?: boolean },
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    if (this[BLOCKED_FLAG]) {
      this.abort();
      return;
    }
    return originalSend.call(this, body as XMLHttpRequestBodyInit | null);
  } as typeof XMLHttpRequest.prototype.send;

  if (navigator.sendBeacon) {
    const originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = ((url: string | URL, data?: BodyInit | null) =>
      isBlockedUrl(typeof url === 'string' ? url : url?.href)
        ? true
        : originalBeacon(url, data)) as typeof navigator.sendBeacon;
  }

  // 2) Bloqueia pop-ups/pop-unders de terceiros, mas mantém os links legítimos
  // do próprio site funcionando (Telegram, downloads de wallpaper etc.).
  const originalWindowOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const href = typeof url === 'string' ? url : url?.href;
    let allowed = false;
    if (href) {
      try {
        const u = new URL(href, window.location.href);
        allowed =
          u.origin === window.location.origin ||
          ALLOWED_POPUP_HOSTS.includes(u.hostname) ||
          !isBlockedUrl(u.href);
      } catch {
        allowed = false;
      }
    }
    if (!allowed) {
      console.warn('[AdBlock] pop-up bloqueado:', href);
      return null;
    }
    return originalWindowOpen(href, target, features);
  }) as typeof window.open;

  // 3) Remove nós de anúncio já presentes e futuros
  const sweep = () => {
    AD_SELECTORS.forEach((sel) => {
      try {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      } catch {
        /* seletor inválido */
      }
    });
    document.querySelectorAll('script[src],iframe[src],img[src]').forEach((el) => {
      if (isBlockedUrl(el.getAttribute('src'))) el.remove();
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) m.addedNodes.forEach(cleanNode);
  });

  const start = () => {
    sweep();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
