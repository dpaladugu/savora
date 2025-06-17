
import { supabase } from '@/integrations/supabase/client';
import { AuthUser } from './auth';

export class SupabaseAuthService {
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return {
      uid: user.id,
      email: user.email,
      displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || null
    };
  }

  static async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    return {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || null
    };
  }

  static async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    return {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || null
    };
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('savora-user');
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null
        };
        localStorage.setItem('savora-user', JSON.stringify(authUser));
        callback(authUser);
      } else {
        localStorage.removeItem('savora-user');
        callback(null);
      }
    });
  }

  static getStoredUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem('savora-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
