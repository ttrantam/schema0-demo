# React Flow — Enterprise SaaS Patterns

> Production patterns for flow-based SaaS products using React + Tailwind + shadcn/ui + Lucide Icons + Zustand.

## Table of Contents

- [Undo/Redo](#undoredo)
- [Copy/Paste](#copypaste)
- [Context Menus](#context-menus)

---

## Undo/Redo

Extend the Zustand store with a history stack:

```tsx
// store/flow-store.ts — add undo/redo
import { temporal } from "zundo";
import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import type { AppNode, AppEdge, FlowState } from "./types";

// Option A: Use zundo (recommended — purpose-built temporal middleware)
// npm install zundo

export const useFlowStore = create<FlowState>()(
  temporal(
    (set, get) => ({
      nodes: [] as AppNode[],
      edges: [] as AppEdge[],
      onNodesChange: (changes) =>
        set({ nodes: applyNodeChanges(changes, get().nodes) }),
      onEdgesChange: (changes) =>
        set({ edges: applyEdgeChanges(changes, get().edges) }),
      onConnect: (connection) =>
        set({ edges: addEdge(connection, get().edges) }),
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
    }),
    {
      // Only track meaningful changes, not every pixel of drag
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      limit: 50,
      // Throttle: batch rapid changes (e.g., drag) into one undo step
      handleSet: (handleSet) => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        return (state) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => handleSet(state), 500);
        };
      },
    },
  ),
);

// Usage in component:
function UndoRedoControls() {
  const { undo, redo, pastStates, futureStates } =
    useFlowStore.temporal.getState();

  return (
    <Panel position="top-center" className="flex gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => undo()}
        disabled={pastStates.length === 0}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => redo()}
        disabled={futureStates.length === 0}
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </Panel>
  );
}
```

```tsx
// Option B: Manual history (no extra dependency)
interface HistoryState {
  past: { nodes: AppNode[]; edges: AppEdge[] }[];
  future: { nodes: AppNode[]; edges: AppEdge[] }[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

// In your store:
pushHistory: () => {
  const { nodes, edges, past } = get();
  set({
    past: [...past.slice(-49), { nodes: structuredClone(nodes), edges: structuredClone(edges) }],
    future: [],
  });
},
undo: () => {
  const { past, future, nodes, edges } = get();
  if (past.length === 0) return;
  const previous = past[past.length - 1];
  set({
    nodes: previous.nodes,
    edges: previous.edges,
    past: past.slice(0, -1),
    future: [{ nodes, edges }, ...future],
  });
},
redo: () => {
  const { past, future, nodes, edges } = get();
  if (future.length === 0) return;
  const next = future[0];
  set({
    nodes: next.nodes,
    edges: next.edges,
    past: [...past, { nodes, edges }],
    future: future.slice(1),
  });
},
```

### Keyboard bindings:

```tsx
const isUndoPressed = useKeyPress(["Meta+z", "Control+z"]);
const isRedoPressed = useKeyPress(["Meta+Shift+z", "Control+Shift+z"]);

useEffect(() => {
  if (isUndoPressed) undo();
}, [isUndoPressed]);
useEffect(() => {
  if (isRedoPressed) redo();
}, [isRedoPressed]);
```

---

## Copy/Paste

```tsx
// store/clipboard.ts
interface ClipboardState {
  clipboard: { nodes: AppNode[]; edges: AppEdge[] } | null;
  copy: () => void;
  paste: (screenPosition?: XYPosition) => void;
  cut: () => void;
}

// In your flow store, add:
copy: () => {
  const { nodes, edges } = get();
  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
  const selectedEdges = edges.filter(
    (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
  );
  set({ clipboard: { nodes: selectedNodes, edges: selectedEdges } });
},

paste: (screenPosition) => {
  const { clipboard, nodes, edges } = get();
  if (!clipboard || clipboard.nodes.length === 0) return;

  const idMap = new Map<string, string>();
  const bounds = getNodesBounds(clipboard.nodes);
  const offsetX = screenPosition ? screenPosition.x - bounds.x : 50;
  const offsetY = screenPosition ? screenPosition.y - bounds.y : 50;

  // Create new nodes with unique IDs
  const newNodes = clipboard.nodes.map((node) => {
    const newId = `${node.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    idMap.set(node.id, newId);
    return {
      ...node,
      id: newId,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
      selected: true,
    };
  });

  // Remap edge references
  const newEdges = clipboard.edges.map((edge) => ({
    ...edge,
    id: `${edge.id}-copy-${Date.now()}`,
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
    selected: false,
  }));

  // Deselect existing, add new
  set({
    nodes: [
      ...nodes.map((n) => ({ ...n, selected: false })),
      ...newNodes,
    ],
    edges: [...edges, ...newEdges],
  });
},

cut: () => {
  const { copy, nodes, edges } = get();
  copy();
  const selectedNodeIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
  set({
    nodes: nodes.filter((n) => !n.selected),
    edges: edges.filter(
      (e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
    ),
  });
},
```

---

## Context Menus

Use shadcn's ContextMenu or build a custom one:

```tsx
// components/flow/FlowContextMenu.tsx
import { useCallback, useState } from "react";
import { useReactFlow } from "@xyflow/react";

type MenuPosition = { x: number; y: number } | null;
type MenuContext =
  | { type: "pane"; position: XYPosition }
  | { type: "node"; nodeId: string }
  | { type: "edge"; edgeId: string }
  | null;

export function useContextMenu() {
  const [menu, setMenu] = useState<{
    screen: MenuPosition;
    context: MenuContext;
  }>({
    screen: null,
    context: null,
  });

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const { screenToFlowPosition } = useReactFlow.getState();
    setMenu({
      screen: { x: event.clientX, y: event.clientY },
      context: {
        type: "pane",
        position: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      },
    });
  }, []);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setMenu({
        screen: { x: event.clientX, y: event.clientY },
        context: { type: "node", nodeId: node.id },
      });
    },
    [],
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setMenu({
        screen: { x: event.clientX, y: event.clientY },
        context: { type: "edge", edgeId: edge.id },
      });
    },
    [],
  );

  const closeMenu = useCallback(
    () => setMenu({ screen: null, context: null }),
    [],
  );

  return {
    menu,
    onPaneContextMenu,
    onNodeContextMenu,
    onEdgeContextMenu,
    closeMenu,
  };
}

// Render the menu:
function FlowContextMenu({ position, context, onClose }: ContextMenuProps) {
  if (!position || !context) return null;

  return (
    <div
      className="absolute z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md"
      style={{ left: position.x, top: position.y }}
    >
      {context.type === "pane" && (
        <>
          <ContextMenuItem
            icon={<Plus />}
            label="Add Node"
            onClick={() => {
              addNode(context.position);
              onClose();
            }}
          />
          <ContextMenuItem
            icon={<Clipboard />}
            label="Paste"
            onClick={() => {
              paste(context.position);
              onClose();
            }}
          />
        </>
      )}
      {context.type === "node" && (
        <>
          <ContextMenuItem
            icon={<Copy />}
            label="Copy"
            onClick={() => {
              copy();
              onClose();
            }}
          />
          <ContextMenuItem
            icon={<Trash2 />}
            label="Delete"
            onClick={() => {
              deleteNode(context.nodeId);
              onClose();
            }}
          />
          <ContextMenuItem
            icon={<Edit />}
            label="Edit"
            onClick={() => {
              openEditor(context.nodeId);
              onClose();
            }}
          />
        </>
      )}
    </div>
  );
}
```

Pass the handlers to ReactFlow:

```tsx
<ReactFlow
  onPaneContextMenu={onPaneContextMenu}
  onNodeContextMenu={onNodeContextMenu}
  onEdgeContextMenu={onEdgeContextMenu}
  onPaneClick={closeMenu}
/>;
{
  menu.screen && (
    <FlowContextMenu
      position={menu.screen}
      context={menu.context}
      onClose={closeMenu}
    />
  );
}
```

---
