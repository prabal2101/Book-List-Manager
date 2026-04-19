import { useEffect, useState } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";
import { useGetMe } from "@workspace/api-client-react";

export function setupAuth() {
  setAuthTokenGetter(() => localStorage.getItem("library_token"));
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("library_token"));
  
  const { data: user, isLoading, isError, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("library_token", token);
      refetch();
    } else {
      localStorage.removeItem("library_token");
    }
  }, [token, refetch]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    window.location.href = "/login";
  };

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !isError,
    login,
    logout,
  };
}
