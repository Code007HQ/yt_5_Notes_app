// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import path from "path-browserify"; // ✅ Use path-browserify instead
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.url, "./src"), // ✅ Fix __dirname issue
    },
  },
});
