import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { setApiToken } from "../api/client";
import { loginUser, registerUser } from "../api/resources";
import type { AuthTokens } from "../api/types";
import { deleteTokenItem, getTokenItem, setTokenItem } from "./tokenStorage";

const ACCESS_TOKEN_KEY = "insta_fastapi_access_token";
const REFRESH_TOKEN_KEY = "insta_fastapi_refresh_token";

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (login: string, password: string) => Promise<void>;
  signUp: (data: { phone_number: string; username: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function saveTokens(tokens: AuthTokens) {
  await setTokenItem(ACCESS_TOKEN_KEY, tokens.access_token);
  await setTokenItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStoredTokens() {
      try {
        const [storedAccess, storedRefresh] = await Promise.all([
          getTokenItem(ACCESS_TOKEN_KEY),
          getTokenItem(REFRESH_TOKEN_KEY),
        ]);

        if (!mounted) {
          return;
        }

        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        setApiToken(storedAccess);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadStoredTokens();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (login: string, password: string) => {
    const tokens = await loginUser({ login, password });
    await saveTokens(tokens);
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
    setApiToken(tokens.access_token);
  }, []);

  const signUp = useCallback(async (data: { phone_number: string; username: string; password: string }) => {
    await registerUser(data);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      deleteTokenItem(ACCESS_TOKEN_KEY),
      deleteTokenItem(REFRESH_TOKEN_KEY),
    ]);
    setAccessToken(null);
    setRefreshToken(null);
    setApiToken(null);
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [accessToken, refreshToken, isLoading, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
