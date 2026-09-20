import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { categories, channels } from "@/data/channels";
import { PUBLIC_SITE_URL } from "../runtime";

export default defineTool({
  name: "list_live_channels",
  title: "Listar canais ao vivo",
  description: "Lista os canais ao vivo do LokiFilmes sem revelar os endereços das fontes de vídeo.",
  inputSchema: {
    category: z.string().trim().nullable().describe("ID da categoria; use null para listar todos os canais."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category }) => {
    const validCategory = category && categories.some((item) => item.id === category) ? category : null;
    const matches = channels
      .filter((channel) => !validCategory || validCategory === "all" || channel.category === validCategory)
      .map((channel) => ({ id: channel.id, name: channel.name, category: channel.category, logo: channel.logo }));

    return {
      content: [{ type: "text", text: `${matches.length} canal(is) disponível(is). Abra ${PUBLIC_SITE_URL}/tv para assistir.` }],
      structuredContent: {
        channels: matches,
        categories: categories.map(({ id, name }) => ({ id, name })),
        watch_url: `${PUBLIC_SITE_URL}/tv`,
      },
    };
  },
});