import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn, Shield } from "lucide-react";
import type { Route } from "./+types/login";
import { getSignInUrl } from "@/middleware/auth";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect");

  return {
    signInUrl: await getSignInUrl(redirectTo || undefined),
  };
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const handleLogin = () => {
    window.location.assign(loaderData.signInUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      {/* Main Content */}
      <div className="w-full max-w-md p-6">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Schema0</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>

          <CardFooter className="px-8 pb-8">
            <Button onClick={handleLogin} className="w-full h-12" size="lg">
              <LogIn className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
