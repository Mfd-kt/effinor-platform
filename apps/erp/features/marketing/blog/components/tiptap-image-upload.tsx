"use client"

import { useRef } from "react"
import { ImageIcon, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

import { useMediaUpload } from "../../lib/use-media-upload"

interface TipTapImageUploadProps {
  entityId?: string
  onInsert: (url: string) => void
  className?: string
}

/**
 * Bouton upload image pour la toolbar TipTap.
 * Upload vers marketing-media/blog/{entityId}/ puis insère l'URL dans l'éditeur.
 */
export function TipTapImageUpload({
  entityId,
  onInsert,
  className,
}: TipTapImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const { uploading, uploadFromEvent } = useMediaUpload({
    folder: "blog",
    entityId,
    onSuccess: (url) => onInsert(url),
  })

  return (
    <>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          inputRef.current?.click()
        }}
        disabled={uploading}
        title={uploading ? "Upload en cours…" : "Insérer une image (upload)"}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded border border-border px-2 text-xs font-medium transition-colors",
          "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5" />
        )}
        {uploading ? "Upload…" : "Image"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={uploadFromEvent}
        disabled={uploading}
      />
    </>
  )
}
