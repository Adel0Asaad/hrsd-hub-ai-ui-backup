import { useLanguage } from "@/contexts/LanguageContext";
import { MessageSquare, HelpCircle, Headphones, BookOpen } from "lucide-react";
import HrsdLogo from "@/components/HrsdLogo";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeScreen = ({ onSuggestionClick }: WelcomeScreenProps) => {
  const { t } = useLanguage();

  const suggestions = [
    { key: "suggestServices", icon: MessageSquare },
    { key: "suggestFaq", icon: HelpCircle },
    { key: "suggestSupport", icon: Headphones },
    { key: "suggestGuide", icon: BookOpen },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 animate-slide-up">
      <div className="flex justify-center mb-6">
        <HrsdLogo className="h-12" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1.5">{t("greeting")}</h2>
      <p className="text-sm text-muted-foreground mb-10 text-center max-w-md">{t("appSubtitle")}</p>

      <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {suggestions.map((s) => (
          <button
            key={s.key}
            onClick={() => onSuggestionClick(t(s.key))}
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-accent/50 active:scale-[0.97] transition-all text-sm group"
          >
            <s.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-medium text-foreground text-[13px]">{t(s.key)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
