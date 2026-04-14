import { getLogoutUrl } from "@/middleware/auth";
import type { Route } from "./+types/logout";

const logOut = (request: Request, logoutUrl: string) => {
  const url = new URL(request.url);
  const domainParts = url.hostname.split(".");
  const cookieDomain =
    domainParts.length > 1
      ? "." + domainParts.slice(-2).join(".")
      : url.hostname;

  return new Response(null, {
    status: 302,
    headers: {
      Location: logoutUrl,
      "Set-Cookie": `schema0-session=; Max-Age=0; Path=/; Domain=${cookieDomain}; Secure; SameSite=Lax; HttpOnly`,
    },
  });
};

export async function loader({ request }: Route.LoaderArgs) {
  const logoutUrl = await getLogoutUrl(request);
  return logOut(request, logoutUrl);
}

export default function Logout() {
  return null;
}
