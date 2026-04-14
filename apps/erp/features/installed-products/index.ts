export { createInstalledProduct } from "@/features/installed-products/actions/create-installed-product";
export { updateInstalledProduct } from "@/features/installed-products/actions/update-installed-product";
export { InstalledProductForm } from "@/features/installed-products/components/installed-product-form";
export { InstalledProductRelationsSection } from "@/features/installed-products/components/installed-product-relations-section";
export { InstalledProductSummaryCards } from "@/features/installed-products/components/installed-product-summary-cards";
export { InstalledProductsFilters } from "@/features/installed-products/components/installed-products-filters";
export { InstalledProductsTable } from "@/features/installed-products/components/installed-products-table";
export { getInstalledProductById } from "@/features/installed-products/queries/get-installed-product-by-id";
export { getInstalledProductFormOptions } from "@/features/installed-products/queries/get-installed-product-form-options";
export { getInstalledProducts } from "@/features/installed-products/queries/get-installed-products";
export {
  InstalledProductInsertSchema,
  InstalledProductUpdatePayloadSchema,
} from "@/features/installed-products/schemas/installed-product.schema";
export type {
  InstalledProductFormInput,
  InstalledProductInsertInput,
  InstalledProductUpdatePayload,
} from "@/features/installed-products/schemas/installed-product.schema";
export type {
  InstalledProductDetailRow,
  InstalledProductFormOptions,
  InstalledProductListRow,
  InstalledProductRow,
} from "@/features/installed-products/types";
