"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

// ============================================================================
// Input (Form wrapper)
// ============================================================================

interface InputProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

const Input = React.forwardRef<HTMLFormElement, InputProps>(
  ({ onSubmit, children, className, ...props }, ref) => (
    <form
      ref={ref}
      onSubmit={onSubmit}
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </form>
  ),
);
Input.displayName = "Input";

// ============================================================================
// PromptInputTextarea
// ============================================================================

interface PromptInputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PromptInputTextarea = React.forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(
  ({ value, onChange, className, ...props }, ref) => (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className,
      )}
      {...props}
    />
  ),
);
PromptInputTextarea.displayName = "PromptInputTextarea";

// ============================================================================
// PromptInputSubmit
// ============================================================================

interface PromptInputSubmitProps extends React.ComponentProps<typeof Button> {
  status?: "ready" | "streaming";
}

const PromptInputSubmit = React.forwardRef<HTMLButtonElement, PromptInputSubmitProps>(
  ({ status = "ready", disabled, className, children, ...props }, ref) => (
    <Button
      ref={ref}
      type="submit"
      size="icon"
      variant="ghost"
      disabled={disabled || status === "streaming"}
      className={cn("h-8 w-8 shrink-0", className)}
      {...props}
    >
      {status === "streaming" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      {children}
    </Button>
  ),
);
PromptInputSubmit.displayName = "PromptInputSubmit";

export { Input, PromptInputTextarea, PromptInputSubmit };
