# React Flow - Production Store and Editor Shell Architecture

> Focused on production state management and editor shell structure.

## Mandatory Architecture (Enterprise SaaS)

### Zustand Store Pattern (ALWAYS use this for production)

Do NOT use `useNodesState`/`useEdgesState` in production SaaS apps. They are prototyping hooks. Use a Zustand store:

```tsx
// store/flow-store.ts
import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";

// Define your node types
type TriggerNodeData = { label: string; event: string };
type ActionNodeData = {
  label: string;
  action: string;
  config: Record<string, unknown>;
};

type TriggerNode = Node<TriggerNodeData, "trigger">;
type ActionNode = Node<ActionNodeData, "action">;
export type AppNode = TriggerNode | ActionNode;
export type AppEdge = Edge;

export interface FlowState {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  addNode: (node: AppNode) => void;
  updateNodeData: (nodeId: string, data: Partial<AppNode["data"]>) => void;
  deleteElements: (nodeIds: string[], edgeIds: string[]) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange<AppNode>[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection: Connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set({ nodes: [...get().nodes, node] }),
  updateNodeData: (nodeId, data) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }),
  deleteElements: (nodeIds, edgeIds) =>
    set({
      nodes: get().nodes.filter((n) => !nodeIds.includes(n.id)),
      edges: get().edges.filter(
        (e) =>
          !edgeIds.includes(e.id) &&
          !nodeIds.includes(e.source) &&
          !nodeIds.includes(e.target),
      ),
    }),
}));
```

### Flow Component Shell

```tsx
// components/flow/FlowEditor.tsx
import { useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
  ConnectionMode,
  type ColorMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useFlowStore } from "@/store/flow-store";
import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";

// ✅ Define OUTSIDE component to prevent re-render loops
const defaultEdgeOptions = {
  animated: false,
  type: "smoothstep",
};

function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useFlowStore();

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        colorMode="light"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode="Shift"
        snapToGrid
        snapGrid={[16, 16]}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}

// ✅ ALWAYS wrap in provider for hooks to work outside ReactFlow
export function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
```
