import changelogMarkdown from "../../../../../../../CHANGELOG.md?raw";
import { describe, expect, it } from "vitest";
import { parseChangelogReleases, parseReleaseHeading } from "./changelog";

describe("changelog parsing", () => {
  it("extracts release headings while ignoring the document and category headings", () => {
    const releases = parseChangelogReleases(`# Changelog

## v4.4.8 - 12 Sep 2026

### Fixed

- A fix

## v4.4.7 — 07 Sep 2026
`);

    expect(releases).toEqual([
      {
        version: "v4.4.8",
        date: "12 Sep 2026",
        label: "v4.4.8 — 12 Sep 2026",
        id: "release-v4-4-8"
      },
      {
        version: "v4.4.7",
        date: "07 Sep 2026",
        label: "v4.4.7 — 07 Sep 2026",
        id: "release-v4-4-7"
      }
    ]);
  });

  it("supports historical version ranges", () => {
    expect(parseReleaseHeading("v2.1.2–v2.1.9 — 26–27 Aug 2025")).toMatchObject({
      version: "v2.1.2–v2.1.9",
      date: "26–27 Aug 2025",
      id: "release-v2-1-2-v2-1-9"
    });
  });

  it("extracts every release from the repository changelog with unique anchors", () => {
    const releases = parseChangelogReleases(changelogMarkdown);
    const releaseHeadingCount = changelogMarkdown
      .split("\n")
      .filter((line) => line.startsWith("## ")).length;

    expect(releases).toHaveLength(releaseHeadingCount);
    expect(releases[0]?.version).toMatch(/^v\d/);
    expect(new Set(releases.map((release) => release.id)).size).toBe(releases.length);
  });
});
