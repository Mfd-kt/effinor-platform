"use client";

export default function LeadGenerationAnalyticsError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Erreur analytics lead-generation: {error.message}
      </p>
    </div>
  );
}
