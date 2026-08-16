// public/auto-player.js
// Intercepta POST para /player/index.php?data=...&do=getVideo, extrai securedLink e inicia o player nativo automaticamente.

(function AutoPlayer(){
  const LOG = '[AutoPlayer]';
  const handled = new Set();

  function getOrCreateVideo(){
    let video = document.querySelector('video#player2, video.player2, video');
    if(video) return video;
    const container = document.querySelector('.player-container, #player, .video-container, #root, body');
    video = document.createElement('video');
    video.id = 'player2';
    video.controls = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.height = '100%';
    if(container){
      container.innerHTML = '';
      container.appendChild(video);
    } else {
      document.body.appendChild(video);
    }
    return video;
  }

  function playUrl(url){
    if(!url || handled.has(url)) return;
    handled.add(url);
    console.log(LOG, 'Link capturado:', url);
    const video = getOrCreateVideo();

    // tenta autoplay com mute para aumentar chances
    const prevMuted = video.muted;
    video.muted = true;

    // se hls.js já estiver carregado (bundle), usa-o; senão tenta direto no elemento <video>
    try{
      if(window.Hls && window.Hls.isSupported && window.Hls.isSupported()){
        const hls = new window.Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, ()=>{
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
      return obj && obj.securedLink ? obj.securedLink : null;
    }catch(e){ return null; }
  }

  // intercept fetch
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

  // intercept XHR
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

  // observe DOM to try play if video already has src
  (function(){
    const mo = new MutationObserver(()=>{
      const v = document.querySelector('video');
      if(v && v.src && v.paused){ v.play().catch(()=>{}); }
    });
    mo.observe(document.documentElement||document.body, { childList: true, subtree: true });
  })();

  console.log(LOG,'auto-player pronto');
})();
