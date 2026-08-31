import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { clearTokens, getTokens, setTokens } from '@/lib/storage';
import type { AuthResult, SafeUser } from '@/types';

interface AuthContextValue {
  user: SafeUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { accessToken } = await getTokens();
      if (accessToken) {
        try {
          const me = await apiFetch<SafeUser>('/auth/me', { auth: true });
          setUser(me);
        } catch {
          await clearTokens();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const result = await apiFetch<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }

  async function register(input: { email: string; password: string; firstName: string; lastName: string }) {
    const result = await apiFetch<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }

  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST', auth: true });
    } catch {
      // best-effort — clear local session regardless of server response
    }
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { ApiError };
