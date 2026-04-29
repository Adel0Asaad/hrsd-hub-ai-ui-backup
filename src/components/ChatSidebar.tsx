import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Plus, MessageSquare, Settings, LogOut, Sun, Moon, Globe, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import HrsdLogo from "@/components/HrsdLogo";

interface ChatSidebarProps {
  onNewChat: () => void;
  onClose: () => void;
}

const ChatSidebar = ({ onNewChat, onClose }: ChatSidebarProps) => {
  const { t, lang, setLang } = useLanguage();
  const { logout, user } = useAuth();
  const { isDark, toggleDark, fontSize, setFontSize } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const mockHistory = [
    { id: "1", title: lang === "ar" ? "\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0627\u0644\u062E\u062F\u0645\u0627\u062A" : "Service inquiry", group: "today" },
    { id: "2", title: lang === "ar" ? "\u0637\u0644\u0628 \u062F\u0639\u0645 \u0641\u0646\u064A" : "Technical support request", group: "today" },
    { id: "3", title: lang === "ar" ? "\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u0627\u0644\u0623\u0647\u0644\u064A\u0629" : "Eligibility query", group: "yesterday" },
  ];

  return (
    <div className="w-72 h-full bg-card border-e border-border flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <HrsdLogo className="h-7" />
        <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-accent rounded-xl text-muted-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New chat button */}
      <div className="px-3 mb-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:bg-accent active:scale-[0.98] transition-all text-sm font-medium text-foreground"
        >
          <Plus className="w-4 h-4" />
          {t("newChat")}
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">{t("today")}</p>
        {mockHistory.filter((h) => h.group === "today").map((item) => (
          <button key={item.id} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-sm text-foreground truncate mb-0.5">
            <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.title}</span>
          </button>
        ))}
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 mt-3">{t("yesterday")}</p>
        {mockHistory.filter((h) => h.group === "yesterday").map((item) => (
          <button key={item.id} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-sm text-foreground truncate mb-0.5">
            <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.title}</span>
          </button>
        ))}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-t border-border p-3 space-y-3 animate-fade-in">
          {/* Dark mode */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{t("darkMode")}</span>
            <button onClick={toggleDark} className="p-2 rounded-xl hover:bg-accent transition-colors text-foreground">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          {/* Language */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{t("language")}</span>
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-accent transition-colors text-sm text-foreground"
            >
              <Globe className="w-4 h-4" />
              {lang === "ar" ? "EN" : "\u0639\u0631\u0628\u064A"}
            </button>
          </div>
          {/* Font size */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{t("fontSize")}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="w-7 h-7 rounded-lg hover:bg-accent text-foreground text-sm transition-colors">-</button>
              <span className="text-sm text-muted-foreground w-6 text-center">{fontSize}</span>
              <button onClick={() => setFontSize(Math.min(22, fontSize + 1))} className="w-7 h-7 rounded-lg hover:bg-accent text-foreground text-sm transition-colors">+</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-0.5">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-sm text-foreground"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          {t("settings")}
          <ChevronDown className={`w-3.5 h-3.5 ms-auto text-muted-foreground transition-transform ${showSettings ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-destructive/10 transition-colors text-sm text-destructive"
        >
          <LogOut className="w-4 h-4" />
          {t("logout")}
        </button>
        {user && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {user.name} <span className="opacity-60">({user.id})</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
