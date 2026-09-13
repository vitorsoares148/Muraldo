import { createContext, useCallback, useContext, type ReactNode } from "react";

import {
  login as loginService,
  register as registerService,
  logout as logoutService,
} from "../services/auth.service";

import { useUser } from "./UserContext";

interface AuthContextType {
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<string>;

  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<string>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, setUser, getUserInfo } = useUser();

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginService(username, password);

      if (result === "SUCCESS") {
        await getUserInfo();
      }

      return result;
    },
    [getUserInfo],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const result = await registerService(username, email, password);

      if (result === "SUCCESS") {
        await getUserInfo();
      }

      return result;
    },
    [getUserInfo],
  );

  const logout = useCallback(async () => {
    try {
      await logoutService();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
