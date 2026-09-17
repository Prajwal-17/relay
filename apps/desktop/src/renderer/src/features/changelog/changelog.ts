import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type ChangelogRelease = {
  version: string;
  date: string;
  label: string;
  id: string;
};

export function parseReleaseHeading(label: string): ChangelogRelease | null {
  const match = /^(v.+?)\s+(?:—|-)\s+(.+)$/u.exec(label.trim());
  if (!match) return null;

  const version = match[1]!.trim();
  const date = match[2]!.trim();
  const slug = version
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    version,
    date,
    label: `${version} — ${date}`,
    id: `release-${slug}`
  };
}

export function parseChangelogReleases(markdown: string): ChangelogRelease[] {
  const tree = unified().use(remarkParse).parse(markdown);

  return tree.children.flatMap((node) => {
    if (node.type !== "heading" || node.depth !== 2) return [];
    const release = parseReleaseHeading(toString(node));
    return release ? [release] : [];
  });
}
