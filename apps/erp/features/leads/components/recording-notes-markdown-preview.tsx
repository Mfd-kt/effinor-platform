"use client";

import type { ReactNode } from "react";

/**
 * Rendu léger du markdown type « analyse appel » (titres ##, listes -, paragraphes).
 * Sans dépendance react-markdown.
 */
export function RecordingNotesMarkdownPreview({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Aucun contenu — lancez l&apos;analyse depuis un fichier audio ci-dessus.
      </p>
    );
  }

  const lines = trimmed.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  function flushList() {
    if (!listBuffer.length) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="my-2 list-disc space-y-1 pl-5 text-muted-foreground">
        {listBuffer.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("## ")) {
      flushList();
      blocks.push(
        <h3
          key={`h-${key++}`}
          className="mt-5 scroll-mt-4 border-b border-border pb-1.5 text-base font-semibold tracking-tight text-foreground first:mt-0"
        >
          {t.slice(3)}
        </h3>,
      );
      continue;
    }
    if (t.startsWith("- ") || t.startsWith("* ")) {
      listBuffer.push(t.slice(2).trim());
      continue;
    }
    flushList();
    if (t === "") {
      blocks.push(<div key={`sp-${key++}`} className="h-2" />);
    } else {
      blocks.push(
        <p key={`p-${key++}`} className="text-sm leading-relaxed text-muted-foreground">
          {line}
        </p>,
      );
    }
  }
  flushList();

  return (
    <div className="max-h-[min(70vh,36rem)] overflow-y-auto rounded-lg border border-border bg-muted/15 px-4 py-3 shadow-inner">
      <div className="space-y-0.5">{blocks}</div>
    </div>
  );
}
