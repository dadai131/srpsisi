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

    console.log('Fetching:', url)
    
    // Simular um navegador para evitar bloqueios básicos
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://superflixapi.pro/'
      }
    })

    const html = await response.text()
    
    // Tenta encontrar o arquivo master.m3u8 ou .mp4 no HTML
    // Geralmente players embed escondem isso em scripts
    const m3u8Regex = /"(https?:\/\/[^"]+\.m3u8[^"]*)"/i
    const mp4Regex = /"(https?:\/\/[^"]+\.mp4[^"]*)"/i
    
    const m3u8Match = html.match(m3u8Regex)
    const mp4Match = html.match(mp4Regex)
    
    const streamUrl = m3u8Match ? m3u8Match[1] : (mp4Match ? mp4Match[1] : null)

    return new Response(JSON.stringify({ streamUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
