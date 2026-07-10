const ACCESS_TOKEN_KEY = 'vdt_access_token';
const REFRESH_TOKEN_KEY = 'vdt_refresh_token';
const USER_KEY = 'vdt_user';

export const authService = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },

  setSession: (accessToken, refreshToken, user) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  updateAccessToken: (accessToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(ACCESS_TOKEN_KEY),

  hasRole: (role) => {
    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY));
      return user?.roles?.includes(role) ?? false;
    } catch {
      return false;
    }
  },

  hasAnyRole: (roles) => {
    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY));
      return roles.some((role) => user?.roles?.includes(role));
    } catch {
      return false;
    }
  },
};
