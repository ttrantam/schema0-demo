# React Flow - Custom Nodes, Edges, and Core Workflow Examples

> Includes typed custom nodes/edges, interaction patterns, serialization, dark mode, and computing flows.

## Custom Nodes

```tsx
// components/flow/nodes/ActionNode.tsx
import { memo } from "react";
import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionNodeData = {
  label: string;
  action: string;
  status?: "idle" | "running" | "success" | "error";
};

// ✅ Define node type for type safety
export type ActionNodeType = Node<ActionNodeData, "action">;

// ✅ Use NodeProps<YourNodeType> for typed props
function ActionNodeComponent({ data, selected }: NodeProps<ActionNodeType>) {
  return (
    <>
      {/* Free version NodeResizer — no Pro required */}
      <NodeResizer
        minWidth={180}
        minHeight={60}
        isVisible={selected}
        lineClassName="!border-blue-500"
        handleClassName="!h-2.5 !w-2.5 !bg-blue-500 !border-2 !border-white !rounded-sm"
      />
      <div
        className={cn(
          "rounded-lg border bg-card px-4 py-3 shadow-sm transition-all",
          "min-w-[180px]",
          selected && "ring-2 ring-blue-500",
          data.status === "running" && "border-yellow-400",
          data.status === "success" && "border-green-400",
          data.status === "error" && "border-red-400",
        )}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{data.label}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{data.action}</p>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />
    </>
  );
}

// ✅ ALWAYS memo custom nodes for performance
export const ActionNode = memo(ActionNodeComponent);
```

### Register Node Types

```tsx
// components/flow/nodes/index.ts
import type { NodeTypes } from "@xyflow/react";
import { ActionNode } from "./ActionNode";
import { TriggerNode } from "./TriggerNode";

// ✅ Define OUTSIDE component — never inline in JSX
export const nodeTypes: NodeTypes = {
  action: ActionNode,
  trigger: TriggerNode,
};
```

## Custom Edges

```tsx
// components/flow/edges/ButtonEdge.tsx
import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { X } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

type ButtonEdgeData = { label?: string };
export type ButtonEdgeType = Edge<ButtonEdgeData, "button">;

function ButtonEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<ButtonEdgeType>) {
  const deleteElements = useFlowStore((s) => s.deleteElements);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {data?.label && (
            <span className="rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground shadow-sm border">
              {data.label}
            </span>
          )}
          <button
            className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deleteElements([], [id])}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const ButtonEdge = memo(ButtonEdgeComponent);
```

## Essential Interaction Patterns

### Connection Validation

```tsx
const isValidConnection: IsValidConnection = useCallback((connection) => {
  const { source, target, sourceHandle, targetHandle } = connection;
  // Prevent self-connections
  if (source === target) return false;
  // Prevent cycles
  const nodes = useFlowStore.getState().nodes;
  const edges = useFlowStore.getState().edges;
  const target_node = nodes.find((n) => n.id === target);
  if (!target_node) return false;
  const hasCycle = (nodeId: string, visited = new Set<string>()): boolean => {
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    const outgoers = getOutgoers({ id: nodeId } as Node, nodes, edges);
    for (const outgoer of outgoers) {
      if (outgoer.id === source) return true;
      if (hasCycle(outgoer.id, visited)) return true;
    }
    return false;
  };
  return !hasCycle(target!);
}, []);
```

### Drag and Drop from Sidebar

```tsx
const onDragOver = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}, []);

const onDrop = useCallback(
  (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow");
    if (!type) return;

    // ✅ Use screenToFlowPosition (NOT project)
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: AppNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label: `New ${type}` },
    };
    addNode(newNode);
  },
  [screenToFlowPosition, addNode],
);
```

### Save & Restore (Serialization)

```tsx
// ✅ Use toObject() from useReactFlow
const { toObject, setViewport, setNodes, setEdges } = useReactFlow();

const onSave = useCallback(() => {
  const flow: ReactFlowJsonObject = toObject();
  localStorage.setItem("flow", JSON.stringify(flow));
  // Or POST to your API
}, [toObject]);

const onRestore = useCallback(() => {
  const raw = localStorage.getItem("flow");
  if (!raw) return;
  const flow: ReactFlowJsonObject = JSON.parse(raw);
  setNodes(flow.nodes || []);
  setEdges(flow.edges || []);
  if (flow.viewport) {
    setViewport(flow.viewport);
  }
}, [setNodes, setEdges, setViewport]);
```

## Performance Rules (CRITICAL)

1. **Memo all custom nodes and edges** — `memo(MyNode)` always
2. **Define `nodeTypes` and `edgeTypes` OUTSIDE the component** — never inline or inside render
3. **`useCallback` all event handlers** passed to `<ReactFlow />`
4. **Never subscribe to `useNodes()` / `useEdges()` in custom nodes** — causes O(n²) re-renders. Use `useNodesData` or `useStore` with selectors instead.
5. **Use Zustand selectors** — `useStore((s) => s.nodeLookup.get(id))` for targeted reads
6. **Avoid spreading `useFlowStore()` in render** — destructure only what you need
7. **For 500+ nodes**: use `nodesDraggable={false}` as default, enable per-node; consider `onlyRenderVisibleElements` (enabled by default)

## Dark Mode (Built-in)

```tsx
// ✅ Native dark mode via colorMode prop
<ReactFlow
  colorMode="dark" // 'light' | 'dark' | 'system'
  // Adds .dark class to wrapper, uses CSS variables
/>

// Tailwind integration — React Flow's .dark class works with Tailwind dark:
// Ensure your tailwind.config uses class-based dark mode:
// darkMode: 'class'
```

## Computing Flows (Data Flow)

Use `useHandleConnections` + `useNodesData` to build reactive node-to-node data pipelines:

```tsx
function ProcessorNode({ id }: NodeProps) {
  const { updateNodeData } = useReactFlow();

  // Get all connections to the "input" handle
  const connections = useHandleConnections({ type: "target", id: "input" });

  // Get data from connected source nodes — REACTIVE
  const connectedData = useNodesData(connections.map((c) => c.source));

  useEffect(() => {
    const sum = connectedData.reduce(
      (acc, nd) => acc + (nd?.data?.value ?? 0),
      0,
    );
    updateNodeData(id, { result: sum });
  }, [connectedData, id, updateNodeData]);

  return <div>...</div>;
}
```
