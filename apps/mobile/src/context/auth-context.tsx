import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_URL, apiFetch, ApiError } from '@/lib/api';
import { clearTokens, getTokens, setTokens } from '@/lib/storage';
import type { AuthResult, SafeUser } from '@/types';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  user: SafeUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (input: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  async function refreshUser() {
    const me = await apiFetch<SafeUser>('/auth/me', { auth: true });
    setUser(me);
  }

  async function login(email: string, password: string) {
    const result = await apiFetch<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }

  // Opens Google in the system browser; the API sends us back to this app through a
  // deep link carrying our session tokens (see AuthService.googleMobileCallback).
  async function loginWithGoogle() {
    const returnUrl = Linking.createURL('login');
    const result = await WebBrowser.openAuthSessionAsync(
      `${API_URL}/auth/google/mobile/start?returnUrl=${encodeURIComponent(returnUrl)}`,
      returnUrl,
    );
    if (result.type !== 'success') {
      return; // cancelled or dismissed
    }

    const { queryParams } = Linking.parse(result.url);
    if (queryParams?.error) {
      throw new Error(String(queryParams.error));
    }
    const accessToken = queryParams?.accessToken;
    const refreshToken = queryParams?.refreshToken;
    if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
      throw new Error('Google sign-in failed');
    }
    await setTokens(accessToken, refreshToken);
    await refreshUser();
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
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, register, logout, refreshUser }}>
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
