import { useEffect, useState, useCallback } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "student" | "librarian" | "admin";
  createdAt?: string;
}

const TOKEN_KEY = "library_token";
const USER_KEY = "library_user";

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setupAuth() {
  setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return {
    user,
    token,
    isLoading: false,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };
}
