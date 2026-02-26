import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'https://superflixapi.buzz';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'lista';
    const category = url.searchParams.get('category') || 'movie';
    const type = url.searchParams.get('type') || 'imdb';
    const format = url.searchParams.get('format') || 'json';
    const order = url.searchParams.get('order') || 'asc';

    let apiUrl: string;

    if (endpoint === 'lista') {
      apiUrl = `${API_BASE}/lista?category=${category}&type=${type}&format=${format}&order=${order}`;
    } else if (endpoint === 'calendario') {
      apiUrl = `${API_BASE}/calendario.php`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching from SuperFlixAPI: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`SuperFlixAPI error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ error: `API returned ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 'object'} items from ${endpoint}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in superflix-proxy:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
