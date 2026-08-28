import { NavLink, Outlet } from "react-router-dom";
import { settingsNavigation } from "@/features/settings/settingsNavigation";

const SettingsPage = () => {
  return (
    <div className="bg-background h-full p-3">
      <div className="mx-auto h-full w-full max-w-260">
        <div className="grid h-full gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="sticky top-0 grid h-fit gap-1.5" aria-label="Settings sections">
            {settingsNavigation.map((item) => (
              <NavLink
                key={item.id}
                to={item.id}
                className={({ isActive }) =>
                  [
                    "flex h-9 items-center rounded-(--radius-control) px-3 text-sm leading-tight font-medium transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-hover hover:text-foreground"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </aside>

          <main
            className="overflow-y-auto rounded-none border-0 bg-transparent p-0"
            aria-live="polite"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
