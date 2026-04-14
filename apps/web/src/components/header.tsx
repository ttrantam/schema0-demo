import { NavLink, useRouteLoaderData } from "react-router";
import { ModeToggle } from "./mode-toggle";
import { Button } from "@/components/ui/button";
import type { User } from "@template/auth";

export default function Header({ user }: { user: User | null }) {
  const links = [
    { to: "/", label: "Home" },
    { to: "/todos", label: "Todos" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => (isActive ? "font-bold" : "")}
                end
              >
                {label}
              </NavLink>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="outline" size="sm">
                <NavLink
                  key={"/logout"}
                  to={"/logout"}
                  className={({ isActive }) => (isActive ? "font-bold" : "")}
                  end
                >
                  Sign Out
                </NavLink>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
      <hr />
    </div>
  );
}
