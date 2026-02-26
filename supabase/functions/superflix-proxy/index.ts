import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPERFLIX_BASE = 'https://superflixapi.buzz';
const EMBEDTV_BASE = 'https://embedtv.best/api';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'lista';

    let apiUrl: string;

    // EmbedTV endpoints
    const embedtvEndpoints = ['jogos', 'channels', 'epg', 'epgs'];
    if (embedtvEndpoints.includes(endpoint)) {
      apiUrl = `${EMBEDTV_BASE}/${endpoint}`;
    }
    // SuperFlix endpoints
    else if (endpoint === 'lista') {
      const category = url.searchParams.get('category') || 'movie';
      const type = url.searchParams.get('type') || 'imdb';
      const format = url.searchParams.get('format') || 'json';
      const order = url.searchParams.get('order') || 'asc';
      apiUrl = `${SUPERFLIX_BASE}/lista?category=${category}&type=${type}&format=${format}&order=${order}`;
    } else if (endpoint === 'calendario') {
      apiUrl = `${SUPERFLIX_BASE}/calendario.php`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Proxying: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ error: `API returned ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
