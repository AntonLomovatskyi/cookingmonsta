import { ChevronLeft, Heart, Home, Settings, Sparkles } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";

const TAB_ROOTS = ["/", "/import", "/favourites"];

export function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const isTabRoot = TAB_ROOTS.includes(loc.pathname);
  const tabs = [
    { to: "/", label: "Recipes", Icon: Home, end: true },
    { to: "/import", label: "Import", Icon: Sparkles, end: false },
    { to: "/favourites", label: "Saved", Icon: Heart, end: false },
  ];
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur">
        {!isTabRoot && (
          <button
            onClick={() => nav(-1)}
            className="-ml-1.5 rounded-full p-1.5 text-text-dim transition hover:text-flame"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <NavLink to="/" className="font-display text-xl font-bold tracking-wide text-flame">
          cookingmonsta
        </NavLink>
        <span className="text-lg">🍳</span>
        <span className="flex-1" />
        <NavLink
          to="/settings"
          className="rounded-full p-1.5 text-text-dim transition hover:text-flame"
          aria-label="Settings"
        >
          <Settings size={20} />
        </NavLink>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-3xl border-t border-border bg-surface">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition",
                isActive ? "text-flame" : "text-text-dim hover:text-text",
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
