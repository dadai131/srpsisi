import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get existing record for today
    const { data: existing, error: selectError } = await supabase
      .from('site_statistics')
      .select('id, page_views')
      .eq('stat_date', today)
      .maybeSingle();

    if (selectError) {
      console.error(`[${requestId}] Select error:`, selectError);
      throw selectError;
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('site_statistics')
        .update({ page_views: (existing.page_views || 0) + 1 })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`[${requestId}] Update error:`, updateError);
        throw updateError;
      }
      
      console.log(`[${requestId}] Updated page views for ${today}: ${existing.page_views + 1}`);
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('site_statistics')
        .insert({ stat_date: today, page_views: 1, unique_visitors: 1 });

      if (insertError) {
        console.error(`[${requestId}] Insert error:`, insertError);
        throw insertError;
      }
      
      console.log(`[${requestId}] Created new stats for ${today}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${requestId}] Error:`, errorMessage);
    
    return new Response(
      JSON.stringify({ error: 'Failed to track page view' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
