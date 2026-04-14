import {
  removeLeadMediaFileAction,
  uploadLeadMediaFilesAction,
} from "@/features/leads/actions/lead-media-storage";
import type { LeadMediaKind } from "@/features/leads/lib/lead-media-shared";

export {
  buildLeadMediaObjectFileName,
  LEAD_MEDIA_BUCKET,
  LEAD_MEDIA_KINDS,
  LEAD_MEDIA_MAX_BYTES,
  parseLeadMediaPublicStorageUrl,
  sanitizeFileName,
  storagePathFromLeadMediaPublicUrl,
  type LeadMediaKind,
} from "@/features/leads/lib/lead-media-shared";

export async function uploadFilesToLeadMedia(
  leadId: string,
  kind: LeadMediaKind,
  files: File[],
): Promise<{ urls: string[]; error?: string }> {
  const urls: string[] = [];
  const batchBase = Date.now();

  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.set("leadId", leadId);
    formData.set("kind", kind);
    formData.set("batchBase", String(batchBase));
    formData.set("fileIndex", String(i));
    formData.append("files", files[i]);
    const { urls: nextUrls, error } = await uploadLeadMediaFilesAction(formData);
    if (error) {
      return { urls, error };
    }
    urls.push(...nextUrls);
  }

  return { urls };
}

export async function removeFileFromLeadMedia(publicUrl: string): Promise<{ ok: boolean; error?: string }> {
  return removeLeadMediaFileAction(publicUrl);
}
