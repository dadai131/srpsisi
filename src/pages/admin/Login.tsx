import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Validation schema
const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  password: z.string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(128, 'Senha muito longa')
});

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 60000; // 1 minute

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, isAdmin, isLoading } = useAdminAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Check lockout status
  useEffect(() => {
    if (lockedUntil && Date.now() >= lockedUntil) {
      setLockedUntil(null);
      setAttempts(0);
    }
  }, [lockedUntil]);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Check lockout
    if (isLocked) {
      setError('Muitas tentativas. Aguarde antes de tentar novamente.');
      return;
    }

    // Validate inputs
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') errors.email = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_TIME);
          setError('Muitas tentativas falhas. Conta bloqueada temporariamente.');
        } else {
          // Generic error message to prevent user enumeration
          setError('Credenciais inválidas. Verifique seu email e senha.');
        }
      } else {
        toast({
          title: 'Login realizado',
          description: 'Bem-vindo ao painel administrativo.'
        });
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Painel Administrativo
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Faça login para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || isLocked}
                className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground ${
                  fieldErrors.email ? 'border-destructive' : ''
                }`}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isLocked}
                  className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10 ${
                    fieldErrors.password ? 'border-destructive' : ''
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLocked}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            {isLocked && (
              <p className="text-sm text-center text-muted-foreground">
                Bloqueado por {Math.ceil((lockedUntil! - Date.now()) / 1000)} segundos
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Voltar para o site
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
