"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadProductImageAction } from "@/features/products/actions/product-admin-actions";

type Props = {
  productId: string;
  currentImageUrl: string | null;
  productName: string;
};

export function ProductCoverUpload({ productId, currentImageUrl, productName }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("file", file);
    fd.set("isCover", "true");

    const result = await uploadProductImageAction(fd);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setPreviewUrl(result.url);
      router.refresh();
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={productName}
            fill
            className="object-contain p-4"
            sizes="320px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-16 text-muted-foreground/20" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="size-3.5" data-icon="inline-start" />
        {previewUrl ? "Changer la couverture" : "Ajouter une couverture"}
      </Button>

      {error && (
        <p className="rounded bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {error}
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Image de couverture
      </p>
    </div>
  );
}
