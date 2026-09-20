import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { backendUrl, PUBLIC_SITE_URL } from "../runtime";

type TmdbItem = {
  id?: number;
  title?: string;
  name?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
};

export default defineTool({
  name: "search_catalog",
  title: "Buscar catálogo",
  description: "Busca filmes e séries disponíveis no catálogo público do LokiFilmes.",
  inputSchema: {
    query: z.string().trim().min(1).max(120).describe("Título do filme ou série."),
    media_type: z.enum(["movie", "tv"]).nullable().describe("Filtre por filme ou série; use null para ambos."),
    limit: z.number().int().min(1).max(20).nullable().describe("Quantidade de resultados; use null para 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, media_type, limit }, ctx) => {
    const endpoint = new URL(`${backendUrl()}/functions/v1/tmdb`);
    endpoint.searchParams.set("path", "/search/multi");
    endpoint.searchParams.set("language", "pt-BR");
    endpoint.searchParams.set("query", query);

    const response = await fetch(endpoint, { signal: ctx.signal });
    if (!response.ok) throw new ToolError(`A busca do catálogo falhou (${response.status}).`);

    const payload = await response.json() as { results?: TmdbItem[] };
    const results = (payload.results ?? [])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .filter((item) => !media_type || item.media_type === media_type)
      .slice(0, limit ?? 10)
      .map((item) => {
        const type = item.media_type === "movie" ? "movie" : "serie";
        return {
          id: String(item.id ?? ""),
          title: item.title ?? item.name ?? "Sem título",
          type,
          year: (item.release_date ?? item.first_air_date ?? "").slice(0, 4) || null,
          rating: typeof item.vote_average === "number" ? Math.round(item.vote_average * 10) / 10 : null,
          overview: item.overview || null,
          watch_url: item.id ? `${PUBLIC_SITE_URL}/watch/${type}/${item.id}` : null,
        };
      });

    return {
      content: [{ type: "text", text: results.length ? `${results.length} resultado(s) encontrado(s).` : "Nenhum resultado encontrado." }],
      structuredContent: { results },
    };
  },
});