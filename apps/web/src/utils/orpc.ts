import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import {
  createTanstackQueryUtils,
  type RouterUtils,
} from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AppRouterClient } from "@template/api/routers/index";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "retry",
          onClick: () => {
            // Invalidate all queries but exclude the current one to prevent loops
            void queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Limit retries to prevent infinite loops
        if (failureCount >= 3) return false;
        return true;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export const link = new RPCLink({
  url: async () => {
    if (typeof window === "undefined") {
      // env imported from auth package throws error
      return `${process.env.YB_URL}/api/rpc`;
    }

    return `${window.location.origin}/api/rpc`;
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
