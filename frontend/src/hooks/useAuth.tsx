import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { authService } from '../services/authService';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(() => authService.getUser());
  const [loading, setLoading] = useState(false);

  // Sync user state when storage changes (multi-tab)
  useEffect(() => {
    const onStorage = () => setUser(authService.getUser());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ username, password });
      authService.setSession(data.accessToken, data.refreshToken, data.user);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = authService.getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignore network errors on logout
    } finally {
      authService.clear();
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: string) => user?.roles?.includes(role) || user?.roles?.includes(role.replace('ROLE_', '')) || false,
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => roles.some((r) => user?.roles?.includes(r) || user?.roles?.includes(r.replace('ROLE_', ''))),
    [user]
  );

  const updateLocalUser = useCallback((newUserData: any) => {
    const currentAccessToken = authService.getAccessToken();
    const currentRefreshToken = authService.getRefreshToken();
    if (currentAccessToken && currentRefreshToken) {
      authService.setSession(currentAccessToken, currentRefreshToken, newUserData);
    }
    setUser(newUserData);
  }, []);

  const isAuthenticated = !!user && authService.isAuthenticated();

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, hasRole, hasAnyRole, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
