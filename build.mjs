// Builds the modular tracker: dist/t-core.js, dist/t-<module>.js, the full
// dist/tracker.js (core + every module, for old inline tags) and dist/sizes.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";

const here = dirname(fileURLToPath(import.meta.url));
const root = here;

export const MODULES = ["outbound", "downloads", "rage", "errors", "vitals", "heatmap"];

async function min(file) {
  const src = readFileSync(join(here, "src", file), "utf8");
  const out = await minify(src, {
    ecma: 2017,
    compress: { passes: 3, pure_getters: true, ecma: 2017 },
    mangle: { toplevel: true },
    format: { comments: false },
  });
  return out.code;
}

const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;

export async function buildTracker() {
  const core = await min("core.js");
  const modules = {};
  for (const m of MODULES) modules[m] = await min(`modules/${m}.js`);
  const full = [core, ...MODULES.map((m) => modules[m])].join("\n");
  const sizes = {
    core: gz(core),
    modules: Object.fromEntries(MODULES.map((m) => [m, gz(modules[m])])),
    full: gz(full),
    rawCore: Buffer.byteLength(core),
    rawFull: Buffer.byteLength(full),
  };
  return { core, modules, full, sizes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { core, modules, full, sizes } = await buildTracker();
  const pub = join(root, "dist");
  mkdirSync(pub, { recursive: true });
  writeFileSync(join(pub, "t-core.js"), core);
  for (const m of MODULES) writeFileSync(join(pub, `t-${m}.js`), modules[m]);
  writeFileSync(join(pub, "tracker.js"), full);
  writeFileSync(join(root, "dist", "sizes.json"), JSON.stringify(sizes, null, 2) + "\n");
  console.log("tracker gzip -9 bytes:", JSON.stringify(sizes));
}
