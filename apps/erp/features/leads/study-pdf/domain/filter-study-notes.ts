/**
 * Retire les notes internes triviales ou parasites susceptibles d'apparaître par erreur dans le PDF.
 */
const PARASITE_LINE = /^(bonjour|salut|coucou|merci|ok|test|\.{2,})\.?$/i;

export function filterParasiteNotes(notes: string[]): string[] {
  return notes
    .map((n) => n.replace(/\s+/g, " ").trim())
    .filter((n) => n.length >= 4)
    .filter((n) => !PARASITE_LINE.test(n));
}
