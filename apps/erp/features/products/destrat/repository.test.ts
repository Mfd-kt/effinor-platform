import { describe, expect, it } from "vitest";

import { createLocalDestratProductRepository } from "./repository";

describe("createLocalDestratProductRepository", () => {
  const repo = createLocalDestratProductRepository();

  it("getById retourne un produit connu", () => {
    const p = repo.getById("generfeu");
    expect(p).not.toBeNull();
    expect(p?.id).toBe("generfeu");
    expect(p?.name).toContain("Generfeu");
  });

  it("getById retourne null pour id inconnu", () => {
    expect(repo.getById("not_in_catalog" as never)).toBeNull();
  });

  it("getByIds déduplique et trie par sortOrder", () => {
    const list = repo.getByIds(["generfeu", "teddington_ds3", "generfeu"]);
    expect(list.map((p) => p.id)).toEqual(["teddington_ds3", "generfeu"]);
  });

  it("getByIds vide retourne tableau vide", () => {
    expect(repo.getByIds([])).toEqual([]);
  });
});
