import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch channels
    const chRes = await fetch("https://embedtv.best/api/channels");
    if (!chRes.ok) throw new Error(`Channels API error: ${chRes.status}`);
    const chData = await chRes.json();
    const channels = chData.channels || [];
    const categories = chData.categories || [];

    // Fetch EPG
    let epgMap: Record<string, { title: string }> = {};
    try {
      const epgRes = await fetch("https://embedtv.best/api/epg");
      if (epgRes.ok) {
        const epgArr = await epgRes.json();
        epgArr.forEach((e: { id: string; epg: { title: string } }) => {
          epgMap[e.id] = e.epg;
        });
      }
    } catch { /* EPG optional */ }

    // Build M3U
    let m3u = "#EXTM3U\n";
    for (const ch of channels) {
      const catNames = (ch.categories || [])
        .map((cid: number) => {
          const cat = categories.find((c: { id: number; name: string }) => c.id === cid);
          return cat?.name || "";
        })
        .filter(Boolean)
        .join(";");
      const epg = epgMap[ch.id];
      const epgInfo = epg ? ` - ${epg.title}` : "";
      m3u += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.image}" group-title="${catNames}",${ch.name}${epgInfo}\n`;
      m3u += `${ch.url}\n`;
    }

    return new Response(m3u, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/x-mpegURL; charset=utf-8",
        "Content-Disposition": 'inline; filename="index.m3u8"',
      },
    });
  } catch (error) {
    console.error("M3U generation error:", error);
    return new Response("Error generating M3U", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
