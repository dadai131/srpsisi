import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = { redirect_url?: string; redirect_to?: string };
type AuthorizationDetails = OAuthResult & { client?: { name?: string } };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const oauth = (supabase.auth as typeof supabase.auth & { oauth: OAuthApi }).oauth;

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!authorizationId) {
        setError("Solicitação de autorização ausente.");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/agent-login?next=${encodeURIComponent(next)}`);
        return;
      }
      const result = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (result.error) {
        setError(result.error.message);
        return;
      }
      const immediate = result.data?.redirect_url ?? result.data?.redirect_to;
      if (immediate && !result.data?.client) {
        window.location.assign(immediate);
        return;
      }
      setDetails(result.data);
    })();
    return () => { active = false; };
  }, [authorizationId, oauth]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const result = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (result.error) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    const target = result.data?.redirect_url ?? result.data?.redirect_to;
    if (!target) {
      setError("O serviço de autorização não informou o endereço de retorno.");
      setBusy(false);
      return;
    }
    window.location.assign(target);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-lg border border-border bg-card p-6 rounded-lg shadow-2xl">
        <ShieldCheck className="h-9 w-9 text-primary" />
        {error ? (
          <><h1 className="mt-4 text-xl font-bold text-foreground">Não foi possível autorizar</h1><p role="alert" className="mt-2 text-sm text-destructive">{error}</p></>
        ) : !details ? (
          <div className="mt-4 flex items-center gap-3 text-muted-foreground"><Loader2 className="animate-spin" /> Carregando solicitação…</div>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Conectar {details.client?.name ?? "um aplicativo"}</h1>
            <p className="mt-3 text-muted-foreground">Esta conexão poderá pesquisar o catálogo e consultar a lista pública de canais como você.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" disabled={busy} onClick={() => void decide(false)}>Negar</Button>
              <Button disabled={busy} onClick={() => void decide(true)}>{busy && <Loader2 className="animate-spin" />}Autorizar</Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}