import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { userInfo as userInfoService } from "../services/user.service";
import type { User } from "../types/user";

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loadingPage: boolean;
  getUserInfo: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const getUserInfo = useCallback(async () => {
    try {
      const result = await userInfoService();

      if (result.message === "SUCCESS") {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Get user info error:", error);
      setUser(null);
    } finally {
      setLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loadingPage,
        getUserInfo,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used inside a UserProvider");
  }

  return context;
}
