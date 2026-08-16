import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    console.log('Fetching Superflix page for extraction:', url)
    
    // Lista de domínios conhecidos da Superflix que podem estar no redirecionamento
    const superflixDomains = [
      'superflixapi.pro',
      'superflixapi.cyou',
      'superflixapi.fit',
      'superflixapi.best',
      'superflixapi.rest',
      'superflixapi.help'
    ];

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://superflixapi.pro/'
      }
    })

    const html = await response.text()
    
    // 1. Tentar encontrar a URL do stream diretamente no HTML principal
    // A Superflix frequentemente injeta o link via window.playerInstance ou similar
    const m3u8Regex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/gi
    const mp4Regex = /(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/gi
    
    let allMatches = [
      ...html.matchAll(m3u8Regex),
      ...html.matchAll(mp4Regex)
    ].map(m => m[0]);

    // Filtrar para remover lixo (ads, analytics, domínios de trackers)
    // Manter apenas o que parece ser um servidor de vídeo
    const streamUrl = allMatches.find(s => 
      !s.includes('ads') && 
      !s.includes('analytics') && 
      !s.includes('click') &&
      !s.includes('pop') &&
      !s.includes('doubleclick') &&
      (s.includes('m3u8') || s.includes('mp4'))
    );

    if (streamUrl) {
      console.log('Found direct stream in HTML:', streamUrl);
      return new Response(JSON.stringify({ streamUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Se não encontrou, procurar por iframes que possam conter o player real
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi
    const iframes = [...html.matchAll(iframeRegex)].map(m => m[1]);
    
    for (const iframeUrl of iframes) {
      // Se o iframe aponta para outro domínio da Superflix ou player conhecido
      if (superflixDomains.some(d => iframeUrl.includes(d)) || iframeUrl.includes('player')) {
        try {
          console.log('Following iframe to:', iframeUrl);
          const iframeRes = await fetch(iframeUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': url
            }
          });
          const iframeHtml = await iframeRes.text();
          const nestedMatches = [
            ...iframeHtml.matchAll(m3u8Regex),
            ...iframeHtml.matchAll(mp4Regex)
          ].map(m => m[0]);
          
          const nestedStream = nestedMatches.find(s => 
            !s.includes('ads') && !s.includes('analytics') && !s.includes('pop')
          );
          
          if (nestedStream) {
            console.log('Found stream in nested iframe:', nestedStream);
            return new Response(JSON.stringify({ streamUrl: nestedStream }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            })
          }
        } catch (e) {
          console.error('Failed to fetch iframe:', iframeUrl, e);
        }
      }
    }

    return new Response(JSON.stringify({ streamUrl: null, message: 'Could not extract stream' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Extraction error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})