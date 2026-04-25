"use client"

import { useRef } from "react"
import Image from "next/image"
import { ImageIcon, Loader2, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { useMediaUpload } from "../lib/use-media-upload"
import type { UploadFolder } from "../lib/upload-media"

interface ImageUploaderProps {
  folder: UploadFolder
  entityId?: string
  value: string | null | undefined
  onChange: (url: string | null) => void
  label?: string
  hint?: string
  className?: string
}

export function ImageUploader({
  folder,
  entityId,
  value,
  onChange,
  label,
  hint,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const { uploading, uploadFromEvent, dropProps } = useMediaUpload({
    folder,
    entityId,
    onSuccess: (url) => onChange(url),
  })

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      ) : null}

      {value ? (
        // Prévisualisation + actions
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="relative aspect-video bg-muted">
            <Image
              src={value}
              alt="Aperçu"
              fill
              className="object-cover"
              sizes="400px"
              unoptimized
            />
          </div>
          <div className="flex items-center gap-2 border-t border-border bg-muted/50 px-3 py-2">
            <p className="flex-1 truncate text-xs text-muted-foreground">
              {value.split("/").pop()}
            </p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" />
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Remplacer
            </button>
          </div>
        </div>
      ) : (
        // Zone de drop / browse
        <div
          {...dropProps}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading) {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-colors",
            "hover:border-secondary-400 hover:bg-secondary-50/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            uploading && "cursor-not-allowed opacity-60",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload en cours…</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">
                  Glisser-déposer ou{" "}
                  <span className="text-secondary-700">parcourir</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {hint ?? "JPG, PNG, WebP, GIF ou SVG — 10 MB max"}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={uploadFromEvent}
        disabled={uploading}
      />
    </div>
  )
}
