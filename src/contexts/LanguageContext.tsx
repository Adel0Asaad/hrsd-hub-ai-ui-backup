import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ar" | "en";

interface Translations {
  [key: string]: { ar: string; en: string };
}

const translations: Translations = {
  appTitle: { ar: "المساعد الذكي", en: "AI Assistant" },
  appSubtitle: { ar: "قطاع التنمية الاجتماعية", en: "Social Development Sector" },
  ministry: { ar: "وزارة الموارد البشرية والتنمية الاجتماعية", en: "Ministry of Human Resources and Social Development" },
  login: { ar: "تسجيل الدخول", en: "Login" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  userId: { ar: "معرف المستخدم", en: "User ID" },
  loginBtn: { ar: "دخول", en: "Sign In" },
  forgotPassword: { ar: "نسيت كلمة المرور؟", en: "Forgot password?" },
  welcomeBack: { ar: "مرحباً بعودتك", en: "Welcome back" },
  loginDescription: { ar: "قم بتسجيل الدخول للوصول إلى المساعد الذكي", en: "Sign in to access the AI assistant" },
  chatPlaceholder: { ar: "اكتب رسالتك هنا...", en: "Type your message here..." },
  send: { ar: "إرسال", en: "Send" },
  newChat: { ar: "محادثة جديدة", en: "New Chat" },
  history: { ar: "السجل", en: "History" },
  settings: { ar: "الإعدادات", en: "Settings" },
  logout: { ar: "تسجيل الخروج", en: "Logout" },
  darkMode: { ar: "الوضع الداكن", en: "Dark Mode" },
  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },
  accessibility: { ar: "إمكانية الوصول", en: "Accessibility" },
  fontSize: { ar: "حجم الخط", en: "Font Size" },
  greeting: { ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟", en: "Hello! How can I help you today?" },
  suggestServices: { ar: "استعراض الخدمات", en: "Browse services" },
  suggestFaq: { ar: "الأسئلة الشائعة", en: "FAQ" },
  suggestSupport: { ar: "الدعم الفني", en: "Technical support" },
  suggestGuide: { ar: "دليل الاستخدام", en: "User guide" },
  voiceInput: { ar: "الإدخال الصوتي", en: "Voice input" },
  listening: { ar: "جارٍ الاستماع...", en: "Listening..." },
  chatHistory: { ar: "سجل المحادثات", en: "Chat History" },
  today: { ar: "اليوم", en: "Today" },
  yesterday: { ar: "أمس", en: "Yesterday" },
  older: { ar: "أقدم", en: "Older" },
  noHistory: { ar: "لا توجد محادثات سابقة", en: "No previous conversations" },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("hrsd-lang") as Language) || "ar";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("hrsd-lang", lang);
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang, dir]);

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
