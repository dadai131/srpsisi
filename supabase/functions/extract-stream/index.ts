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

    console.log('Fetching Superflix page:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://superflixapi.pro/'
      }
    })

    const html = await response.text()
    
    // Procura por links de stream no HTML da Superflix
    // A Superflix costuma usar iframes ou players como o Player.js que carregam m3u8
    const m3u8Regex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/gi
    const mp4Regex = /(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/gi
    
    let streams = [...html.matchAll(m3u8Regex)].map(m => m[0])
    if (streams.length === 0) {
      streams = [...html.matchAll(mp4Regex)].map(m => m[0])
    }
    
    // Filtra domínios conhecidos de ads ou trackers se necessário, 
    // mas aqui pegamos o primeiro que parecer um vídeo real
    const streamUrl = streams.find(s => !s.includes('ads') && !s.includes('analytics')) || null

    console.log('Found stream:', streamUrl)

    return new Response(JSON.stringify({ streamUrl }), {
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
