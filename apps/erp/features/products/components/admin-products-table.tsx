"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Package, Pencil, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { productFamilyLabel } from "@/features/products/lib/product-taxonomy";
import type { Database } from "@/types/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type Props = {
  products: ProductRow[];
};

function normalizeSearch(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function AdminProductsTable({ products }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return products;
    return products.filter((p) => {
      const hay = [
        p.name,
        p.brand,
        p.product_code,
        p.product_family ?? "",
        p.reference,
      ]
        .join(" ")
        .toLowerCase();
      const n = hay.normalize("NFD").replace(/\p{M}/gu, "");
      return n.includes(q);
    });
  }, [products, query]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
        <Package className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Aucun produit</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, marque, code, famille…"
          className="ps-9"
          aria-label="Rechercher un produit"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">
            Aucun produit ne correspond à « {query} ».
          </p>
          <p className="text-xs text-muted-foreground">
            Vérifiez l’orthographe ou créez le produit s’il n’existe pas encore.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {filtered.length === products.length
            ? `${products.length} produit${products.length > 1 ? "s" : ""}`
            : `${filtered.length} sur ${products.length} produit${products.length > 1 ? "s" : ""}`}
        </p>
      )}
      {filtered.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Famille</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Prix HT</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        className="object-contain p-1"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="size-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/settings/products/${p.id}`}
                    className="hover:underline"
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.brand}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {p.product_code}
                  </code>
                </TableCell>
            <TableCell className="text-muted-foreground">
              {productFamilyLabel(p.product_family)}
            </TableCell>
                <TableCell className="text-center">
                  <Badge variant={p.is_active ? "default" : "secondary"}>
                    {p.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.default_price_ht != null
                    ? new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 0,
                      }).format(p.default_price_ht)
                    : "—"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/settings/products/${p.id}`}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
