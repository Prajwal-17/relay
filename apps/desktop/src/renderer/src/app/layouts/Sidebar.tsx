import quickcartLogo from "@/assets/quickcart.svg";
import { navLinks } from "@/app/navigation";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/app/sidebar.store";
import type { StoreProfile } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { FileText, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MIN_SIDEBAR_WIDTH = 216;
const MAX_SIDEBAR_WIDTH = 280;
const DEFAULT_SIDEBAR_WIDTH = 232;
const SIDEBAR_WIDTH_STORAGE_KEY = "quickcart-sidebar-width";

const mainLinks = navLinks.filter((item) => item.href !== "/settings");
const systemLinks = navLinks.filter((item) => item.href === "/settings");

type SidebarProps = {
  variant?: "docked" | "overlay";
};

export const Sidebar = ({ variant = "docked" }: SidebarProps) => {
  const { pathname } = useLocation();

  const { data: storeProfile } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile")
  });

  const storeInitials = useMemo(() => {
    if (!storeProfile?.storeName) return "";
    const words = storeProfile.storeName.trim().split(/\s+/);
    if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
    return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase();
  }, [storeProfile?.storeName]);
  const isOverlay = variant === "overlay";
  const sidebarRef = useRef<HTMLElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const sidebarWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const animationFrameRef = useRef<number | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SIDEBAR_WIDTH;
    }

    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    const parsedWidth = storedWidth ? Number(storedWidth) : NaN;

    if (Number.isFinite(parsedWidth)) {
      return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsedWidth));
    }

    return DEFAULT_SIDEBAR_WIDTH;
  });

  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const isSidebarPinned = useSidebarStore((state) => state.isSidebarPinned);
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsSidebarOpen);
  const setIsSidebarPinned = useSidebarStore((state) => state.setIsSidebarPinned);

  const applySidebarWidth = (width: number) => {
    if (!sidebarRef.current) {
      return;
    }

    sidebarRef.current.style.width = `${width}px`;
    sidebarRef.current.style.minWidth = `${width}px`;
    sidebarRef.current.style.maxWidth = `${width}px`;
    sidebarRef.current.style.flexBasis = `${width}px`;
  };

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    applySidebarWidth(sidebarWidth);
  }, [sidebarWidth]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (isOverlay) {
      setIsSidebarOpen(false);
      setIsSidebarPinned(false);
    }
  }, [isOverlay, setIsSidebarOpen, setIsSidebarPinned]);

  useEffect(() => {
    if (!isOverlay || !isSidebarOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsSidebarOpen(false);
      setIsSidebarPinned(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOverlay, isSidebarOpen, setIsSidebarOpen, setIsSidebarPinned]);

  useEffect(() => {
    if (!isOverlay) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
        setIsSidebarPinned(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOverlay, isSidebarOpen, setIsSidebarOpen, setIsSidebarPinned]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      const nextWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(
          MIN_SIDEBAR_WIDTH,
          dragStartWidthRef.current + event.clientX - dragStartXRef.current
        )
      );

      sidebarWidthRef.current = nextWidth;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        applySidebarWidth(nextWidth);
      });
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) {
        return;
      }

      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setSidebarWidth(sidebarWidthRef.current);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = event.clientX;
    dragStartWidthRef.current = sidebarWidthRef.current;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleBillingShortcutClick = () => {
    if (!isOverlay) {
      return;
    }

    setIsSidebarPinned(false);
    setIsSidebarOpen(false);
  };

  const handleBillingSidebarMouseLeave = () => {
    if (!isOverlay || isSidebarPinned || isDraggingRef.current) {
      return;
    }

    setIsSidebarOpen(false);
  };

  const renderNavItem = (item: (typeof navLinks)[number]) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        to={item.href}
        draggable={false}
        key={item.href}
        onClick={() => {
          if (isOverlay) {
            setIsSidebarOpen(false);
          }
        }}
        className={cn(
          "relative flex h-(--nav-row-height) w-full items-center gap-2 rounded-(--radius-control) px-2 font-medium transition-colors duration-150 outline-none",
          "focus-visible:ring-ring focus-visible:ring-offset-sidebar focus-visible:ring-2 focus-visible:ring-offset-2",
          isActive
            ? "bg-selected text-foreground font-semibold"
            : "text-sidebar-foreground/70 hover:bg-hover hover:text-sidebar-foreground"
        )}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-(--radius-control) transition-colors duration-150 [&_svg]:size-4.5",
            isActive
              ? "bg-nav-icon-active-bg text-nav-icon-active-foreground"
              : "text-sidebar-foreground/70 bg-transparent"
          )}
        >
          {item.icon}
        </span>
        <span className="text-navigation truncate">{item.title}</span>
      </Link>
    );
  };

  const shell = (
    <aside
      ref={sidebarRef}
      onMouseLeave={handleBillingSidebarMouseLeave}
      className={cn(
        "bg-sidebar text-sidebar-foreground border-r-frame relative h-full shrink-0 overflow-hidden border-r",
        isOverlay && "shadow-lg"
      )}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        flexBasis: sidebarWidth
      }}
    >
      <div className="flex h-full flex-col">
        <div className="border-b-frame flex h-(--app-header-height) shrink-0 items-center border-b px-3">
          <Link
            to="/"
            draggable={false}
            onClick={() => {
              if (isOverlay) {
                setIsSidebarOpen(false);
              }
            }}
            className="flex items-center gap-2"
          >
            <div className="bg-background border-border flex size-8 shrink-0 items-center justify-center rounded-(--radius-control) border p-1.5">
              <img
                src={quickcartLogo}
                alt="QuickCart logo"
                draggable={false}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-base font-semibold">QuickCart</span>
              <span className="text-muted-foreground block truncate text-xs">
                Counter workspace
              </span>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
          <div className="flex flex-col gap-1.5">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary-hover text-primary-foreground h-10 w-full cursor-pointer justify-center gap-2 px-3 text-sm font-semibold"
            >
              <Link
                to="/billing/sales/create"
                draggable={false}
                onClick={handleBillingShortcutClick}
              >
                <ShoppingCart className="size-4.5" />
                <span className="text-navigation">New Sale</span>
              </Link>
            </Button>

            <Button
              asChild
              className="border-estimate bg-card text-estimate-foreground hover:bg-estimate-soft h-9 w-full cursor-pointer justify-center gap-2 border px-3 text-sm font-semibold"
            >
              <Link
                to="/billing/estimates/create"
                draggable={false}
                onClick={handleBillingShortcutClick}
              >
                <FileText className="size-4.5" />
                <span className="text-navigation">New Estimate</span>
              </Link>
            </Button>
          </div>

          <nav className="mt-4 flex flex-col">
            <div className="flex flex-col">
              <span className="text-sidebar-foreground/50 mb-1 px-2 text-xs font-semibold tracking-wide uppercase">
                Main
              </span>
              <div className="flex flex-col gap-0.5">{mainLinks.map(renderNavItem)}</div>
            </div>

            <div className="mt-4 flex flex-col">
              <span className="text-sidebar-foreground/50 mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
                System
              </span>
              <div className="flex flex-col gap-0.5">{systemLinks.map(renderNavItem)}</div>
            </div>
          </nav>
        </div>

        <div className="border-t-frame shrink-0 border-t px-2 py-2">
          <Link
            to="/settings/store-profile"
            draggable={false}
            onClick={() => {
              if (isOverlay) {
                setIsSidebarOpen(false);
              }
            }}
            className="hover:bg-sidebar-accent flex h-11 items-center gap-2 rounded-(--radius-control) px-2 transition-colors duration-150"
          >
            <div className="bg-selected text-foreground flex size-8 shrink-0 items-center justify-center rounded-(--radius-control) text-xs font-semibold">
              {storeInitials || "QC"}
            </div>
            <div className="min-w-0">
              <span className="text-navigation block truncate font-semibold">
                {storeProfile?.storeName || "Store profile"}
              </span>
              <span className="text-sidebar-foreground/55 block truncate text-xs">
                {storeProfile?.email || "Settings"}
              </span>
            </div>
          </Link>
        </div>

        <div
          role="separator"
          aria-label="Resize navigation"
          aria-orientation="vertical"
          aria-valuemin={MIN_SIDEBAR_WIDTH}
          aria-valuemax={MAX_SIDEBAR_WIDTH}
          aria-valuenow={Math.round(sidebarWidth)}
          tabIndex={0}
          onMouseDown={handleResizeStart}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            setSidebarWidth((current) =>
              Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, current + direction * 8))
            );
          }}
          className="hover:bg-hover focus-visible:bg-focus group absolute top-0 right-0 z-50 flex h-full w-1.5 shrink-0 cursor-col-resize items-center justify-center transition-colors duration-150 outline-none"
        >
          <div className="bg-border h-6 w-1 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </div>
      </div>
    </aside>
  );

  if (isOverlay) {
    return isSidebarOpen ? <div className="fixed inset-y-0 left-0 z-50">{shell}</div> : null;
  }

  return shell;
};
