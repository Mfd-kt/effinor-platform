"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Star, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  uploadProductImageAction,
  deleteProductImageAction,
  setProductCoverImageAction,
} from "@/features/products/actions/product-admin-actions";
import type { Database } from "@/types/database.types";

type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];

type Props = {
  productId: string;
  images: ImageRow[];
};

export function ProductImageGallery({ productId, images: initialImages }: Props) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const newImages: ImageRow[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.set("productId", productId);
      fd.set("file", file);
      fd.set("isCover", images.length === 0 && i === 0 ? "true" : "false");

      const result = await uploadProductImageAction(fd);
      if (result.url) {
        newImages.push({
          id: crypto.randomUUID(),
          product_id: productId,
          url: result.url,
          alt: file.name,
          sort_order: (images.length + i + 1) * 10,
          is_cover: images.length === 0 && i === 0,
          created_at: new Date().toISOString(),
        });
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      const res = await deleteProductImageAction(imageId, productId);
      if (res.ok) {
        setImages((prev) => prev.filter((i) => i.id !== imageId));
      }
    });
  }

  function handleSetCover(imageId: string) {
    startTransition(async () => {
      const res = await setProductCoverImageAction(imageId, productId);
      if (res.ok) {
        setImages((prev) =>
          prev.map((i) => ({ ...i, is_cover: i.id === imageId })),
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Galerie photos</h3>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
            ) : (
              <ImagePlus className="size-3.5" data-icon="inline-start" />
            )}
            {uploading ? "Envoi…" : "Ajouter des photos"}
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12">
          <ImagePlus className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Aucune photo — ajoutez des images pour constituer la galerie du produit
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border bg-muted"
            >
              <div className="relative aspect-square">
                <Image
                  src={img.url}
                  alt={img.alt ?? "Photo produit"}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>

              {img.is_cover && (
                <div className="absolute left-2 top-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-semibold text-primary-foreground">
                    <Star className="size-2.5 fill-current" />
                    Couverture
                  </span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.is_cover && (
                  <Button
                    variant="secondary"
                    size="icon-xs"
                    title="Définir comme couverture"
                    disabled={pending}
                    onClick={() => handleSetCover(img.id)}
                  >
                    <Star className="size-3" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon-xs"
                  title="Supprimer"
                  disabled={pending}
                  onClick={() => handleDelete(img.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
