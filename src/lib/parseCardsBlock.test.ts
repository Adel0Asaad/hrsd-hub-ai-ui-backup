import { describe, it, expect } from "vitest";
import { extractCardsBlocks } from "./parseCardsBlock";

describe("extractCardsBlocks", () => {
  it("returns the content unchanged when there is no fenced block", () => {
    const input = "Here's a plain reply with no cards.";
    const { text, cards } = extractCardsBlocks(input);
    expect(text).toBe(input);
    expect(cards).toBeNull();
  });

  it("extracts a well-formed cards block and strips it from the text", () => {
    const input = [
      "Here are the available assistive devices:",
      "",
      "```cards",
      '{"kind":"gallery","items":[',
      '{"code":"WHEELCHAIR","name":"كرسي متحرك"},',
      '{"code":"WALKER","name":"مشاية"}',
      "]}",
      "```",
    ].join("\n");

    const { text, cards } = extractCardsBlocks(input);

    expect(text).toBe("Here are the available assistive devices:");
    expect(cards).toEqual([
      {
        kind: "gallery",
        items: [
          { code: "WHEELCHAIR", name: "كرسي متحرك" },
          { code: "WALKER", name: "مشاية" },
        ],
      },
    ]);
  });

  it("preserves kind so the view layer can route on it", () => {
    const input = '```cards\n{"kind":"chips","items":[{"code":"A","name":"a"}]}\n```';
    const { cards } = extractCardsBlocks(input);
    expect(cards).toHaveLength(1);
    expect(cards![0].kind).toBe("chips");
  });

  it("extracts multiple blocks in order when a reply has several", () => {
    const input = [
      "Intro.",
      "```cards",
      '{"kind":"gallery","items":[{"code":"A","name":"a"}]}',
      "```",
      "Some interstitial prose.",
      "```cards",
      '{"kind":"chips","items":[{"code":"B","name":"b"}]}',
      "```",
    ].join("\n");
    const { text, cards } = extractCardsBlocks(input);
    expect(cards).toHaveLength(2);
    expect(cards![0].kind).toBe("gallery");
    expect(cards![1].kind).toBe("chips");
    // Both fences removed; prose preserved.
    expect(text).not.toMatch(/```cards/);
    expect(text).toContain("Intro.");
    expect(text).toContain("Some interstitial prose.");
  });

  it("ignores malformed JSON inside the fence and leaves the text intact", () => {
    const input = "Intro\n\n```cards\nnot valid json\n```";
    const { text, cards } = extractCardsBlocks(input);
    expect(text).toBe(input);
    expect(cards).toBeNull();
  });

  it("ignores a block that lacks a kind", () => {
    const input = '```cards\n{"items":[{"code":"A","name":"a"}]}\n```';
    const { text, cards } = extractCardsBlocks(input);
    expect(text).toBe(input);
    expect(cards).toBeNull();
  });

  it("ignores a block whose items array is missing or non-array", () => {
    const input =
      '```cards\n{"kind":"gallery","items":"nope"}\n```';
    const { cards } = extractCardsBlocks(input);
    expect(cards).toBeNull();
  });

  it("filters out entries missing code or name", () => {
    const input = [
      "```cards",
      '{"kind":"gallery","items":[',
      '{"code":"WHEELCHAIR","name":"كرسي متحرك"},',
      '{"code":""},{"name":"orphan"},null',
      "]}",
      "```",
    ].join("\n");

    const { cards } = extractCardsBlocks(input);
    expect(cards).toEqual([
      {
        kind: "gallery",
        items: [{ code: "WHEELCHAIR", name: "كرسي متحرك" }],
      },
    ]);
  });

  it("returns null when the filtered items array is empty", () => {
    const input =
      '```cards\n{"kind":"gallery","items":[{"code":""},{"name":""}]}\n```';
    const { text, cards } = extractCardsBlocks(input);
    expect(text).toBe(input);
    expect(cards).toBeNull();
  });

  it("tolerates extra whitespace inside and around the fence", () => {
    const input =
      'Prose.\n\n```cards\n   \n{ "kind": "gallery", "items": [ { "code": "WHEELCHAIR", "name": "كرسي متحرك" } ] }\n\n```\n';
    const { text, cards } = extractCardsBlocks(input);
    expect(text).toBe("Prose.");
    expect(cards).toEqual([
      {
        kind: "gallery",
        items: [{ code: "WHEELCHAIR", name: "كرسي متحرك" }],
      },
    ]);
  });

  it("resets lastIndex between calls so the /g regex is reusable", () => {
    const input =
      '```cards\n{"kind":"gallery","items":[{"code":"A","name":"a"}]}\n```';
    // Run twice — if we didn't reset lastIndex, the second call would miss.
    const first = extractCardsBlocks(input);
    const second = extractCardsBlocks(input);
    expect(first.cards).toHaveLength(1);
    expect(second.cards).toHaveLength(1);
    expect(second.cards![0].items[0].code).toBe("A");
  });
});
