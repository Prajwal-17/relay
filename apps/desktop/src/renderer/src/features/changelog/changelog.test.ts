import { describe, expect, it } from "vitest";
import { parseChangelogReleases, parseReleaseHeading } from "./changelog";

describe("desktop release headings", () => {
  it("parses prefixed tags for the changelog navigation", () => {
    expect(parseReleaseHeading("desktop-v4.4.10 - 03 Oct 2026")).toEqual({
      version: "desktop-v4.4.10",
      date: "03 Oct 2026",
      label: "desktop-v4.4.10 — 03 Oct 2026",
      id: "release-desktop-v4-4-10"
    });
  });

  it("supports historical headings and ignores section headings", () => {
    expect(
      parseChangelogReleases(
        "## desktop-v4.4.10 - 03 Oct 2026\n\n## Fixed\n\n## v4.4.9 — 03 Oct 2026"
      ).map((release) => release.version)
    ).toEqual(["desktop-v4.4.10", "v4.4.9"]);
  });
});
