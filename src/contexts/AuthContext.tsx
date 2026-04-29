import React, { createContext, useContext, useState, useCallback } from "react";
import { login as apiLogin, type UserProfile, ApiError } from "@/services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  /** Attempts login. Returns null on success, or an error message on failure. */
  login: (userId: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const STORAGE_KEY_AUTH = "hrsd-auth";
const STORAGE_KEY_USER = "hrsd-user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Narrow a persisted profile to the current shape. Any profile that still
 * carries the legacy `prompt` field or is missing `role` is treated as
 * stale and purged so the user re-logs in and picks up the server-side
 * prompt policy.
 */
function hydratePersistedUser(): UserProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.role !== "string" ||
      "prompt" in parsed
    ) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem(STORAGE_KEY_USER);
      return null;
    }
    return parsed as UserProfile;
  } catch {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_USER);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => hydratePersistedUser());
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY_AUTH) === "true",
  );

  const login = useCallback(async (userId: string, password: string): Promise<string | null> => {
    try {
      const profile = await apiLogin(userId, password);
      setIsAuthenticated(true);
      setUser(profile);
      localStorage.setItem(STORAGE_KEY_AUTH, "true");
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
      return null; // success
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) return "USER_NOT_FOUND";
        return err.message;
      }
      return "NETWORK_ERROR";
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_USER);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
