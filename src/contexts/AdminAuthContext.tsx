import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logAuditAction: (action: string, details?: Record<string, unknown>) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      return data === true;
    } catch (err) {
      console.error('Error in checkAdminRole:', err);
      return false;
    }
  }, []);

  const logAuditAction = useCallback(async (action: string, details?: Record<string, unknown>) => {
    if (!user) return;
    
    try {
      await supabase.from('admin_audit_logs').insert([{
        user_id: user.id,
        action,
        details: (details || {}) as unknown as Record<string, never>,
        user_agent: navigator.userAgent
      }]);
    } catch (err) {
      console.error('Error logging audit action:', err);
    }
  }, [user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Defer admin check with setTimeout to avoid deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            checkAdminRole(currentSession.user.id).then(setIsAdmin);
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        checkAdminRole(existingSession.user.id).then((result) => {
          setIsAdmin(result);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (!error) {
        // Log successful login after a short delay
        setTimeout(async () => {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            await supabase.from('admin_audit_logs').insert([{
              user_id: currentUser.id,
              action: 'admin_login',
              details: { action_type: 'login_success' } as unknown as Record<string, never>,
              user_agent: navigator.userAgent
            }]);
          }
        }, 100);
      }
      
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  };

  const signOut = async () => {
    if (user) {
      await logAuditAction('admin_logout');
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AdminAuthContext.Provider value={{
      user,
      session,
      isAdmin,
      isLoading,
      signIn,
      signOut,
      logAuditAction
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
