import { auth, env, type User } from "@template/auth";
import { redirect, type RouterContextProvider } from "react-router";
import { authContext } from "@/context";
import type { Route } from "../routes/+types/_auth";

export interface AuthContext {
  user: User | null;
  organizationId: string;
  appId: string;
  apiHostname: string;
}

export const authMiddleware: Route.MiddlewareFunction = async ({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) => {
  try {
    const user = await auth.getUser(request);
    if (
      !user ||
      !env.YB_ORGANIZATION_ID ||
      !env.YB_APP_ID ||
      !env.YB_API_HOSTNAME
    ) {
      const url = new URL(request.url);
      const redirectUrl = `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
      throw redirect(redirectUrl);
    }
    authContext.set(context, {
      user,
      organizationId: env.YB_ORGANIZATION_ID,
      appId: env.YB_APP_ID,
      apiHostname: env.YB_API_HOSTNAME,
    });
  } catch {
    const url = new URL(request.url);
    const redirectUrl = `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(redirectUrl);
  }
};

/**
 * Get sign-in URL for redirecting unauthenticated users
 */
export async function getSignInUrl(redirectTo?: string): Promise<string> {
  // Get sign-in URL from client
  const signInUrl = await auth.getSignInUrl({
    state: redirectTo ? { redirect: redirectTo } : undefined,
  });

  return signInUrl;
}

/**
 * Get logout URL for signing out users
 */
export async function getLogoutUrl(request: Request): Promise<string> {
  // Get logout URL from client with server request for cookie forwarding
  const logoutUrl = await auth.getLogoutUrl({
    returnTo: env.YB_URL,
    serverRequest: request,
  });
  return logoutUrl;
}

export async function getAccessToken(request: Request): Promise<string | null> {
  const accessToken = await auth.getAccessToken(request);
  return accessToken;
}
