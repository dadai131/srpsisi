import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function AgentLogin() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }
    window.location.assign(next);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-sm border border-border bg-card p-6 rounded-lg shadow-2xl">
        <p className="text-sm font-semibold text-primary mb-2">LokiFilmes</p>
        <h1 className="text-2xl font-bold text-foreground">Entrar para conectar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use sua conta para autorizar a integração solicitada.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm text-foreground">E-mail
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-foreground" />
          </label>
          <label className="block text-sm text-foreground">Senha
            <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-foreground" />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Entrar
          </Button>
        </form>
        <Button asChild variant="ghost" className="mt-3 w-full"><Link to="/">Cancelar</Link></Button>
      </section>
    </main>
  );
}