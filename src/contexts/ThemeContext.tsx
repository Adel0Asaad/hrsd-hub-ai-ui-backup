import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("hrsd-dark") === "true");
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("hrsd-font-size")) || 16);

  useEffect(() => {
    localStorage.setItem("hrsd-dark", String(isDark));
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("hrsd-font-size", String(fontSize));
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const toggleDark = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
