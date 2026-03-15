import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";

interface AuthContextValue {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
    }),
    [currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

