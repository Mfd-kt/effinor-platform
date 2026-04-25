"use client";

export type StepIllustrationProps = {
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  sellingPoint?: string;
};

export function StepIllustration({
  imageSrc,
  imageAlt,
  title,
  description,
  sellingPoint,
}: StepIllustrationProps) {
  if (!imageSrc && !title && !description && !sellingPoint) return null;

  return (
    <div className="mx-auto mb-6 flex max-w-md flex-col items-center gap-4 px-4 py-6">
      {imageSrc ? (
        <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt ?? title ?? ""}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : null}
      {title ? (
        <h3 className="text-center text-lg font-bold text-violet-950">{title}</h3>
      ) : null}
      {description ? (
        <p className="text-center text-sm leading-relaxed text-slate-600">{description}</p>
      ) : null}
      {sellingPoint ? (
        <div className="rounded-r-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-2 text-sm italic text-amber-900">
          💡 {sellingPoint}
        </div>
      ) : null}
    </div>
  );
}
