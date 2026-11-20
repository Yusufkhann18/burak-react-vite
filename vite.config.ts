import react from "@vitejs/plugin-react"
import * as path from "node:path"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"
import packageJson from "./package.json" with { type: "json" }

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "BURAK_")
  const target = env.BURAK_BACKEND_URL || "http://localhost:3003"
  const proxy = {
    "^/api(?:/|$)": {
      target,
      changeOrigin: true,
      rewrite: (url: string) => url.replace(/^\/api(?=\/|$)/, ""),
    },
    "^/uploads(?:/|$)": { target, changeOrigin: true },
  }

  return {
    plugins: [react()],
    server: { open: true, proxy },
    preview: { proxy },

    test: {
      root: import.meta.dirname,
      name: packageJson.name,
      environment: "jsdom",

      typecheck: {
        enabled: true,
        tsconfig: path.join(import.meta.dirname, "tsconfig.json"),
      },

      globals: true,
      watch: false,
      setupFiles: ["./src/setupTests.ts"],
    },
  }
})
