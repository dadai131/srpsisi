import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
};

const API_BASE = 'https://superflixapi.buzz';

// Rate limiting - in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // More restrictive for this API
const RATE_WINDOW = 60000; // 1 minute

// Allowed values whitelist
const ALLOWED_CATEGORIES = ['movie', 'tv', 'anime'];
const ALLOWED_TYPES = ['imdb', 'tmdb'];
const ALLOWED_FORMATS = ['json'];
const ALLOWED_ORDERS = ['asc', 'desc'];
const ALLOWED_ENDPOINTS = ['lista', 'calendario'];

// Get client identifier
function getClientId(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

// Check rate limit
function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

// Validate request
function validateRequest(req: Request): { valid: boolean; reason?: string } {
  const userAgent = req.headers.get('user-agent') || '';
  
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, reason: 'Invalid user agent' };
  }
  
  const blockedAgents = ['curl', 'wget', 'python-requests', 'scrapy', 'httpie', 'postman'];
  if (blockedAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return { valid: false, reason: 'Automated requests blocked' };
  }
  
  return { valid: true };
}

// Sanitize string input
function sanitize(value: string, maxLength = 20): string {
  return value
    .slice(0, maxLength)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientId = getClientId(req);
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // Rate limiting
    const rateCheck = checkRateLimit(clientId);
    if (!rateCheck.allowed) {
      console.log(`[${requestId}] Rate limited: ${clientId}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    // Request validation
    const validation = validateRequest(req);
    if (!validation.valid) {
      console.log(`[${requestId}] Validation failed: ${validation.reason}`);
      return new Response(
        JSON.stringify({ error: 'Request blocked' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    
    // Get and validate parameters
    const rawEndpoint = url.searchParams.get('endpoint') || 'lista';
    const rawCategory = url.searchParams.get('category') || 'movie';
    const rawType = url.searchParams.get('type') || 'tmdb';
    const rawFormat = url.searchParams.get('format') || 'json';
    const rawOrder = url.searchParams.get('order') || 'asc';
    const rawLimit = url.searchParams.get('limit');
    const rawOffset = url.searchParams.get('offset');

    // Sanitize inputs
    const endpoint = sanitize(rawEndpoint);
    const category = sanitize(rawCategory);
    const type = sanitize(rawType);
    const format = sanitize(rawFormat);
    const order = sanitize(rawOrder);
    
    // Parse pagination params (limit max 500, offset min 0)
    const limit = rawLimit ? Math.min(Math.max(1, parseInt(rawLimit) || 100), 500) : null;
    const offset = rawOffset ? Math.max(0, parseInt(rawOffset) || 0) : 0;

    // Validate against whitelist
    if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
      console.log(`[${requestId}] Invalid endpoint: ${endpoint}`);
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({ error: 'Invalid category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_FORMATS.includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_ORDERS.includes(order)) {
      return new Response(
        JSON.stringify({ error: 'Invalid order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let apiUrl: string;

    if (endpoint === 'lista') {
      apiUrl = `${API_BASE}/lista?category=${category}&type=${type}&format=${format}&order=${order}`;
    } else if (endpoint === 'calendario') {
      apiUrl = `${API_BASE}/calendario.php`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Fetching: ${endpoint} from ${clientId}`);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[${requestId}] API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'External API error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data = await response.json();
    
    // Apply pagination if limit is set and data is an array
    let totalCount = 0;
    if (Array.isArray(data)) {
      totalCount = data.length;
      if (limit !== null) {
        data = data.slice(offset, offset + limit);
      }
    }
    
    console.log(`[${requestId}] Success: ${Array.isArray(data) ? data.length : 'object'} items (total: ${totalCount})`);

    return new Response(JSON.stringify({
      data,
      pagination: {
        total: totalCount,
        limit: limit || totalCount,
        offset,
        hasMore: Array.isArray(data) && limit !== null ? offset + limit < totalCount : false,
      }
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateCheck.remaining.toString(),
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${requestId}] Error:`, errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
