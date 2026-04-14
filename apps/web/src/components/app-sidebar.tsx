import { Home, Users, Files, Plug, Award, Calendar, BookOpen } from "lucide-react";
import { NavLink } from "react-router";
import type { User } from "@template/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";

const routes = [
  { name: "Home", path: "/", icon: Home },
  { name: "Users", path: "/users", icon: Users },
  { name: "Trainers", path: "/trainers", icon: Award },
  { name: "Sessions", path: "/sessions", icon: Calendar },
  { name: "Bookings", path: "/bookings", icon: BookOpen },
  { name: "Files", path: "/files", icon: Files },
  { name: "Integrations", path: "/integrations", icon: Plug },
];

export function AppSidebar({ user }: { user: User | null }) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((route) => (
                <SidebarMenuItem key={route.path}>
                  <SidebarMenuButton asChild>
                    <NavLink to={route.path} end={route.path === "/"}>
                      <route.icon />
                      <span>{route.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <>
            <SidebarSeparator />
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground truncate">
                  {user.email}
                </span>
                <ModeToggle />
              </div>
              <Button variant="outline" size="sm" asChild>
                <NavLink to="/logout">Sign Out</NavLink>
              </Button>
            </div>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
