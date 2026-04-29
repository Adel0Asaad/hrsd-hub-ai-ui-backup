import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  /**
   * When this object changes reference, the input's value is replaced
   * with `prefill.text` and the textarea is focused. Use a fresh
   * object (e.g. `{ text, nonce: Date.now() }`) to trigger again with
   * the same text, otherwise React's prop identity check will skip the
   * effect.
   */
  prefill?: { text: string; nonce: number } | null;
  /** Fired once the prefill has been applied — lets the parent clear its state. */
  onPrefillConsumed?: () => void;
}

const ChatInput = ({ onSend, disabled, prefill, onPrefillConsumed }: ChatInputProps) => {
  const { t, lang } = useLanguage();
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  // Prefill driven by the parent (e.g. clicking "Select" on a device
  // card). We bind on the prefill object identity so the parent can
  // trigger the same text twice in a row with a fresh nonce.
  useEffect(() => {
    if (!prefill) return;
    setValue(prefill.text);
    // Focus and move the caret to the end on the next paint so the
    // textarea resize effect has a chance to run first.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const len = prefill.text.length;
      try {
        el.setSelectionRange(len, len);
      } catch {
        /* Some browsers throw if the element isn't yet rendered; harmless. */
      }
    });
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "ar" ? "ar-SA" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setValue(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="bg-background/80 backdrop-blur-xl px-4 py-3 shrink-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-card rounded-2xl border border-border p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
          {/* Speech button */}
          <button
            onClick={toggleSpeech}
            className={`p-2.5 rounded-xl transition-colors shrink-0 ${
              isListening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "hover:bg-accent text-muted-foreground"
            }`}
            aria-label={isListening ? t("listening") : t("voiceInput")}
            title={isListening ? t("listening") : t("voiceInput")}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatPlaceholder")}
            rows={1}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none text-sm py-2.5 px-1 max-h-[120px]"
            dir="auto"
            disabled={disabled}
            aria-label={t("chatPlaceholder")}
          />

          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 shrink-0"
            aria-label={t("send")}
          >
            <Send className={`w-5 h-5 ${lang === "ar" ? "rotate-180" : ""}`} />
          </button>
        </div>
        {isListening && (
          <p className="text-xs text-destructive text-center mt-2 animate-pulse">{t("listening")}</p>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
