import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: path.join(root, "..", ".."),
  plugins: [react()],
  server: { port: 3003, strictPort: true },
  preview: { port: 3003, strictPort: true },
});
