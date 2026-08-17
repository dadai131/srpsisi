// public/auto-player.js
// Intercepta POST para /player/index.php?data=...&do=getVideo, injeta o securedLink no player1 (se existir) e inicia a reprodução.

(function UsePlayer1() {
  const LOG = '[AutoPlayer->player1]';
  const handled = new Set();

  function extractSecured(jsonOrText) {
    if (!jsonOrText) return null;
    try {
      const obj = typeof jsonOrText === 'string' ? JSON.parse(jsonOrText) : jsonOrText;
      return obj && (obj.securedLink || obj.secured_link || obj.secureLink) || null;
    } catch (e) { return null; }
  }

  async function applyToPlayer1(m3u8) {
    if (!m3u8 || handled.has(m3u8)) return;
    handled.add(m3u8);
    console.log(LOG, 'securedLink:', m3u8);

    // 1) jwplayer (ex: jwplayer('player1'))
    try {
      if (window.jwplayer) {
        try {
          const jw = (typeof window.jwplayer === 'function') ? (window.jwplayer('player1') || window.jwplayer()) : null;
          if (jw) {
            if (typeof jw.load === 'function') {
              jw.load([{ file: m3u8 }]);
            } else if (typeof jw.setup === 'function') {
              jw.setup({ file: m3u8, autostart: true });
            }
            console.log(LOG, 'usado jwplayer');
            return;
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) {}

    // 2) video.js
    try {
      if (window.videojs) {
        const el = document.getElementById('player1') || document.querySelector('.player1 video');
        if (el) {
          try {
            const vjs = window.videojs(el);
            if (vjs) {
              vjs.src({ src: m3u8, type: 'application/x-mpegURL' });
              vjs.play().catch(()=>{});
              console.log(LOG, 'usado video.js');
              return;
            }
          } catch (e) { /* ignore */ }
        }
      }
    } catch (e) {}

    // 3) Plyr
    try {
      if (window.Plyr) {
        if (window.player && typeof window.player.source === 'object') {
          try {
            window.player.source = { type: 'video', sources: [{ src: m3u8, type: 'application/x-mpegURL' }] };
            window.player.play && window.player.play().catch(()=>{});
            console.log(LOG, 'usado Plyr (window.player)');
            return;
          } catch (e) {}
        }
        const el = document.getElementById('player1') || document.querySelector('.player1 video');
        if (el) {
          try {
            const p = el._plyr || el.plyr || null;
            if (p) {
              p.source = { type: 'video', sources: [{ src: m3u8, type: 'application/x-mpegURL' }] };
              p.play && p.play().catch(()=>{});
              console.log(LOG, 'usado Plyr (element instance)');
              return;
            }
          } catch(e){}
        }
      }
    } catch(e){}

    // 4) Fallback: elemento <video id="player1"> ou primeiro <video>
    try {
      const video = document.getElementById('player1') || document.querySelector('video.player1, video#player1, video');
      if (video) {
        if (window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
          try {
            const hls = new window.Hls();
            hls.loadSource(m3u8);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, () => { video.play().catch(()=>{}); });
            console.log(LOG, 'usado hls.js no elemento <video>');
          } catch(e) {
            console.warn(LOG, 'erro hls.js:', e);
          }
        } else if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
          try {
            video.src = m3u8;
            video.play().catch(()=>{});
            console.log(LOG, 'definido src no <video> (nativo)');
          } catch(e) {}
        } else {
          try {
            video.src = m3u8;
            video.play().catch(()=>{});
            console.warn(LOG, 'fallback: src no <video>, pode não reproduzir sem hls.js');
          } catch(e) {}
        }
        return;
      }
    } catch (e) { console.warn(LOG, 'erro ao aplicar fallback video:', e); }

    console.warn(LOG, 'nenhum player conhecido encontrado para injetar o m3u8; considere criar um handler específico para seu player1');
  }

  // intercept fetch
  (function interceptFetch() {
    const orig = window.fetch.bind(window);
    window.fetch = async function(...args) {
      try {
        const req = args[0];
        const init = args[1] || {};
        const method = (init.method || 'GET').toUpperCase();
        const url = typeof req === 'string' ? req : (req && req.url) || '';
        if (typeof url === 'string' && url.includes('/player/index.php') && url.includes('do=getVideo') && method === 'POST') {
          const resp = await orig(...args);
          resp.clone().text().then(text => {
            const secured = extractSecured(text);
            if (secured) applyToPlayer1(secured);
          }).catch(()=>{});
          return resp;
        }
      } catch (e) { console.warn(LOG, 'fetch interceptor erro:', e); }
      return orig(...args);
    };
    console.log(LOG, 'fetch interceptado');
  })();

  // intercept XHR
  (function interceptXhr() {
    const NativeXHR = window.XMLHttpRequest;
    if (!NativeXHR) return;
    function X() {
      const xhr = new NativeXHR();
      let _method = '', _url = '';
      const openOrig = xhr.open.bind(xhr);
      xhr.open = function(method, url, ...rest) { _method = (method||'').toUpperCase(); _url = url||''; return openOrig(method, url, ...rest); };
      const sendOrig = xhr.send.bind(xhr);
      xhr.send = function(...args) {
        this.addEventListener('load', function() {
          try {
            if (typeof _url === 'string' && _url.includes('/player/index.php') && _url.includes('do=getVideo') && _method === 'POST') {
              let text = null;
              try { text = (this.responseType === '' || this.responseType === 'text' || !this.responseType) ? this.responseText : (typeof this.response === 'string' ? this.response : JSON.stringify(this.response)); } catch(e){}
              const secured = extractSecured(text);
              if (secured) applyToPlayer1(secured);
            }
          } catch (e) { console.warn(LOG, 'XHR load handler erro:', e); }
        });
        return sendOrig(...args);
      };
      return xhr;
    }
    window.XMLHttpRequest = X;
    console.log(LOG, 'XMLHttpRequest interceptado');
  })();

  console.log(LOG, 'script pronto — aguardando POST para /player/index.php?do=getVideo');
})();
