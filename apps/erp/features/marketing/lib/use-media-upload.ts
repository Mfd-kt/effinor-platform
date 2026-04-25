"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

import {
  uploadMarketingMedia,
  validateImageFile,
  type UploadFolder,
} from "./upload-media"

interface UseMediaUploadOptions {
  folder: UploadFolder
  entityId?: string
  onSuccess?: (url: string, path: string) => void
}

interface UseMediaUploadReturn {
  uploading: boolean
  upload: (file: File) => Promise<{ url: string; path: string } | null>
  uploadFromEvent: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<{ url: string; path: string } | null>
  dropProps: {
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => Promise<void>
  }
}

export function useMediaUpload({
  folder,
  entityId = "new",
  onSuccess,
}: UseMediaUploadOptions): UseMediaUploadReturn {
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(
    async (file: File): Promise<{ url: string; path: string } | null> => {
      const validationError = validateImageFile(file)
      if (validationError) {
        toast.error(validationError)
        return null
      }

      setUploading(true)
      const toastId = toast.loading("Upload en cours…")

      try {
        // Client Supabase browser AUTHENTIFIÉ (session cookie) — RLS staff marketing
        const supabase = await createClient()

        const result = await uploadMarketingMedia(
          supabase,
          file,
          folder,
          entityId,
        )

        if (!result.ok) {
          toast.error(result.error, { id: toastId })
          return null
        }

        toast.success("Image uploadée", { id: toastId })
        onSuccess?.(result.url, result.path)
        return { url: result.url, path: result.path }
      } catch (err) {
        console.error("[useMediaUpload]", err)
        toast.error("Erreur inattendue lors de l'upload", { id: toastId })
        return null
      } finally {
        setUploading(false)
      }
    },
    [folder, entityId, onSuccess],
  )

  const uploadFromEvent = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return null
      // Reset pour pouvoir re-uploader le même fichier
      e.target.value = ""
      return upload(file)
    },
    [upload],
  )

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
    onDrop: async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files[0]
      if (file) {
        await upload(file)
      }
    },
  }

  return { uploading, upload, uploadFromEvent, dropProps }
}
