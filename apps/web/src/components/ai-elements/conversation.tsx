"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

// ============================================================================
// Conversation
// ============================================================================

interface ConversationContextValue {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
  isAtBottom: boolean;
}

const ConversationContext = React.createContext<ConversationContextValue | null>(null);

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  ({ children, className, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = React.useState(true);

    const scrollToBottom = React.useCallback(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, []);

    const handleScroll = React.useCallback(() => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const threshold = 100;
        setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
      }
    }, []);

    React.useEffect(() => {
      const scrollElement = scrollRef.current;
      if (scrollElement) {
        scrollElement.addEventListener("scroll", handleScroll);
        return () => scrollElement.removeEventListener("scroll", handleScroll);
      }
    }, [handleScroll]);

    const contextValue = React.useMemo(
      () => ({ scrollRef, scrollToBottom, isAtBottom }),
      [scrollToBottom, isAtBottom],
    );

    return (
      <ConversationContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("relative flex flex-col", className)}
          {...props}
        >
          {children}
        </div>
      </ConversationContext.Provider>
    );
  },
);
Conversation.displayName = "Conversation";

// ============================================================================
// ConversationContent
// ============================================================================

interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const ConversationContent = React.forwardRef<HTMLDivElement, ConversationContentProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(ConversationContext);

    React.useEffect(() => {
      if (context?.scrollRef.current) {
        // Scroll to bottom when messages change
        context.scrollRef.current.scrollTop = context.scrollRef.current.scrollHeight;
      }
    }, [children, context]);

    return (
      <div
        ref={(node) => {
          // Handle both refs
          if (node) {
            if (context?.scrollRef) {
              context.scrollRef.current = node;
            }
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }
        }}
        className={cn("flex-1 overflow-y-auto", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ConversationContent.displayName = "ConversationContent";

// ============================================================================
// ConversationEmptyState
// ============================================================================

interface ConversationEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const ConversationEmptyState = React.forwardRef<HTMLDivElement, ConversationEmptyStateProps>(
  ({ title = "No messages yet", description = "Start a conversation to see messages here", icon, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-center h-full text-center p-8", className)}
      {...props}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {children}
    </div>
  ),
);
ConversationEmptyState.displayName = "ConversationEmptyState";

// ============================================================================
// ConversationScrollButton
// ============================================================================

const ConversationScrollButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const context = React.useContext(ConversationContext);

  if (!context || context.isAtBottom) {
    return null;
  }

  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className={cn("absolute bottom-4 right-4 rounded-full z-10", className)}
      onClick={context.scrollToBottom}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  );
});
ConversationScrollButton.displayName = "ConversationScrollButton";

export {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
};
