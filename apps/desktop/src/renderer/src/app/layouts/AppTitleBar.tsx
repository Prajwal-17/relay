import { relaySmallAppIcon as relayAppIcon } from "@/lib/appIcon";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger
} from "@/components/ui/menubar";
import { cn } from "@/lib/utils";
import { getZoomFactorForShortcut, type ZoomShortcutAction } from "@shared/utils/zoomUtils";
import { Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

const windowControlClass = cn(
  "app-titlebar-interactive text-context-muted inline-flex h-full w-11.5 items-center justify-center outline-none transition-colors",
  "active:bg-context-pressed hover:bg-context-hover hover:text-primary-foreground focus-visible:bg-context-hover focus-visible:text-primary-foreground focus-visible:ring-context-focus focus-visible:ring-2 focus-visible:ring-inset"
);

const changeZoom = async (action: ZoomShortcutAction) => {
  const [{ zoomFactor }, bounds] = await Promise.all([
    window.zoomApi.getZoom(),
    window.zoomApi.getBounds()
  ]);
  await window.zoomApi.setZoom(getZoomFactorForShortcut(zoomFactor, action, bounds));
};

export function AppTitleBar() {
  const appWindowApi = window.appWindowApi;
  const [metadata, setMetadata] = useState({ name: "Relay", version: "" });
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!appWindowApi) return;
    let active = true;

    void appWindowApi.getMetadata().then((value) => {
      if (active) setMetadata(value);
    });
    void appWindowApi.isMaximized().then((value) => {
      if (active) setIsMaximized(value);
    });
    const unsubscribe = appWindowApi.onMaximizedChange(setIsMaximized);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [appWindowApi]);

  useEffect(() => {
    if (!appWindowApi) return;

    const handleShortcut = (event: KeyboardEvent) => {
      const hasCommandModifier = event.ctrlKey || event.metaKey;
      if (!hasCommandModifier || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "r") {
        event.preventDefault();
        appWindowApi.reload();
        return;
      }

      const action: ZoomShortcutAction | undefined =
        key === "+" || key === "="
          ? "increase"
          : key === "-" || key === "_"
            ? "decrease"
            : key === "0"
              ? "reset"
              : undefined;
      if (!action) return;

      event.preventDefault();
      void changeZoom(action);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [appWindowApi]);

  if (!appWindowApi) return null;

  const toggleMaximize = async () => {
    setIsMaximized(await appWindowApi.toggleMaximize());
  };

  return (
    <header
      data-surface="inverse"
      aria-label="Application title bar"
      className="app-titlebar bg-primary text-primary-foreground border-b-primary-hover flex h-(--app-titlebar-height) shrink-0 items-center border-b"
      data-app-titlebar
    >
      <div className="flex h-full min-w-0 items-center gap-2 pl-2.5">
        <img src={relayAppIcon} alt="" className="size-4.5 shrink-0 rounded-[4px]" />
        <span className="truncate text-sm font-semibold tracking-[-0.01em]">{metadata.name}</span>
        {metadata.version && (
          <span className="text-context-muted shrink-0 text-xs tabular-nums">
            v{metadata.version}
          </span>
        )}
      </div>

      <div className="bg-primary-foreground/25 mx-2 h-4 w-px shrink-0" />

      <Menubar className="app-titlebar-interactive h-full rounded-none border-0 bg-transparent p-0 shadow-none">
        <MenubarMenu>
          <MenubarTrigger className="text-primary-foreground focus:bg-context-hover focus:text-primary-foreground data-[state=open]:bg-context-selected data-[state=open]:text-primary-foreground h-full rounded-none px-2 text-sm font-medium">
            View
          </MenubarTrigger>
          <MenubarContent sideOffset={1} alignOffset={0}>
            <MenubarItem onSelect={() => appWindowApi.reload()}>
              Reload Relay
              <MenubarShortcut>Ctrl+R</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={() => void changeZoom("increase")}>
              Zoom in
              <MenubarShortcut>Ctrl+=</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={() => void changeZoom("decrease")}>
              Zoom out
              <MenubarShortcut>Ctrl+-</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={() => void changeZoom("reset")}>
              Reset zoom
              <MenubarShortcut>Ctrl+0</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-primary-foreground focus:bg-context-hover focus:text-primary-foreground data-[state=open]:bg-context-selected data-[state=open]:text-primary-foreground h-full rounded-none px-2 text-sm font-medium">
            Help
          </MenubarTrigger>
          <MenubarContent sideOffset={1} alignOffset={0}>
            <MenubarItem asChild>
              <a href="#/changelog">Changelog</a>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={() => appWindowApi.checkForUpdates()}>
              Check for updates
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <div className="min-w-4 flex-1 self-stretch" />

      <div className="app-titlebar-interactive flex h-full shrink-0" aria-label="Window controls">
        <button
          type="button"
          className={windowControlClass}
          aria-label="Minimize window"
          title="Minimize"
          onClick={() => appWindowApi.minimize()}
        >
          <Minus className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className={windowControlClass}
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
          title={isMaximized ? "Restore" : "Maximize"}
          onClick={() => void toggleMaximize()}
        >
          {isMaximized ? (
            <span className="relative size-3" aria-hidden="true">
              <span className="absolute top-0 right-0 size-2.25 border border-current" />
              <span className="bg-primary absolute bottom-0 left-0 size-2.25 border border-current" />
            </span>
          ) : (
            <Square className="size-3" strokeWidth={1.6} />
          )}
        </button>
        <button
          type="button"
          className={cn(
            windowControlClass,
            "hover:bg-destructive hover:text-destructive-foreground focus-visible:bg-destructive focus-visible:text-destructive-foreground"
          )}
          aria-label="Close window"
          title="Close"
          onClick={() => appWindowApi.close()}
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
