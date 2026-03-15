import { createContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api, { getStoredAuthToken, setAuthToken } from "../services/api";
import type { AuthResponse, CurrentUserResponse, User, UserType } from "../types";

interface AuthContextValue {
  currentUser: User | null;
  authToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    userType: UserType;
  }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(() => getStoredAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrapAuth = async (): Promise<void> => {
      if (!authToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get<CurrentUserResponse>("/auth/me");
        setCurrentUser(data.user);
      } catch {
        setCurrentUser(null);
        setAuthTokenState(null);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrapAuth();
  }, [authToken]);

  const login = async (email: string, password: string): Promise<void> => {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    setAuthTokenState(data.token);
    setAuthToken(data.token);
    setCurrentUser(data.user);
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    userType: UserType;
  }): Promise<void> => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    setAuthTokenState(data.token);
    setAuthToken(data.token);
    setCurrentUser(data.user);
  };

  const logout = (): void => {
    setCurrentUser(null);
    setAuthTokenState(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      currentUser,
      authToken,
      isLoading,
      login,
      register,
      logout,
    }),
    [authToken, currentUser, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
