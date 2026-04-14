# RLS ORPC Router Examples

## Complete CRUD Router

```typescript
// packages/api/src/routers/posts.ts
import { protectedProcedure } from "../index";
import { createRLSTransaction } from "@template/db";
import { posts } from "@template/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

export const postsRouter = {
  // Get all posts (RLS filters by user)
  getAll: protectedProcedure.handler(async ({ context }) => {
    const RLSTransaction = await createRLSTransaction(context.request);
    return await RLSTransaction(async (tx) => {
      return await tx.select().from(posts);
    });
  }),

  // Get post by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);
      return await RLSTransaction(async (tx) => {
        const result = await tx
          .select()
          .from(posts)
          .where(eq(posts.id, input.id));
        return result[0] || null;
      });
    }),

  // Create new post
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string(),
      }),
    )
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);
      const userId = context.session.user.id;

      return await RLSTransaction(async (tx) => {
        return await tx
          .insert(posts)
          .values({
            ...input,
            userId,
          })
          .returning();
      });
    }),

  // Update post
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);
      const { id, ...data } = input;

      return await RLSTransaction(async (tx) => {
        return await tx
          .update(posts)
          .set(data)
          .where(eq(posts.id, id))
          .returning();
      });
    }),

  // Delete post
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);

      return await RLSTransaction(async (tx) => {
        return await tx.delete(posts).where(eq(posts.id, input.id)).returning();
      });
    }),
};
```

## Route with React Query Integration

```typescript
// apps/web/src/routes/_auth.posts.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import type { Route } from "./+types/posts";
import { authContext } from "@/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function loader({ context }: Route.LoaderArgs) {
  const auth = authContext.get(context);
  return { user: auth.user };
}

export default function PostsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  // Fetch all posts (RLS ensures only user's posts)
  const { data: posts, isLoading } = useQuery(
    orpc.posts.getAll.queryOptions()
  );

  // Create mutation
  const createPost = useMutation({
    ...orpc.posts.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setTitle("");
      setContent("");
    },
  });

  // Delete mutation
  const deletePost = useMutation({
    ...orpc.posts.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await createPost.mutateAsync({ title, content });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Posts</h1>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Content"
              required
            />
            <Button type="submit" disabled={createPost.isPending}>
              Create Post
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Posts List */}
      {isLoading ? (
        <p>Loading posts...</p>
      ) : (
        <div className="grid gap-4">
          {posts?.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{post.content}</p>
                <Button
                  onClick={() => deletePost.mutate({ id: post.id })}
                  variant="destructive"
                  size="sm"
                  className="mt-4"
                  disabled={deletePost.isPending}
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Router with Filtering

```typescript
// packages/api/src/routers/tasks.ts
import { protectedProcedure } from "../index";
import { createRLSTransaction } from "@template/db";
import { tasks } from "@template/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";

export const tasksRouter = {
  // Get tasks by status
  getByStatus: protectedProcedure
    .input(z.object({ completed: z.boolean() }))
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);
      return await RLSTransaction(async (tx) => {
        return await tx
          .select()
          .from(tasks)
          .where(eq(tasks.completed, input.completed))
          .orderBy(desc(tasks.createdAt));
      });
    }),

  // Toggle task completion
  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);

      return await RLSTransaction(async (tx) => {
        // First, get the task
        const [task] = await tx
          .select()
          .from(tasks)
          .where(eq(tasks.id, input.id))
          .limit(1);

        if (!task) {
          throw new Error("Task not found");
        }

        // Toggle completion
        return await tx
          .update(tasks)
          .set({ completed: !task.completed })
          .where(eq(tasks.id, input.id))
          .returning();
      });
    }),
};
```

## Router with Optimistic Updates

```typescript
// apps/web/src/routes/_auth.tasks.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export default function TasksPage() {
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery(orpc.tasks.getAll.queryOptions());

  // Optimistic toggle mutation
  const toggleTask = useMutation({
    ...orpc.tasks.toggle.mutationOptions(),
    onMutate: async (variables) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(["tasks"]);

      // Optimistically update - let TypeScript infer the type
      queryClient.setQueryData(["tasks"], (old) =>
        old?.map((task) =>
          task.id === variables.id
            ? { ...task, completed: !task.completed }
            : task
        )
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(["tasks"], context?.previousTasks);
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return (
    <div className="space-y-2">
      {tasks?.map((task) => (
        <div key={task.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTask.mutate({ id: task.id })}
          />
          <span className={task.completed ? "line-through" : ""}>
            {task.title}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Database Schema with RLS

```typescript
// packages/db/src/schema/posts.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { crudPolicy, authUid } from "drizzle-orm/neon";
import { authenticatedUserRole } from "./index";

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(), // Use text IDs with generateId() on client
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedUserRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ],
);
```

## Router Registration

```typescript
// packages/api/src/routers/index.ts
import { publicProcedure } from "../index";
import { postsRouter } from "./posts";
import { tasksRouter } from "./tasks";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  posts: postsRouter,
  tasks: tasksRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = typeof appRouter;
```

## Testing RLS Policies

```typescript
// tests/routers/tasks.test.ts
import { describe, it, expect } from "bun:test";
import { tasksRouter } from "@template/api/routers/tasks";

describe("Task RLS", () => {
  it("should only return user's own tasks", async () => {
    // Create task as user1
    const task1 = await tasksRouter.create.handler({
      input: { title: "User 1 Task" },
      context: { request: user1Request, session: user1Session },
    });

    // Create task as user2
    const task2 = await tasksRouter.create.handler({
      input: { title: "User 2 Task" },
      context: { request: user2Request, session: user2Session },
    });

    // User 1 should only see their own task
    const user1Tasks = await tasksRouter.getAll.handler({
      input: undefined,
      context: { request: user1Request, session: user1Session },
    });

    expect(user1Tasks).toHaveLength(1);
    expect(user1Tasks[0].title).toBe("User 1 Task");
  });

  it("should not allow user to modify others' tasks", async () => {
    const task = await tasksRouter.create.handler({
      input: { title: "User 1 Task" },
      context: { request: user1Request, session: user1Session },
    });

    // User 2 should not be able to delete user 1's task (RLS blocks it)
    const result = await tasksRouter.delete.handler({
      input: { id: task.id },
      context: { request: user2Request, session: user2Session },
    });

    // RLS will return empty result, not throw
    expect(result).toEqual([]);
  });
});
```

## Generated Router Template

When you run:

```bash
bun run scaffold-scripts/generate.ts rls-service products
```

It generates `packages/api/src/routers/products.ts` with the full CRUD router pattern ready to customize.
