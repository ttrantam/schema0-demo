# React Flow - Persistence, Theming, Testing, and Collaboration Patterns

> Production patterns for flow-based SaaS products using React + Tailwind + shadcn/ui + Lucide Icons + Zustand.

## Keyboard Shortcuts

```tsx
function FlowKeyboardShortcuts() {
  const { copy, paste, cut, undo, redo } = useFlowStore();
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Copy/Paste/Cut
  const isCopy = useKeyPress(["Meta+c", "Control+c"]);
  const isPaste = useKeyPress(["Meta+v", "Control+v"]);
  const isCut = useKeyPress(["Meta+x", "Control+x"]);
  const isUndo = useKeyPress(["Meta+z", "Control+z"]);
  const isRedo = useKeyPress(["Meta+Shift+z", "Control+Shift+z"]);
  const isFitView = useKeyPress(["Meta+Shift+f", "Control+Shift+f"]);
  const isZoomIn = useKeyPress(["Meta+=", "Control+="]);
  const isZoomOut = useKeyPress(["Meta+-", "Control+-"]);
  const isSelectAll = useKeyPress(["Meta+a", "Control+a"]);

  useEffect(() => {
    if (isCopy) copy();
  }, [isCopy]);
  useEffect(() => {
    if (isPaste) paste();
  }, [isPaste]);
  useEffect(() => {
    if (isCut) cut();
  }, [isCut]);
  useEffect(() => {
    if (isUndo) undo();
  }, [isUndo]);
  useEffect(() => {
    if (isRedo) redo();
  }, [isRedo]);
  useEffect(() => {
    if (isFitView) fitView({ duration: 300 });
  }, [isFitView]);

  return null; // Headless component
}
```

---

## Flow Serialization

### Save/Load to API

```tsx
// lib/flow-api.ts
import type { ReactFlowJsonObject } from "@xyflow/react";

interface FlowDocument {
  id: string;
  name: string;
  flow: ReactFlowJsonObject;
  metadata: {
    updatedAt: string;
    nodeCount: number;
    edgeCount: number;
  };
}

export async function saveFlow(
  flowId: string,
  toObject: () => ReactFlowJsonObject,
  name: string,
): Promise<void> {
  const flow = toObject();
  const doc: FlowDocument = {
    id: flowId,
    name,
    flow,
    metadata: {
      updatedAt: new Date().toISOString(),
      nodeCount: flow.nodes.length,
      edgeCount: flow.edges.length,
    },
  };
  await fetch(`/api/flows/${flowId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
}

export async function loadFlow(flowId: string): Promise<FlowDocument> {
  const res = await fetch(`/api/flows/${flowId}`);
  return res.json();
}
```

### Restore Flow

```tsx
const restoreFlow = useCallback(
  async (flowId: string) => {
    const doc = await loadFlow(flowId);
    const { nodes, edges, viewport } = doc.flow;
    setNodes(nodes);
    setEdges(edges);
    if (viewport) setViewport(viewport);
  },
  [setNodes, setEdges, setViewport],
);
```

---

## Theming

### Tailwind CSS Integration

React Flow uses CSS variables. Override them for custom theming:

```css
/* globals.css — after importing @xyflow/react/dist/style.css */

.react-flow {
  /* Override React Flow CSS variables */
  --xy-background-color: theme("colors.background");
  --xy-edge-stroke: theme("colors.border");
  --xy-edge-stroke-selected: theme("colors.primary");
  --xy-edge-stroke-width: 1.5;
  --xy-connectionline-stroke: theme("colors.primary");
  --xy-connectionline-stroke-width: 1.5;
  --xy-handle-background-color: theme("colors.primary");
  --xy-handle-border-color: theme("colors.background");
  --xy-minimap-background-color: theme("colors.card");
  --xy-minimap-mask-background-color: rgba(0, 0, 0, 0.1);
  --xy-controls-button-background-color: theme("colors.card");
  --xy-controls-button-border-color: theme("colors.border");
  --xy-controls-button-color: theme("colors.foreground");

  --xy-node-background-color: theme("colors.card");
  --xy-node-border: 1px solid theme("colors.border");
  --xy-node-border-radius: theme("borderRadius.lg");
  --xy-node-color: theme("colors.foreground");
  --xy-node-box-shadow: theme("boxShadow.sm");
}

/* Dark mode — React Flow adds .dark class when colorMode="dark" */
.react-flow.dark {
  --xy-background-color: theme("colors.background");
  --xy-minimap-mask-background-color: rgba(255, 255, 255, 0.05);
}
```

### Tailwind Node Styling Tips

```tsx
// Use Tailwind with !important prefix for handle overrides
<Handle
  className="!h-3 !w-3 !rounded-full !border-2 !border-background !bg-primary"
/>

// Use shadcn's cn() for conditional classes
<div className={cn(
  "rounded-lg border bg-card p-3 shadow-sm",
  selected && "ring-2 ring-ring",
  data.status === 'error' && "border-destructive",
)}>
```

---

## Performance

### Rules for Large Flows (500+ nodes)

1. **Memo everything**: All custom nodes and edges must use `React.memo()`
2. **`nodeTypes` / `edgeTypes` outside component**: NEVER define inline
3. **`useCallback` all handlers**: Every function passed to `<ReactFlow />`
4. **Avoid `useNodes()` / `useEdges()` in custom nodes**: Use `useNodesData` or `useStore` with precise selectors
5. **Use `useStore` with selectors**: Only subscribe to the specific slice you need

```tsx
// BAD — re-renders on EVERY change
const nodes = useNodes();
const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);

// GOOD — only re-renders when selection changes
const selectedIds = useStore(
  useCallback(
    (state) => state.nodes.filter((n) => n.selected).map((n) => n.id),
    [],
  ),
);
```

6. **Virtualization**: React Flow only renders visible nodes by default (`onlyRenderVisibleElements`)
7. **Batch updates**: When making multiple state changes, batch them in a single `set()` call
8. **Lazy node rendering**: For deeply nested trees, use `hidden` to show only expanded branches

---

## Testing

```tsx
// __tests__/FlowEditor.test.tsx
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowCanvas } from "./FlowCanvas";

// Mock ResizeObserver (required for React Flow)
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderWithProvider(ui: React.ReactElement) {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
}

test("renders flow with nodes", () => {
  renderWithProvider(<FlowCanvas />);
  // React Flow nodes have data-id attributes
  expect(document.querySelector('[data-id="node-1"]')).toBeDefined();
});
```

---

## SSR

React Flow supports server-side rendering. Pre-define node dimensions:

```tsx
const nodes: Node[] = [
  {
    id: "1",
    type: "action",
    position: { x: 0, y: 0 },
    data: { label: "Start" },
    width: 200, // Used as inline style for SSR
    height: 60,
  },
];
```

---

## Multiplayer

Use `onNodesChange`/`onEdgesChange` to broadcast and apply remote changes:

```tsx
// Broadcast local changes via WebSocket/CRDT
onNodesChange: ((changes) => {
  set({ nodes: applyNodeChanges(changes, get().nodes) });
  // Send changes to other clients
  wsChannel.send({ type: "nodes-change", changes });
},
  // Apply remote changes
  wsChannel.on("nodes-change", ({ changes }) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  }));
```

Consider using Yjs or Liveblocks for production multiplayer with conflict resolution.
