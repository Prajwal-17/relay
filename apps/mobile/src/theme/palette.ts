import { useCSSVariable } from "uniwind";

export const COLORS = {
  background: "#f5f5f2",
  foreground: "#20231f",
  card: "#ffffff",
  muted: "#e8ebe6",
  "muted-foreground": "#4d544c",
  selected: "#d8ded7",
  border: "#d8d5cc",
  frame: "#c3bfb4",
  "border-strong": "#999487",
  placeholder: "#4d544c",
  primary: "#283129",
  "primary-foreground": "#ffffff",
  "counter-accent": "#b6532b",
  "counter-accent-foreground": "#76351f",
  "counter-accent-soft": "#fbe9e1",
  "sales-soft": "#e3f5ef",
  "sales-ink": "#0b5c43",
  ring: "#b6532b",
  destructive: "#9b342a",
  "destructive-foreground": "#ffffff"
} as const;

const variables = Object.keys(COLORS).map((key) => `--color-${key}`);

export type Palette = { [Key in keyof typeof COLORS]: string };

function color(value: string | number | undefined, defaultValue: string): string {
  return typeof value === "string" ? value : defaultValue;
}

/** Resolves UniWind theme variables for native props that cannot use className. */
export function usePalette(): Palette {
  const values = useCSSVariable(variables);
  return Object.fromEntries(
    Object.keys(COLORS).map((key, index) => [
      key,
      color(values[index], COLORS[key as keyof typeof COLORS])
    ])
  ) as Palette;
}
