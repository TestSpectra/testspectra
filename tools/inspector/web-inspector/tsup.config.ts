import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["bin/web-inspector.ts"],
  format: ["esm"],
  dts: true,
  outDir: "dist/bin",
  clean: true,
  tsconfig: "tsconfig.app.json",
  bundle: true,
  noExternal: ["cac"],
  minify: false,
  splitting: false,
});
