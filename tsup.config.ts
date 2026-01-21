import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: "build",
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: false,
    minify: false,
    noExternal: ["chai"],
    external: ["k6", "k6/execution"],
});