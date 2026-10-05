// Node 24's type stripping keeps utility/API tests dependency-free.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

registerHooks({
  resolve(specifier, context, nextResolve) {
    // Package internals retain Node's ESM/CommonJS resolution and export detection.
    if (context.parentURL?.includes("/node_modules/")) return nextResolve(specifier, context);
    let candidate = specifier;
    if (specifier.startsWith("@/")) {
      candidate = pathToFileURL(resolve("src", specifier.slice(2))).href;
    }
    if (candidate.startsWith(".") || candidate.startsWith("file:")) {
      const url = new URL(candidate, context.parentURL);
      for (const suffix of ["", ".ts", ".tsx", "/index.ts"]) {
        const target = new URL(url.href + suffix);
        if (existsSync(fileURLToPath(target))) {
          return nextResolve(target.href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  }
});
