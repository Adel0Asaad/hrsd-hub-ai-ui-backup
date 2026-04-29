import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Globe, Menu } from "lucide-react";

interface ChatHeaderProps {
  onMenuClick: () => void;
}

const ChatHeader = ({ onMenuClick }: ChatHeaderProps) => {
  const { t, lang, setLang } = useLanguage();
  const { isDark, toggleDark } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-foreground leading-tight">{t("appTitle")}</h1>
          <span className="text-[11px] text-muted-foreground hidden sm:block">{t("appSubtitle")}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="flex items-center gap-1 px-2.5 py-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground"
          aria-label={t("language")}
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium">{lang === "ar" ? "EN" : "\u0639\u0631\u0628\u064A"}</span>
        </button>
        <button
          onClick={toggleDark}
          className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground"
          aria-label={t("darkMode")}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
