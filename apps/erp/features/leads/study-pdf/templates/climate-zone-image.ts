import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Returns the climate-zone map image as a base64 data-URI.
 * Re-reads from disk each time to avoid stale cache during dev.
 */
export function getClimateZoneDataUri(): string {
  try {
    const imgPath = join(process.cwd(), "public", "images", "zone-climatique.png");
    const buf = readFileSync(imgPath);
    const header = buf.slice(0, 3);
    const mime =
      header[0] === 0xff && header[1] === 0xd8 ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}
