import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listLiveChannelsTool from "./tools/list-live-channels";
import searchCatalogTool from "./tools/search-catalog";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "lokifil1",
  title: "lokifil1",
  version: "0.1.0",
  instructions: "Ferramentas do LokiFilmes para buscar filmes e séries e consultar a lista pública de canais ao vivo.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchCatalogTool, listLiveChannelsTool],
});