import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Shield, LogOut, Home, User, ChevronDown } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title = 'Painel Admin' }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAdminAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4 mr-2" />
            Ver Site
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline text-foreground">
                Admin
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">
                Administrador
              </p>
              <p className="text-xs text-muted-foreground">
                Conta protegida
              </p>
            </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
