import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
};

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Rate limiting - in-memory store (resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60000; // 1 minute

// Allowed endpoints whitelist
const ALLOWED_ENDPOINTS = [
  'trending/movie/week',
  'trending/tv/week',
  'movie/popular',
  'tv/popular',
  'search/movie',
  'search/tv',
  'genre/movie/list',
  'genre/tv/list',
];

// Check if endpoint matches allowed patterns
function isEndpointAllowed(endpoint: string): boolean {
  // Allow whitelisted endpoints
  if (ALLOWED_ENDPOINTS.includes(endpoint)) return true;
  
  // Allow movie/tv detail endpoints (e.g., movie/123, tv/456)
  if (/^(movie|tv)\/\d+$/.test(endpoint)) return true;
  
  // Allow credits, videos, similar endpoints
  if (/^(movie|tv)\/\d+\/(credits|videos|similar|recommendations)$/.test(endpoint)) return true;
  
  return false;
}

// Get client identifier for rate limiting
function getClientId(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
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

// Validate request headers
function validateRequest(req: Request): { valid: boolean; reason?: string } {
  // Check for suspicious headers that indicate proxy/automation
  const userAgent = req.headers.get('user-agent') || '';
  
  // Block empty user agents
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, reason: 'Invalid user agent' };
  }
  
  // Block known automation tools
  const blockedAgents = ['curl', 'wget', 'python-requests', 'scrapy', 'httpie'];
  if (blockedAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return { valid: false, reason: 'Automated requests not allowed' };
  }
  
  // Validate content type for non-GET requests
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    const contentType = req.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return { valid: false, reason: 'Invalid content type' };
    }
  }
  
  return { valid: true };
}

// Sanitize endpoint to prevent path traversal
function sanitizeEndpoint(endpoint: string): string {
  return endpoint
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/\/+/g, '/') // Normalize slashes
    .replace(/^\/|\/$/g, ''); // Trim slashes
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientId = getClientId(req);
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // Rate limiting check
    const rateCheck = checkRateLimit(clientId);
    if (!rateCheck.allowed) {
      console.log(`[${requestId}] Rate limit exceeded for ${clientId}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
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
      console.log(`[${requestId}] Request validation failed: ${validation.reason}`);
      return new Response(
        JSON.stringify({ error: 'Request validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!TMDB_API_KEY) {
      console.error(`[${requestId}] TMDB_API_KEY not configured`);
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const rawEndpoint = url.searchParams.get('endpoint');
    
    if (!rawEndpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize and validate endpoint
    const endpoint = sanitizeEndpoint(rawEndpoint);
    
    if (!isEndpointAllowed(endpoint)) {
      console.log(`[${requestId}] Blocked endpoint: ${endpoint}`);
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build TMDB URL with all query params
    const tmdbUrl = new URL(`${TMDB_BASE}/${endpoint}`);
    tmdbUrl.searchParams.set('api_key', TMDB_API_KEY);
    
    // Forward only safe query params
    const safeParams = ['language', 'page', 'region', 'query', 'include_adult'];
    for (const [key, value] of url.searchParams.entries()) {
      if (safeParams.includes(key)) {
        // Sanitize param values
        const sanitizedValue = value.slice(0, 100).replace(/[<>'"]/g, '');
        tmdbUrl.searchParams.set(key, sanitizedValue);
      }
    }

    console.log(`[${requestId}] Proxying: ${endpoint} from ${clientId}`);

    const response = await fetch(tmdbUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] TMDB error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'External API error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateCheck.remaining.toString(),
        } 
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
