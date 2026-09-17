import { useCSSVariable } from "uniwind";

const variables = [
  "--color-canvas",
  "--color-surface",
  "--color-selected",
  "--color-border",
  "--color-border-strong",
  "--color-ink",
  "--color-muted",
  "--color-placeholder",
  "--color-primary",
  "--color-primary-foreground",
  "--color-accent",
  "--color-accent-ink",
  "--color-sales-ink",
  "--color-focus",
  "--color-destructive",
  "--color-destructive-foreground"
];

const fallback = {
  canvas: "#f5f5f2",
  surface: "#ffffff",
  selected: "#d8ded7",
  border: "#d8d5cc",
  "border-strong": "#999487",
  ink: "#20231f",
  muted: "#4d544c",
  placeholder: "#4d544c",
  primary: "#283129",
  "primary-foreground": "#ffffff",
  accent: "#b6532b",
  "accent-ink": "#76351f",
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
  return {
    canvas: color(values[0], fallback.canvas),
    surface: color(values[1], fallback.surface),
    selected: color(values[2], fallback.selected),
    border: color(values[3], fallback.border),
    "border-strong": color(values[4], fallback["border-strong"]),
    ink: color(values[5], fallback.ink),
    muted: color(values[6], fallback.muted),
    placeholder: color(values[7], fallback.placeholder),
    primary: color(values[8], fallback.primary),
    "primary-foreground": color(values[9], fallback["primary-foreground"]),
    accent: color(values[10], fallback.accent),
    "accent-ink": color(values[11], fallback["accent-ink"]),
    "sales-ink": color(values[12], fallback["sales-ink"]),
    focus: color(values[13], fallback.focus),
    destructive: color(values[14], fallback.destructive),
    "destructive-foreground": color(values[15], fallback["destructive-foreground"])
  };
}
