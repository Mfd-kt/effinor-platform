import {
  removeTechnicalVisitMediaFileAction,
  uploadTechnicalVisitMediaFilesAction,
} from "@/features/technical-visits/actions/technical-visit-media-storage";
import type { TechnicalVisitMediaKind } from "@/features/technical-visits/lib/technical-visit-media-shared";

export {
  buildTechnicalVisitMediaObjectFileName,
  TECHNICAL_VISIT_MEDIA_BUCKET,
  TECHNICAL_VISIT_MEDIA_KINDS,
  TECHNICAL_VISIT_MEDIA_MAX_BYTES,
  parseTechnicalVisitMediaPublicStorageUrl,
  storagePathFromTechnicalVisitMediaPublicUrl,
  type TechnicalVisitMediaKind,
} from "@/features/technical-visits/lib/technical-visit-media-shared";

export async function uploadFilesToTechnicalVisitMedia(
  visitId: string,
  kind: TechnicalVisitMediaKind,
  files: File[],
): Promise<{ urls: string[]; error?: string }> {
  const urls: string[] = [];
  const batchBase = Date.now();

  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.set("visitId", visitId);
    formData.set("kind", kind);
    formData.set("batchBase", String(batchBase));
    formData.set("fileIndex", String(i));
    formData.append("files", files[i]);
    const { urls: nextUrls, error } = await uploadTechnicalVisitMediaFilesAction(formData);
    if (error) {
      return { urls, error };
    }
    urls.push(...nextUrls);
  }

  return { urls };
}

export async function removeFileFromTechnicalVisitMedia(
  publicUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  return removeTechnicalVisitMediaFileAction(publicUrl);
}
