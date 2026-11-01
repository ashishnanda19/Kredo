import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The Kredo app icon as a data URI, for the generated icon routes (app/icon.tsx, app/apple-icon.tsx). Reads the brand
 * file in public/brand so there is one source of truth. `square` drops the tile's rounded corners, for iOS home-screen
 * icons (the system rounds them itself; transparent corners would render black).
 */
export async function brandIconDataUri({ square = false }: { square?: boolean } = {}) {
  let svg = await readFile(path.join(process.cwd(), "public/brand/kredo-icon-yellow-black.svg"), "utf8");
  if (square) svg = svg.replace(`rx="116"`, `rx="0"`);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
