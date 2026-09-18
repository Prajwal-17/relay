import { useCSSVariable } from "uniwind";

const variables = [
  "--color-canvas",
  "--color-surface",
  "--color-surface-muted",
  "--color-selected",
  "--color-border",
  "--color-frame",
  "--color-border-strong",
  "--color-ink",
  "--color-muted",
  "--color-placeholder",
  "--color-primary",
  "--color-primary-foreground",
  "--color-accent",
  "--color-accent-ink",
  "--color-accent-soft",
  "--color-sales-soft",
  "--color-sales-ink",
  "--color-focus",
  "--color-destructive",
  "--color-destructive-foreground"
];

const fallback = {
  canvas: "#f5f5f2",
  surface: "#ffffff",
  "surface-muted": "#e8ebe6",
  selected: "#d8ded7",
  border: "#d8d5cc",
  frame: "#c3bfb4",
  "border-strong": "#999487",
  ink: "#20231f",
  muted: "#4d544c",
  placeholder: "#4d544c",
  primary: "#283129",
  "primary-foreground": "#ffffff",
  accent: "#b6532b",
  "accent-ink": "#76351f",
  "accent-soft": "#fbe9e1",
  "sales-soft": "#e3f5ef",
  "sales-ink": "#0b5c43",
  focus: "#b6532b",
  destructive: "#9b342a",
  "destructive-foreground": "#ffffff"
} as const;

export type Palette = { [Key in keyof typeof fallback]: string };

function color(value: string | number | undefined, defaultValue: string): string {
  return typeof value === "string" ? value : defaultValue;
}

/** Resolves UniWind theme variables for native props that cannot use className. */
export function usePalette(): Palette {
  const values = useCSSVariable(variables);
  return Object.fromEntries(
    Object.keys(fallback).map((key, index) => [
      key,
      color(values[index], fallback[key as keyof typeof fallback])
    ])
  ) as Palette;
}
