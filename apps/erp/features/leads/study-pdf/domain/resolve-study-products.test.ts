import { describe, expect, it } from "vitest";

import {
  createLocalDestratProductRepository,
  DESTRAT_CATALOG,
  resolveProductImageUrl,
} from "../../../products";

import {
  parseDestratProductId,
  resolveDestratProductIdsForStudy,
  resolveStudyProductsForPdf,
} from "./resolve-study-products";

describe("parseDestratProductId", () => {
  it("normalise la casse et les espaces", () => {
    expect(parseDestratProductId("  GENERFEU ")).toBe("generfeu");
    expect(parseDestratProductId("teddington ds3")).toBe("teddington_ds3");
  });

  it("retourne null si non reconnu", () => {
    expect(parseDestratProductId("inconnu")).toBeNull();
    expect(parseDestratProductId(null)).toBeNull();
  });
});

describe("resolveProductImageUrl", () => {
  it("priorise imageUrl puis fallback", () => {
    const base = DESTRAT_CATALOG.generfeu;
    expect(resolveProductImageUrl({ ...base, imageUrl: "https://example.com/a.png", fallbackImageUrl: "https://example.com/b.png" })).toBe(
      "https://example.com/a.png",
    );
    expect(resolveProductImageUrl({ ...base, imageUrl: null, fallbackImageUrl: "https://example.com/b.png" })).toBe(
      "https://example.com/b.png",
    );
    expect(resolveProductImageUrl({ ...base, imageUrl: null, fallbackImageUrl: null })).toBeNull();
  });
});

describe("resolveDestratProductIdsForStudy", () => {
  it("combine modèle principal et ids additionnels sans doublon", () => {
    expect(resolveDestratProductIdsForStudy("generfeu", ["teddington_ds3", "generfeu"])).toEqual(["teddington_ds3", "generfeu"]);
  });

  it("retourne tableau vide si rien ne matche", () => {
    expect(resolveDestratProductIdsForStudy("xyz", null)).toEqual([]);
  });
});

describe("resolveStudyProductsForPdf", () => {
  it("mappe un modèle simulé vers un view model", () => {
    const vms = resolveStudyProductsForPdf("generfeu");
    expect(vms).toHaveLength(1);
    expect(vms[0].displayName).toContain("Generfeu");
    expect(vms[0].specsForDisplay.length).toBeGreaterThan(0);
    expect(vms[0].rationaleText.length).toBeGreaterThan(0);
  });

  it("retourne vide sans produit résolu", () => {
    expect(resolveStudyProductsForPdf("")).toEqual([]);
  });

  it("accepte plusieurs ids via extraProductIds", () => {
    const repo = createLocalDestratProductRepository();
    const vms = resolveStudyProductsForPdf("teddington_ds3", {
      extraProductIds: ["generfeu"],
      repository: repo,
    });
    expect(vms).toHaveLength(2);
    expect(vms.map((v) => v.id).sort()).toEqual(["generfeu", "teddington_ds3"]);
  });
});
