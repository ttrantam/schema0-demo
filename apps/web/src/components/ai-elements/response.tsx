"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// Response
// ============================================================================

interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Response = React.forwardRef<HTMLDivElement, ResponseProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Response.displayName = "Response";

export { Response };
