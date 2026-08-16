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

    console.log('Fetching source for extraction:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://superflixapi.pro/'
      }
    })

    const html = await response.text()
    
    // Regex para encontrar links de stream, incluindo o novo formato fornecido pelo usuário
    const m3u8Regex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/gi
    const mp4Regex = /(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/gi
    const customStreamRegex = /(https?:\/\/xn--[^"'\s]+(?:\/m3\/|\/video\/)[^"'\s]+)/gi
    
    let allMatches = [
      ...html.matchAll(m3u8Regex),
      ...html.matchAll(mp4Regex),
      ...html.matchAll(customStreamRegex)
    ].map(m => m[0]);

    // Filtro rigoroso para encontrar o stream real
    const streamUrl = allMatches.find(s => 
      !s.includes('ads') && 
      !s.includes('analytics') && 
      !s.includes('click') &&
      !s.includes('pop') &&
      !s.includes('doubleclick') &&
      (s.includes('m3u8') || s.includes('mp4') || s.includes('xn--'))
    );

    if (streamUrl) {
      console.log('Found direct stream:', streamUrl);
      return new Response(JSON.stringify({ streamUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Procura em iframes se falhar no HTML principal
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi
    const iframes = [...html.matchAll(iframeRegex)].map(m => m[1]);
    
    for (const iframeUrl of iframes) {
      if (iframeUrl.includes('superflix') || iframeUrl.includes('player') || iframeUrl.includes('xn--')) {
        try {
          const iframeRes = await fetch(iframeUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': url
            }
          });
          const iframeHtml = await iframeRes.text();
          const nestedMatches = [
            ...iframeHtml.matchAll(m3u8Regex),
            ...iframeHtml.matchAll(mp4Regex),
            ...iframeHtml.matchAll(customStreamRegex)
          ].map(m => m[0]);
          
          const nestedStream = nestedMatches.find(s => 
            !s.includes('ads') && !s.includes('analytics') && (s.includes('m3u8') || s.includes('mp4') || s.includes('xn--'))
          );
          
          if (nestedStream) {
            return new Response(JSON.stringify({ streamUrl: nestedStream }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            })
          }
        } catch (e) {
          console.error('Failed to fetch iframe:', iframeUrl);
        }
      }
    }

    return new Response(JSON.stringify({ streamUrl: null }), {
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