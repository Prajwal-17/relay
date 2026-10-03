import changelogMarkdown from "../../../../../../../CHANGELOG.md?raw";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type ReactNode, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useSearchParams } from "react-router-dom";
import { parseChangelogReleases, parseReleaseHeading } from "./changelog";

type ChangelogViewProps = {
  markdown: string;
};

function reactNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(reactNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return reactNodeText(node.props.children);
  return "";
}

function releaseSearch(version: string): string {
  return `?release=${encodeURIComponent(version)}`;
}

export function ChangelogView({ markdown }: ChangelogViewProps) {
  const releases = useMemo(() => parseChangelogReleases(markdown), [markdown]);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedVersion = searchParams.get("release");
  const requestedRelease = releases.find((release) => release.version === requestedVersion);
  const [activeReleaseId, setActiveReleaseId] = useState(
    requestedRelease?.id ?? releases[0]?.id ?? ""
  );
  const activeRelease = releases.find((release) => release.id === activeReleaseId);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestedRelease) return;
    setActiveReleaseId(requestedRelease.id);

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(requestedRelease.id)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [requestedRelease]);

  useEffect(() => {
    if (!pageRef.current || typeof IntersectionObserver === "undefined") return;
    const scrollRoot = pageRef.current.closest<HTMLElement>("[data-workspace-scroll]");
    const order = new Map(releases.map((release, index) => [release.id, index]));
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }

        const next = [...visible.entries()].sort((left, right) => {
          const topDifference = left[1] - right[1];
          return topDifference || (order.get(left[0]) ?? 0) - (order.get(right[0]) ?? 0);
        })[0];
        if (next) setActiveReleaseId(next[0]);
      },
      {
        root: scrollRoot,
        rootMargin: "-12px 0px -72% 0px",
        threshold: [0, 1]
      }
    );

    for (const release of releases) {
      const heading = document.getElementById(release.id);
      if (heading) observer.observe(heading);
    }

    return () => observer.disconnect();
  }, [releases]);

  const selectRelease = (version: string) => {
    const release = releases.find((candidate) => candidate.version === version);
    if (!release) return;

    setActiveReleaseId(release.id);
    if (version === requestedVersion) {
      document.getElementById(release.id)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
      return;
    }

    setSearchParams({ release: version });
  };

  return (
    <div ref={pageRef} className="bg-background min-h-full p-3">
      <div className="mx-auto grid w-full max-w-260 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
        <article className="min-w-0">
          <div className="flex justify-end px-5 pt-2 lg:hidden">
            <div className="w-44 shrink-0">
              <Select value={activeRelease?.version} onValueChange={selectRelease}>
                <SelectTrigger className="bg-card w-full" aria-label="Choose a release">
                  <SelectValue placeholder="Choose a release" />
                </SelectTrigger>
                <SelectContent>
                  {releases.map((release) => (
                    <SelectItem key={release.id} value={release.version}>
                      {release.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="px-5 pb-6">
            <ReactMarkdown
              components={{
                h1: () => null,
                h2: ({ children }) => {
                  const release = parseReleaseHeading(reactNodeText(children));
                  if (!release) return <h2 className="mt-6 text-lg font-semibold">{children}</h2>;
                  const isFirst = release.id === releases[0]?.id;

                  return (
                    <h2
                      id={release.id}
                      data-release-heading
                      className={cn(
                        "scroll-mt-3 pt-5 text-lg font-semibold tracking-[-0.02em]",
                        isFirst ? "mt-0" : "border-t-frame mt-7 border-t"
                      )}
                    >
                      <span>{release.version}</span>
                      <span className="text-muted-foreground ml-2 text-sm font-normal tracking-normal">
                        {release.date}
                      </span>
                    </h2>
                  );
                },
                h3: ({ children }) => (
                  <h3 className="text-foreground mt-4 text-sm font-semibold">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground mt-2 max-w-[72ch] text-sm leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="marker:text-marker mt-2 grid max-w-[76ch] list-disc gap-1.5 pl-5 text-sm leading-relaxed">
                    {children}
                  </ul>
                ),
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="text-foreground font-semibold">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="bg-hover rounded-(--radius-control) px-1 py-0.5 font-mono text-xs">
                    {children}
                  </code>
                ),
                hr: () => null
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </article>

        <aside
          className="border-border sticky top-3 hidden max-h-[calc(100vh-var(--app-titlebar-height)-var(--app-header-height)-5rem)] border-l lg:flex lg:flex-col"
          aria-label="All releases"
        >
          <div className="border-border flex h-9 shrink-0 items-center justify-between border-b px-3">
            <span className="text-sm font-semibold">All releases</span>
            <span className="text-muted-foreground text-xs tabular-nums">{releases.length}</span>
          </div>
          <nav className="scrollbar-compact min-h-0 overflow-y-auto py-1.5 pr-0.5 pl-1.5">
            {releases.map((release) => {
              const isActive = release.id === activeReleaseId;
              return (
                <Link
                  key={release.id}
                  to={{ pathname: "/changelog", search: releaseSearch(release.version) }}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(event) => {
                    if (release.version !== requestedVersion) return;
                    event.preventDefault();
                    selectRelease(release.version);
                  }}
                  className={cn(
                    "relative flex min-h-8 items-center justify-between gap-2 rounded-(--radius-control) px-2 text-sm transition-colors outline-none",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset",
                    isActive
                      ? "bg-selected text-foreground before:bg-marker font-semibold before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full"
                      : "text-muted-foreground hover:bg-hover hover:text-foreground"
                  )}
                >
                  <span className="min-w-0 truncate">{release.version}</span>
                  <span className="shrink-0 text-xs font-normal tabular-nums">{release.date}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}

const ChangelogPage = () => <ChangelogView markdown={changelogMarkdown} />;

export default ChangelogPage;
