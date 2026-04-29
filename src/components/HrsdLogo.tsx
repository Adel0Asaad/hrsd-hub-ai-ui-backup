import { useLanguage } from "@/contexts/LanguageContext";

interface HrsdLogoProps {
  className?: string;
}

const HrsdLogo = ({ className = "h-8" }: HrsdLogoProps) => {
  const { lang } = useLanguage();
  const src = lang === "ar" ? "/hrsd-logo-ar.png" : "/hrsd-logo-en.png";
  const alt =
    lang === "ar"
      ? "الموارد البشرية والتنمية الاجتماعية"
      : "Human Resources and Social Development";

  return <img src={src} alt={alt} className={className} />;
};

export default HrsdLogo;
