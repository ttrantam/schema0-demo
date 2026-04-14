"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// Message
// ============================================================================

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant" | "system";
  children?: React.ReactNode;
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ from, children, className, ...props }, ref) => {
    const isUser = from === "user";
    const isSystem = from === "system";

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full mb-4",
          isUser ? "justify-end" : "justify-start",
          isSystem && "justify-center",
          className,
        )}
        {...props}
      >
        {!isSystem && (
          <div
            className={cn(
              "max-w-[80%] rounded-lg px-4 py-2",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
            )}
          >
            {children}
          </div>
        )}
        {isSystem && children}
      </div>
    );
  },
);
Message.displayName = "Message";

// ============================================================================
// MessageContent
// ============================================================================

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
MessageContent.displayName = "MessageContent";

export { Message, MessageContent };
