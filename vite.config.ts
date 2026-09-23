import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages supplies its repository subpath; local and root hosting stay at /.
  base: process.env.PAGES_BASE_PATH || "/",
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
})
