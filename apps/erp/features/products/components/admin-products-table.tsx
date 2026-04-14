"use client";

import Image from "next/image";
import Link from "next/link";
import { Package, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/types/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type Props = {
  products: ProductRow[];
};

export function AdminProductsTable({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
        <Package className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Aucun produit</p>
      </div>
    );
  }

  return (
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
        {products.map((p) => (
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
              {p.product_family ?? "—"}
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
  );
}
