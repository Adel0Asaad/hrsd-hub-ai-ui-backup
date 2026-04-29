import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Navigate } from "react-router-dom";
import { Sun, Moon, Globe, ArrowRight } from "lucide-react";
import HrsdLogo from "@/components/HrsdLogo";

const Login = () => {
  const { t, lang, setLang } = useLanguage();
  const { isAuthenticated, login } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/chat" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password.trim()) {
      setError(lang === "ar" ? "\u064A\u0631\u062C\u0649 \u062A\u0639\u0628\u0626\u0629 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644" : "Please fill in all fields");
      return;
    }

    setLoading(true);
    const errorCode = await login(userId.trim(), password);
    setLoading(false);

    if (errorCode) {
      if (errorCode === "USER_NOT_FOUND") {
        setError(lang === "ar" ? "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" : "User not found");
      } else if (errorCode === "NETWORK_ERROR") {
        setError(lang === "ar" ? "\u062A\u0639\u0630\u0631 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u062E\u0627\u062F\u0645" : "Could not connect to the server");
      } else {
        setError(lang === "ar" ? "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639" : "An unexpected error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-end px-6 py-4">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDark}
            className="p-2.5 rounded-xl hover:bg-accent transition-colors"
            aria-label={t("darkMode")}
          >
            {isDark ? <Sun className="w-[18px] h-[18px] text-muted-foreground" /> : <Moon className="w-[18px] h-[18px] text-muted-foreground" />}
          </button>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors text-sm text-muted-foreground"
            aria-label={t("language")}
          >
            <Globe className="w-[18px] h-[18px]" />
            {lang === "ar" ? "EN" : "\u0639\u0631\u0628\u064A"}
          </button>
        </div>
      </div>

      {/* Login content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-5">
              <HrsdLogo className="h-14" />
            </div>
            <h1 className="text-xl font-bold text-foreground font-hrsd-title">{t("appTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">{t("appSubtitle")}</p>
          </div>

          {/* Login card */}
          <div className="bg-card rounded-2xl p-7 shadow-sm border border-border">
            <h2 className="text-base font-semibold text-card-foreground mb-0.5">{t("welcomeBack")}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t("loginDescription")}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-foreground mb-2">
                  {t("userId")}
                </label>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                  placeholder="u100"
                  dir="ltr"
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  {t("password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-3 py-2 animate-fade-in" role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {t("loginBtn")}
                    <ArrowRight className={`w-4 h-4 ${lang === "ar" ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
