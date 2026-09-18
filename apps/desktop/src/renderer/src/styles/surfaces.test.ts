import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Read the shipped recipes rather than duplicating palette values in the tests.
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const recipes = css.slice(css.indexOf("/* Recompute derived colors"), css.indexOf("@theme inline"));
const declarations = (body: string): Record<string, string> =>
  Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()])
  );
const palette = declarations(
  css.slice(css.indexOf(":root {"), css.indexOf("/* Recompute derived colors"))
);
type Lab = [number, number, number];

function resolve(value: string, tokens: Record<string, string>, seen: string[] = []): Lab {
  const variable = /^var\((--[\w-]+)\)$/.exec(value);
  if (variable) {
    const key = variable[1]!;
    if (!tokens[key] || seen.includes(key)) throw new Error(`Missing or circular token: ${key}`);
    return resolve(tokens[key]!, tokens, [...seen, key]);
  }
  const color = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (color) {
    const angle = (Number(color[3]) * Math.PI) / 180;
    return [
      Number(color[1]) / 100,
      Number(color[2]) * Math.cos(angle),
      Number(color[2]) * Math.sin(angle)
    ];
  }
  const mix = /^color-mix\(in oklab, (var\(--[\w-]+\)), (var\(--[\w-]+\)) ([\d.]+)%\)$/.exec(value);
  if (mix) {
    const a = resolve(mix[1]!, tokens, seen);
    const b = resolve(mix[2]!, tokens, seen);
    const weight = Number(mix[3]) / 100;
    return a.map((v, i) => v * (1 - weight) + b[i]! * weight) as Lab;
  }
  throw new Error(`Unsupported color recipe: ${value}`);
}

function linearRgb([L, a, b]: Lab): Lab {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
}
const luminance = (color: Lab): number => {
  const [r, g, b] = linearRgb(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: Lab, b: Lab): number => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
};

for (const surface of [
  "canvas",
  "panel",
  "overlay",
  "selected",
  "complete",
  "partial",
  "inverse"
]) {
  describe(`${surface} surface`, () => {
    const tokens = { ...palette };
    for (const rule of recipes.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (rule[1]!.includes(":root") || rule[1]!.includes(`[data-surface="${surface}"]`)) {
        Object.assign(tokens, declarations(rule[2]!));
      }
    }
    const color = (name: string): Lab => resolve(`var(--${name})`, tokens);

    it("keeps foreground and supporting text readable across interaction states", () => {
      for (const foreground of ["context-foreground", "context-muted"]) {
        for (const background of [
          "surface-local",
          "context-hover",
          "context-selected",
          "context-pressed",
          "context-control"
        ]) {
          expect(
            contrast(color(foreground), color(background)),
            `${foreground} on ${background}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(
        contrast(color("context-placeholder"), color("context-control"))
      ).toBeGreaterThanOrEqual(4.5);
    });

    it("keeps field boundaries and keyboard focus visible", () => {
      for (const foreground of ["context-border", "context-border-hover", "context-focus"]) {
        for (const background of ["surface-local", "context-control"]) {
          expect(
            contrast(color(foreground), color(background)),
            `${foreground} on ${background}`
          ).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it("uses sRGB-safe colors and distinct hover, selection, and press steps", () => {
      for (const name of Object.keys(tokens).filter((key) => key.startsWith("--context-"))) {
        for (const channel of linearRgb(resolve(tokens[name]!, tokens))) {
          expect(channel, name).toBeGreaterThanOrEqual(-0.0001);
          expect(channel, name).toBeLessThanOrEqual(1.0001);
        }
      }
      const direction = surface === "inverse" ? 1 : -1;
      expect(
        (color("context-selected")[0] - color("context-hover")[0]) * direction
      ).toBeGreaterThan(0.02);
      expect(
        (color("context-pressed")[0] - color("context-selected")[0]) * direction
      ).toBeGreaterThan(0.015);
    });
  });
}
