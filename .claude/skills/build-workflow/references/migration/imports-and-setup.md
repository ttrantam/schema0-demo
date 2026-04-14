# React Flow - Imports and Setup

> Correct import patterns and setup rules for `@xyflow/react`.

## Package & Imports

```bash
npm install @xyflow/react zustand
```

```tsx
// ✅ CORRECT imports — NAMED exports from @xyflow/react
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  NodeToolbar,
  NodeResizer,
  EdgeLabelRenderer,
  ViewportPortal,
  useReactFlow,
  useNodes,
  useEdges,
  useNodesState,
  useEdgesState,
  useHandleConnections,
  useNodesData,
  useNodeId,
  useConnection,
  useStore,
  useStoreApi,
  useKeyPress,
  useOnSelectionChange,
  useOnViewportChange,
  useNodesInitialized,
  useUpdateNodeInternals,
  useInternalNode,
  useNodeConnections,
  useViewport,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  getNodesBounds,
  getViewportForBounds,
  reconnectEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  getSimpleBezierPath,
  isNode,
  isEdge,
  MarkerType,
  ConnectionMode,
  BackgroundVariant,
  SelectionMode,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeProps,
  type EdgeProps,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type OnInit,
  type ReactFlowInstance,
  type ReactFlowJsonObject,
  type FitViewOptions,
  type Viewport,
  type XYPosition,
  type ConnectionState,
  type IsValidConnection,
  type OnBeforeDelete,
  type OnDelete,
  type OnReconnect,
  type OnSelectionChangeFunc,
  type ColorMode,
  type InternalNode,
} from "@xyflow/react";

// ✅ CORRECT style import
import "@xyflow/react/dist/style.css";
// OR for minimal styles (you handle theming):
import "@xyflow/react/dist/base.css";
```

```tsx
// ❌ NEVER use old imports
import ReactFlow from "reactflow"; // WRONG — old package
import "reactflow/dist/style.css"; // WRONG — old path
```

### Rules Checklist

Always apply these rules when writing React Flow code:

1. **Package**: `@xyflow/react` (NOT `reactflow`)
2. **Named export**: `import { ReactFlow }` (NOT default import)
3. **Measured dimensions**: Use `node.measured?.width` / `node.measured?.height` (NOT `node.width`/`node.height` for reading measured values). `node.width`/`node.height` are for SETTING fixed dimensions.
4. **Immutable updates**: Always spread nodes/edges — `{ ...node, hidden: true }` (NOT `node.hidden = true`)
5. **Parent nodes**: Use `parentId` (NOT `parentNode`)
6. **Reconnect**: Use `onReconnect`, `reconnectEdge`, `edgesReconnectable` (NOT `onEdgeUpdate`, `updateEdge`, `edgesUpdatable`)
7. **Custom node props**: Use `positionAbsoluteX`/`positionAbsoluteY` (NOT `xPos`/`yPos`)
8. **Internal store**: Use `nodeLookup` (NOT `nodeInternals`)
9. **Position conversion**: Use `screenToFlowPosition` (NOT `project`)
10. **Bounds**: Use `getNodesBounds(nodes, { nodeOrigin })` (NOT `getNodesBounds(nodes, nodeOrigin)`)
11. **Node type union**: Define `type AppNode = NodeA | NodeB` for TypeScript
