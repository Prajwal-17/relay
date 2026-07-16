import { NavLink, Outlet } from "react-router-dom";
import { settingsNavigation } from "../../features/settings/settingsNavigation";

const SettingsPage = () => {
  return (
    <div className="bg-background min-h-full px-4 py-4 lg:px-6">
      <div className="max-w-280 w-full">
        <div className="grid items-start gap-20 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="grid gap-1.5" aria-label="Settings sections">
            {settingsNavigation.map((item) => (
              <NavLink
                key={item.id}
                to={item.id}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-4 py-3 text-lg font-medium leading-tight transition-colors",
                    isActive ? "bg-foreground text-background" : "text-foreground hover:bg-muted/70"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </aside>

          <main className="rounded-none border-0 bg-transparent p-0" aria-live="polite">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
