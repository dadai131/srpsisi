// public/auto-player.js
// Substitui o player existente por um player simples (<video id="player2">), intercepta POST para /player/index.php?data=...&do=getVideo,
// extrai securedLink e inicia o player automaticamente.

(function AutoPlayer(){
  const LOG = '[AutoPlayer]';
  const handled = new Set();

  // Cria um player <video> simples
  function createSimplePlayer() {
    const video = document.createElement('video');
    video.id = 'player2';
    video.controls = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.background = 'black';
    video.setAttribute('preload', 'metadata');
    return video;
  }

  // Substitui o player complexo existente por um player simples
  function replaceExistingPlayerInDOM() {
    const selectors = [
      '#player2', // se já existir
      '.player-container',
      '#player',
      '.video-container',
      '.player',
      '.video-player',
      '.jwplayer',
      '.plyr__video-embed',
      '#root' // cuidado: se for app SPA, #root contém a app; só substitui se parecer um player
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;

      // Não substituir #root se ele contém vários nós (provavelmente a app inteira) — apenas substitui se tiver especificamente um player
      if (sel === '#root') {
        // heurística: se #root tem exatamente 1 filho que é player-like, substitui; caso contrário pula
        const children = el.children;
        if (!children || children.length > 3) continue; // muita coisa — evita quebrar app
      }

      const simple = createSimplePlayer();
      // limpa e insere o novo player
      try {
        // se for #root e tiver conteúdo do app, não limpa tudo — em vez disso, tenta inserir no início
        if (sel === '#root') {
          el.insertBefore(simple, el.firstChild);
        } else {
          el.innerHTML = '';
          el.appendChild(simple);
        }
        console.log(LOG, 'Substituído elemento', sel, 'por player simples');
        return simple;
      } catch (e) {
        console.warn(LOG, 'Falha ao substituir', sel, e);
      }
    }

    // se não encontrou nada, anexa no body
    const s = createSimplePlayer();
    s.style.maxWidth = '100%';
    s.style.display = 'block';
    s.style.margin = '0 auto';
    document.body.appendChild(s);
    console.log(LOG, 'Player simples adicionado no body');
    return s;
  }

  // Busca ou cria o video (garantindo que exista o player simples e único)
  function getOrCreateVideo(){
    let video = document.querySelector('video#player2');
    if (video) return video;
    return replaceExistingPlayerInDOM();
  }

  async function ensureHlsJs(){
    if (window.Hls) return window.Hls;
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      s.async = true;
      s.onload = () => resolve(window.Hls);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  async function playUrl(url){
    if(!url || handled.has(url)) return;
    handled.add(url);
    console.log(LOG, 'Link capturado:', url);

    const video = getOrCreateVideo();
    if(!video) return console.warn(LOG, 'Não foi possível criar/encontrar o vídeo');

    // tenta autoplay com mute para aumentar chances
    const prevMuted = video.muted;
    video.muted = true;

    const Hls = await ensureHlsJs();

    try{
      if(Hls && Hls.isSupported && Hls.isSupported()){
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, ()=>{
          video.play().catch(e=>console.warn(LOG,'autoplay bloqueado:',e));
        });
        console.log(LOG,'Reproduzindo via hls.js');
      } else if(video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')){
        video.src = url;
        video.addEventListener('loadedmetadata', ()=>{ video.play().catch(()=>{}); }, { once: true });
        console.log(LOG,'Reprodução nativa (Safari/iOS)');
      } else {
        // tenta definir src mesmo sem suporte HLS; pode falhar em Chrome
        video.src = url;
        video.play().catch(e=>console.warn(LOG,'play falhou:',e));
        console.warn(LOG,'HLS não suportado sem hls.js');
      }
    } finally{
      setTimeout(()=>{ try{ video.muted = prevMuted; }catch(e){} }, 1500);
    }
  }

  function extractSecured(jsonOrText){
    if(!jsonOrText) return null;
    try{
      const obj = (typeof jsonOrText === 'string') ? JSON.parse(jsonOrText) : jsonOrText;
      return obj && (obj.securedLink || obj.secured_link || obj.secureLink) || null;
    }catch(e){ return null; }
  }

  // Intercept fetch
  (function(){
    const orig = window.fetch.bind(window);
    window.fetch = async function(...args){
      try{
        const req = args[0];
        const init = args[1] || {};
        const method = (init.method || 'GET').toUpperCase();
        const url = (typeof req === 'string') ? req : (req && req.url) || '';
        if(typeof url === 'string' && url.includes('/player/index.php') && url.includes('do=getVideo') && method === 'POST'){
          const resp = await orig(...args);
          resp.clone().text().then(text=>{
            const secured = extractSecured(text);
            if(secured) playUrl(secured);
          }).catch(()=>{});
          return resp;
        }
      }catch(e){ console.warn(LOG,'fetch interceptor erro:',e); }
      return orig(...args);
    };
    console.log(LOG,'fetch interceptado');
  })();

  // Intercept XHR
  (function(){
    const NativeXHR = window.XMLHttpRequest;
    if(!NativeXHR) return;
    function X(){
      const xhr = new NativeXHR();
      let _method = '', _url = '';
      const openOrig = xhr.open.bind(xhr);
      xhr.open = function(method, url, ...rest){ _method = (method||'').toUpperCase(); _url = url||''; return openOrig(method, url, ...rest); };
      const sendOrig = xhr.send.bind(xhr);
      xhr.send = function(...args){
        this.addEventListener('load', function(){
          try{
            if(typeof _url === 'string' && _url.includes('/player/index.php') && _url.includes('do=getVideo') && _method === 'POST'){
              let text = null;
              try{ text = (this.responseType === '' || this.responseType === 'text' || !this.responseType) ? this.responseText : (typeof this.response === 'string' ? this.response : JSON.stringify(this.response)); }catch(e){}
              const secured = extractSecured(text);
              if(secured) playUrl(secured);
            }
          }catch(e){ console.warn(LOG,'XHR load handler erro:',e); }
        });
        return sendOrig(...args);
      };
      return xhr;
    }
    window.XMLHttpRequest = X;
    console.log(LOG,'XMLHttpRequest interceptado');
  })();

  // Observe DOM para tentar tocar caso já tenha src
  (function(){
    const mo = new MutationObserver(()=>{
      const v = document.querySelector('video#player2');
      if(v && v.src && v.paused){ v.play().catch(()=>{}); }
    });
    mo.observe(document.documentElement||document.body, { childList: true, subtree: true });
  })();

  console.log(LOG,'auto-player pronto e configurado para substituir player existente por player simples');
})();
