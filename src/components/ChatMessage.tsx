import type { Message } from "@/pages/Chat";
import { User } from "lucide-react";
import DeviceGallery from "./DeviceGallery";
import { extractCardsBlocks, type CardItem, type CardsBlock } from "@/lib/parseCardsBlock";

interface ChatMessageProps {
  message: Message;
  /**
   * Invoked when the user clicks the "Select" button on a card in a
   * rendered block. The page-level component uses this to prefill the
   * chat input with the selected item's name.
   */
  onSelectCard?: (item: CardItem) => void;
}

const ChatMessage = ({ message, onSelectCard }: ChatMessageProps) => {
  const isUser = message.role === "user";

  // Assistant messages may carry one or more ```cards fenced blocks
  // (see lib/parseCardsBlock.ts). Parsing is a no-op when absent, so
  // this is always safe to run — it just returns the original text
  // with a null cards list, which is the pre-feature behaviour.
  const { text, cards } = isUser
    ? { text: message.content, cards: null }
    : extractCardsBlocks(message.content);

  // Use physical direction (left/right) so layout is independent of RTL/LTR.
  // User messages always on the RIGHT, bot messages always on the LEFT.
  return (
    <div
      className="flex gap-3 py-3 animate-fade-in"
      style={{ direction: "ltr" }}
    >
      {/* Bot avatar (left side) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
          <img src="/favicon.png" alt="" className="w-5 h-5 object-contain" />
        </div>
      )}

      {/* Spacer to push user messages to the right */}
      {isUser && <div className="flex-1" />}

      {/*
        Content column. We wrap the bubble and the (optional) card
        blocks in a single flex column so the blocks sit directly
        under the textual reply, still capped at the same 75% width.
        The gallery overflows horizontally within that cap.
      */}
      <div
        className={`max-w-[75%] flex flex-col gap-2 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {text.length > 0 && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-md"
                : "bg-chat-bot text-chat-bot-foreground rounded-tl-md border border-border"
            }`}
            dir="auto"
          >
            {text}
          </div>
        )}
        {cards && cards.length > 0 && (
          <div className="w-full space-y-2">
            {cards.map((block, i) => (
              <CardBlock
                key={i}
                block={block}
                onSelect={onSelectCard}
              />
            ))}
          </div>
        )}
      </div>

      {/* User avatar (right side) */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};

/**
 * Routes a CardsBlock to the appropriate renderer based on its `kind`.
 * Falls through to the gallery layout for unknown kinds so new
 * backend render hints degrade gracefully rather than disappearing.
 */
const CardBlock = ({
  block,
  onSelect,
}: {
  block: CardsBlock;
  onSelect?: (item: CardItem) => void;
}) => {
  switch (block.kind) {
    case "gallery":
    default:
      return <DeviceGallery items={block.items} onSelect={onSelect} />;
  }
};

export default ChatMessage;
