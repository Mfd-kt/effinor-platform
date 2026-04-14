import type { Database } from "@/types/database.types";

export type InstalledProductRow = Database["public"]["Tables"]["installed_products"]["Row"];

export type InstalledProductListRow = InstalledProductRow & {
  product_label: string | null;
};

export type ProductOption = {
  id: string;
  brand: string;
  reference: string;
  name: string;
};

export type InstalledProductFormOptions = {
  products: ProductOption[];
};

export type InstalledProductDetailRow = InstalledProductRow & {
  products: { id: string; brand: string; reference: string; name: string } | null;
};
