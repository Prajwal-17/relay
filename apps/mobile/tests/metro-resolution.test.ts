import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

type Resolution = { type: "sourceFile"; filePath: string };
type Context = { originModulePath: string; resolveRequest: Resolver };
type Resolver = (context: Context, moduleName: string, platform: string) => Resolution;

const require = createRequire(import.meta.url);
const config: {
  projectRoot: string;
  resolver: { resolveRequest: Resolver };
} = require(fileURLToPath(new URL("../metro.config.js", import.meta.url)));
const nativeEntry = require.resolve("react-native");
const adapter = join(dirname(require.resolve("uniwind/package.json")), "src/components/index.ts");
const adapterSource = readFileSync(adapter, "utf8");
const nativeModules = { RegressionTest: {} };
const baseResolver: Resolver = (_context, moduleName) => ({
  type: "sourceFile",
  filePath: moduleName === "uniwind/components" ? adapter : nativeEntry
});

function resolve(originModulePath: string, moduleName: string, platform = "android") {
  return config.resolver.resolveRequest(
    { originModulePath, resolveRequest: baseResolver },
    moduleName,
    platform
  );
}

test("app imports still receive UniWind's styled native components", () => {
  assert.equal(
    resolve(join(config.projectRoot, "src/app/_layout.tsx"), "react-native").filePath,
    adapter
  );
});

for (const platform of ["android", "ios"]) {
  for (const origin of [
    adapter,
    join(config.projectRoot, "node_modules/uniwind/src/components/index.ts"),
    join(
      config.projectRoot,
      "node_modules/.pnpm/uniwind@other-peer-version/node_modules/uniwind/src/components/index.ts"
    )
  ]) {
    test(`${platform}: NativeModules getter reaches React Native from ${origin}`, () => {
      const resolution = resolve(origin, "react-native", platform);
      assert.equal(resolution.filePath, nativeEntry);

      const module: { exports: { NativeModules?: typeof nativeModules } } = { exports: {} };
      runInNewContext(adapterSource, {
        module,
        require(specifier: string) {
          assert.equal(specifier, "react-native");
          return resolution.filePath === nativeEntry
            ? { NativeModules: nativeModules }
            : module.exports;
        }
      });
      assert.equal(module.exports.NativeModules, nativeModules);
    });
  }
}

test("web imports continue through UniWind's web resolver", () => {
  let requested: string | undefined;
  config.resolver.resolveRequest(
    {
      originModulePath: adapter,
      resolveRequest: (_context, moduleName) => {
        requested = moduleName;
        return { type: "sourceFile", filePath: nativeEntry };
      }
    },
    "react-native",
    "web"
  );
  assert.equal(requested, "react-native");
});
