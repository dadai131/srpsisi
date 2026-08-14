import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const TMDB_BASE = 'https://api.themoviedb.org/3'

// Only these TMDB path prefixes may be proxied
const ALLOWED = [
  /^\/(movie|tv)\/\d+(\/external_ids)?$/,
  /^\/(movie|tv)\/(popular|top_rated|upcoming|now_playing|airing_today)$/,
  /^\/trending\/(movie|tv)\/(day|week)$/,
  /^\/discover\/(movie|tv)$/,
  /^\/search\/(multi|movie|tv)$/,
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const key = Deno.env.get('TMDB_API_KEY')
    if (!key) {
      return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const path = url.searchParams.get('path') || ''
    if (!path.startsWith('/') || path.includes('..') || !ALLOWED.some((r) => r.test(path))) {
      return new Response(JSON.stringify({ error: 'Invalid path' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const params = new URLSearchParams()
    for (const [k, v] of url.searchParams) {
      if (k === 'path' || k === 'api_key') continue
      if (v.length > 200) continue
      params.append(k, v)
    }
    params.set('api_key', key)

    const res = await fetch(`${TMDB_BASE}${path}?${params}`, { headers: { Accept: 'application/json' } })
    const body = await res.text()

    return new Response(body, {
      status: res.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
