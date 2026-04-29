import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatHeader from "@/components/ChatHeader";
import WelcomeScreen from "@/components/WelcomeScreen";
import FileUpload from "@/components/FileUpload";
import { sendMessage, type ChatMessageDto } from "@/services/api";
import type { CardItem } from "@/lib/parseCardsBlock";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
}

const Chat = () => {
  const { lang } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Prefill trigger for ChatInput — bumped via nonce so the same text
  // can be re-applied on repeated card selections.
  const [inputPrefill, setInputPrefill] = useState<
    { text: string; nonce: number } | null
  >(null);
  // Uploaded files ready to be sent with the next message
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conversation history sent to the ai-gateway for multi-turn context.
  const historyRef = useRef<ChatMessageDto[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(async (content: string) => {
    // Clear any previous error.
    setError(null);

    // 1. Show the user message immediately.
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // 2. Call the ai-gateway with optional file IDs.
      //    Only the coarse role is sent — the gateway owns prompt policy.
      const validFileIds = uploadedFiles
        .map(f => f.id)
        .filter((id): id is string => id != null && id !== '');
      const fileIds = validFileIds.length > 0 ? validFileIds : undefined;
        
      const response = await sendMessage(
        content,
        user?.role || undefined,
        historyRef.current,
        undefined,
        user?.id,
        fileIds,
      );

      // 3. Store the updated history for the next turn.
      historyRef.current = response.history;

      // 4. Show the assistant response.
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      
      // 5. Clear uploaded files after successful send.
      setUploadedFiles([]);
    } catch (err: any) {
      const fallback =
        lang === "ar"
          ? "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628\u0643. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649."
          : "Something went wrong while processing your request. Please try again.";
      setError(err?.message ?? fallback);
    } finally {
      setIsTyping(false);
    }
  }, [user, lang, uploadedFiles]);

  /**
   * Called when a file is successfully uploaded. If the last assistant 
   * message requested an upload, automatically send it to the chat.
   * Otherwise, just store it for the next user message.
   */
  const handleFileUploaded = useCallback((fileId: string, fileName: string) => {
    // Validate fileId - check type and value
    if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
      console.error('Invalid fileId received:', fileId, typeof fileId);
      setError(lang === "ar" 
        ? "حدث خطأ في رفع الملف" 
        : "File upload failed - invalid file ID");
      return;
    }
    
    // Clear any previous errors since upload was successful
    setError(null);
    
    // Check if the last assistant message requested a file upload
    setMessages(currentMessages => {
      const lastAssistantMsg = [...currentMessages].reverse().find(m => m.role === "assistant");
      const uploadKeywords = /upload|attach|provide|send|submit.*document|medical.*report|file/i;
      const wasRequested = lastAssistantMsg && uploadKeywords.test(lastAssistantMsg.content);
      
      if (wasRequested) {
        // LLM requested the file - auto-send immediately
        const autoMessage = lang === "ar" 
          ? `تم رفع الملف: ${fileName}`
          : `Uploaded: ${fileName}`;
        
        // Add user message showing the upload
        const userMsg: Message = {
          id: `upload-${Date.now()}`,
          role: "user",
          content: `📎 ${autoMessage}`,
          timestamp: new Date(),
        };
        
        // Trigger automatic send with the uploaded file
        setIsTyping(true);
        sendMessage(
          autoMessage,
          user?.role || undefined,
          historyRef.current,
          undefined,
          user?.id,
          [fileId],
        ).then(response => {
          historyRef.current = response.history;
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response.text,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMsg]);
        }).catch(err => {
          const fallback = lang === "ar"
            ? "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى."
            : "Something went wrong while processing your request. Please try again.";
          setError(err?.message ?? fallback);
        }).finally(() => {
          setIsTyping(false);
        });
        
        return [...currentMessages, userMsg];
      } else {
        // User uploaded proactively - just store it, don't add a message
        // The file chips will show in the FileUpload component
        setUploadedFiles(prev => [...prev, { id: fileId, name: fileName }]);
        return currentMessages;
      }
    });
  }, [lang, user]);

  /**
   * Remove an uploaded file before sending.
   */
  const handleRemoveFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id && f.id !== fileId));
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    setError(null);
    setSidebarOpen(false);
    setInputPrefill(null);
    setUploadedFiles([]);
  }, []);

  /**
   * When the user clicks "Select" on a card in an assistant reply, we
   * surface the item name in the composer so they can refine the
   * query before sending. We prefill (not auto-send) on purpose — the
   * user may want to add context ("I need a WHEELCHAIR under 2000 SAR").
   */
  const handleSelectCard = useCallback((item: CardItem) => {
    setInputPrefill({ text: item.name, nonce: Date.now() });
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative z-40 h-full transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0"}`}>
        <ChatSidebar onNewChat={handleNewChat} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={handleSend} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
              {messages.map((msg) => (
                <ChatMessage 
                  key={msg.id}
                  message={msg} 
                  onSelectCard={handleSelectCard}
                />
              ))}

              {/* Error banner */}
              {error && !isTyping && (
                <div className="flex justify-center py-2 animate-fade-in">
                  <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">
                    {error}
                  </p>
                </div>
              )}

              {isTyping && (
                <div className="flex gap-3 animate-fade-in py-3" style={{ direction: "ltr" }}>
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <img src="/favicon.png" alt="" className="w-5 h-5 object-contain" />
                  </div>
                  <div className="bg-chat-bot rounded-2xl rounded-tl-md border border-border px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area with file upload */}
        <div className="border-t border-border shrink-0">
          <div className="max-w-3xl mx-auto px-4 pt-2">
            <FileUpload
              onFileUploaded={handleFileUploaded}
              uploadedFiles={uploadedFiles}
              onRemoveFile={handleRemoveFile}
              disabled={isTyping}
            />
          </div>
          <ChatInput
            onSend={handleSend}
            disabled={isTyping}
            prefill={inputPrefill}
            onPrefillConsumed={() => setInputPrefill(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
