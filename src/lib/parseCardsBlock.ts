// lib/parseCardsBlock.ts
//
// Extracts the ```cards fenced JSON block the ai-gateway appends to
// assistant messages whenever a tool call declared an `_meta.render`
// hint (see ai-gateway/src/orchestrator/chat.orchestrator.ts —
// CARDS_FENCE / appendCardsBlocks).
//
// Why a fenced code block?
//   * Round-trips safely through the existing chat history (plain text
//     over JSON). No schema change to the /chat response envelope.
//   * If the frontend doesn't understand it (older client, preview
//     renderer), users just see a small code block rather than
//     garbled markup — it degrades gracefully.
//
// Why "cards" rather than "devices"?
//   The gateway no longer hardcodes any tool. It now appends one or
//   more generic `{kind, items}` envelopes — the `kind` field drives
//   how this client renders them (gallery today, chips/carousel/etc.
//   tomorrow). The parser deliberately stops at extraction: routing
//   on `kind` is the view layer's job.

export interface CardItem {
  /** Canonical item code, e.g. "WHEELCHAIR". */
  code: string;
  /** Human-readable name, typically Arabic. */
  name: string;
}

export interface CardsBlock {
  /**
   * Opaque render kind declared by the backend tool's `_meta.render`.
   * Current kinds: "gallery". Future kinds might be "chips",
   * "carousel", etc. The frontend routes on this — never the tool name.
   */
  kind: string;
  items: CardItem[];
}

export interface ParsedCardsMessage {
  /** Visible text with the fenced block(s) removed. */
  text: string;
  /** Parsed card blocks in the order they appeared, or null when none. */
  cards: CardsBlock[] | null;
}

// `([\s\S]*?)` rather than `.*?` so newlines are matched — fenced code
// blocks span multiple lines by definition. The leading `\s*` after
// the tag absorbs an optional newline in case the gateway writes
// ```cards\n[...] vs. ```cards [...]\n — both occur in practice.
// The `g` flag is required so we can extract every block when a single
// reply contains more than one renderable tool result.
const CARDS_BLOCK_RE = /```cards\s*\n([\s\S]*?)```/g;

/**
 * Parse an assistant message's raw content, separating any renderable
 * card blocks from the surrounding prose.
 *
 * Never throws — malformed payloads fall through to `{text, null}` so
 * the chat never shows a broken state because of a bad fence.
 */
export function extractCardsBlocks(content: string): ParsedCardsMessage {
  // Reset lastIndex defensively — the regex is declared at module scope
  // with the /g flag, so every exec loop must start from zero.
  CARDS_BLOCK_RE.lastIndex = 0;

  const cards: CardsBlock[] = [];
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = CARDS_BLOCK_RE.exec(content)) !== null) {
    matches.push(m);
  }
  if (matches.length === 0) return { text: content, cards: null };

  for (const match of matches) {
    const payload = match[1]?.trim();
    if (!payload) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      // Bad JSON — skip this block, keep scanning the rest.
      continue;
    }

    const block = toCardsBlock(parsed);
    if (block) cards.push(block);
  }

  if (cards.length === 0) {
    // No block parsed successfully — leave the text intact so the
    // fences remain visible for debugging rather than silently stripped.
    return { text: content, cards: null };
  }

  // Strip every recognised fence. We do this by running the same regex
  // a second time so the text output matches exactly the blocks we
  // actually consumed.
  const stripped = content.replace(CARDS_BLOCK_RE, "").trimEnd();
  return { text: stripped, cards };
}

/**
 * Coerces an arbitrary JSON value into a well-formed CardsBlock or
 * returns null. Tolerant on purpose — the gateway owns the canonical
 * shape but we accept a couple of fallbacks so a minor wire change
 * doesn't break chat rendering.
 */
function toCardsBlock(raw: unknown): CardsBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  // Canonical shape: {kind, items: [{code, name}, ...]}
  const kind = typeof o.kind === "string" && o.kind.length > 0 ? o.kind : null;
  if (!kind) return null;

  const rawItems = Array.isArray(o.items) ? o.items : null;
  if (!rawItems) return null;

  const items: CardItem[] = [];
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const code = typeof e.code === "string" ? e.code.trim() : "";
    const name = typeof e.name === "string" ? e.name.trim() : "";
    if (code && name) items.push({ code, name });
  }
  if (items.length === 0) return null;

  return { kind, items };
}
