# React Flow - Hooks Reference

> Package: `@xyflow/react`. FREE version only. All imports are named exports.

## Hooks

### useReactFlow

The primary hook for programmatic flow control. **Must be inside `<ReactFlowProvider>`**.

```tsx
const {
  // Getters
  getNodes, // () => Node[]
  getEdges, // () => Edge[]
  getNode, // (id: string) => Node | undefined
  getEdge, // (id: string) => Edge | undefined
  getInternalNode, // (id: string) => InternalNode | undefined

  // Setters
  setNodes, // (nodes: Node[] | (prev: Node[]) => Node[]) => void
  setEdges, // (edges: Edge[] | (prev: Edge[]) => Edge[]) => void
  addNodes, // (nodes: Node | Node[]) => void
  addEdges, // (edges: Edge | Edge[]) => void

  // Node/Edge update helpers
  updateNode, // (id, nodeUpdate, options?) => void
  updateNodeData, // (id, dataUpdate, options?) => void
  updateEdge, // (id, edgeUpdate, options?) => void
  updateEdgeData, // (id, dataUpdate, options?) => void

  // Deletion
  deleteElements, // ({ nodes?: {id}[], edges?: {id}[] }) => Promise<{deletedNodes, deletedEdges}>

  // Viewport
  getViewport, // () => Viewport
  setViewport, // (viewport, options?) => void
  fitView, // (options?: FitViewOptions) => boolean
  fitBounds, // (bounds: Rect, options?) => void
  zoomIn, // (options?) => void
  zoomOut, // (options?) => void
  zoomTo, // (zoom: number, options?) => void
  setCenter, // (x, y, options?) => void

  // Coordinate conversion
  screenToFlowPosition, // (position: XYPosition) => XYPosition (pass clientX/clientY)
  flowToScreenPosition, // (position: XYPosition) => XYPosition

  // Serialization
  toObject, // () => ReactFlowJsonObject

  // Viewport element visibility
  getIntersectingNodes, // (rect: Rect | Node, partially?: boolean, nodes?: Node[]) => Node[]
  isNodeIntersecting, // (node: Node, rect: Rect, partially?: boolean) => boolean
} = useReactFlow();
```

### useNodes / useEdges

Returns the current nodes/edges. Triggers re-render on ANY change.

```tsx
const nodes = useNodes<AppNode>(); // Node[]
const edges = useEdges(); // Edge[]
```

> **Performance warning**: These re-render on every node move. Avoid in custom nodes. Use `useNodesData` or `useStore` with selectors instead.

### useNodesState / useEdgesState

Convenience hooks for prototyping (NOT recommended for production):

```tsx
const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```

### useHandleConnections

Get connections for a specific handle. Reactive — updates when connections change.

```tsx
// Inside a custom node:
const connections = useHandleConnections({
  type: "target", // 'source' | 'target'
  id: "input-handle", // optional handle id
});
// Returns: { source: string; sourceHandle: string | null; target: string; targetHandle: string | null; edgeId: string }[]
```

### useNodeConnections

Get all connections for the current node (all handles):

```tsx
const connections = useNodeConnections({
  type: "target", // optional filter by type
});
```

### useNodesData

Reactively get data from specific nodes by ID. Only re-renders when those nodes' data changes.

```tsx
const nodesData = useNodesData(nodeIds);
// Returns: { id: string; type: string; data: Record<string, unknown> }[]

// Single node:
const nodeData = useNodesData(nodeId);
```

### useConnection

Access the ongoing connection state (while user is dragging a new edge):

```tsx
const connection = useConnection();
// Returns ConnectionState:
// {
//   inProgress: boolean;
//   isValid: boolean | null;
//   from: { nodeId, handleId, handleType, x, y } | null;
//   to: { nodeId, handleId, handleType, x, y, position } | null;
//   fromHandle: HandleElement | null;
//   toHandle: HandleElement | null;
// }
```

### useStore / useStoreApi

Direct access to React Flow's internal Zustand store:

```tsx
// Reactive selector (component re-renders when selection changes)
const nodeCount = useStore((state) => state.nodes.length);
const selectedNodeIds = useStore((state) =>
  state.nodes.filter((n) => n.selected).map((n) => n.id),
);

// ✅ ALWAYS define selectors outside component or with useCallback
const selector = (state: ReactFlowState) => state.nodeLookup.get("node-1");
const node = useStore(selector);

// Non-reactive store access
const store = useStoreApi();
const { nodeLookup, edges } = store.getState();
```

**Important internal store fields:**

| Field             | Type                        | Description                |
| ----------------- | --------------------------- | -------------------------- |
| `nodes`           | `Node[]`                    | Current nodes              |
| `edges`           | `Edge[]`                    | Current edges              |
| `nodeLookup`      | `Map<string, InternalNode>` | Node lookup by ID          |
| `selectedNodeIds` | `Set<string>`               | IDs of selected nodes      |
| `selectedEdgeIds` | `Set<string>`               | IDs of selected edges      |
| `width`           | `number`                    | Viewport width             |
| `height`          | `number`                    | Viewport height            |
| `transform`       | `[x, y, zoom]`              | Current viewport transform |
| `connectionMode`  | `ConnectionMode`            | Connection mode            |

### useNodeId

Get the ID of the current node (only works inside custom node components):

```tsx
const nodeId = useNodeId(); // string | null
```

### useInternalNode

Get the internal node representation (includes measured dimensions):

```tsx
const internalNode = useInternalNode(nodeId);
// InternalNode extends Node with:
// - measured: { width?: number; height?: number }
// - internals: { positionAbsolute: XYPosition; z: number; handleBounds?: ... }
```

### useNodesInitialized

Returns true when all nodes have been measured:

```tsx
const initialized = useNodesInitialized({ includeHiddenNodes: false });
// Useful for triggering layout after initial render
```

### useOnSelectionChange

Register a callback for selection changes (nodes and edges):

```tsx
useOnSelectionChange({
  onChange: ({ nodes, edges }) => {
    console.log("Selected:", nodes.length, "nodes,", edges.length, "edges");
  },
});
```

### useOnViewportChange

```tsx
useOnViewportChange({
  onStart: (viewport) => console.log("Pan/zoom start", viewport),
  onChange: (viewport) => console.log("Pan/zoom change", viewport),
  onEnd: (viewport) => console.log("Pan/zoom end", viewport),
});
```

### useViewport

Reactive viewport state:

```tsx
const { x, y, zoom } = useViewport();
```

### useKeyPress

```tsx
const spacePressed = useKeyPress("Space");
const ctrlS = useKeyPress(["Meta+s", "Control+s"]);
```

### useUpdateNodeInternals

Force React Flow to recalculate node dimensions and handle positions:

```tsx
const updateNodeInternals = useUpdateNodeInternals();
// Call after dynamically adding/removing handles:
updateNodeInternals(nodeId);
// Or multiple:
updateNodeInternals(["node-1", "node-2"]);
```

---
