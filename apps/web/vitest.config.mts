import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The same "@/..." import paths the app uses (tsconfig.json), so tests can import components.
export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } } });
