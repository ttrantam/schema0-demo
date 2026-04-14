import { Outlet } from "react-router";
import type { Route } from "./+types/_auth";
import { authMiddleware } from "@/middleware/auth";
import { authContext } from "@/context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

// DANGEROUS: DO NOT REMOVE
// By adding a `loader`, we force the `authMiddleware` to run on every
// client-side navigation involving this route.
export async function loader({ context }: Route.LoaderArgs) {
  const auth = authContext.get(context);
  return { user: auth.user };
}

export default function AuthLayout({ loaderData }: Route.ComponentProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={loaderData.user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
        </header>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
