# React Flow - Layout, Grouping, and Validation Patterns

> Production patterns for flow-based SaaS products using React + Tailwind + shadcn/ui + Lucide Icons + Zustand.

## Auto Layout

### Dagre (Simple Tree/DAG Layout)

```bash
npm install @dagrejs/dagre
```

```tsx
import Dagre from "@dagrejs/dagre";
import { type Node, type Edge } from "@xyflow/react";

export function layoutDagre(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
): { nodes: Node[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 80,
    edgesep: 20,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.measured?.width ?? node.width ?? 200,
      height: node.measured?.height ?? node.height ?? 50,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const width = node.measured?.width ?? node.width ?? 200;
    const height = node.measured?.height ?? node.height ?? 50;
    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Usage:
function LayoutButton() {
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();

  const onLayout = useCallback(
    (direction: "TB" | "LR") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = layoutDagre(
        getNodes(),
        getEdges(),
        direction,
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      // Wait for React to render, then fit view
      requestAnimationFrame(() => fitView({ duration: 300 }));
    },
    [getNodes, getEdges, setNodes, setEdges, fitView],
  );

  return (
    <Panel position="top-right" className="flex gap-1">
      <Button variant="outline" size="sm" onClick={() => onLayout("TB")}>
        <ArrowDown className="mr-1 h-3 w-3" /> Vertical
      </Button>
      <Button variant="outline" size="sm" onClick={() => onLayout("LR")}>
        <ArrowRight className="mr-1 h-3 w-3" /> Horizontal
      </Button>
    </Panel>
  );
}
```

### ELK (Advanced Layout)

```bash
npm install elkjs
```

```tsx
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export async function layoutElk(
  nodes: Node[],
  edges: Edge[],
  options: Record<string, string> = {},
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.edgeRouting": "ORTHOGONAL",
      ...options,
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: node.measured?.width ?? node.width ?? 200,
      height: node.measured?.height ?? node.height ?? 50,
      ports: [], // Add port definitions for precise edge routing
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(elkGraph);

  const layoutedNodes = nodes.map((node) => {
    const elkNode = layout.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

---

## Sub-Flows & Grouping

### Parent-Child Nodes

```tsx
// Group node definition
type GroupNode = Node<{ label: string }, "group">;

const groupNode: GroupNode = {
  id: "group-1",
  type: "group",
  position: { x: 0, y: 0 },
  data: { label: "Processing Pipeline" },
  style: { width: 400, height: 300 }, // Groups need explicit dimensions
};

// Child node — references parent via parentId
const childNode: AppNode = {
  id: "child-1",
  type: "action",
  position: { x: 20, y: 60 }, // Position RELATIVE to parent
  parentId: "group-1",
  extent: "parent", // Constrain within parent bounds
  data: { label: "Step 1" },
};

// Parent must appear BEFORE children in the nodes array
const nodes = [groupNode, childNode];
```

### Group Node Component

```tsx
function GroupNodeComponent({ data, selected }: NodeProps<GroupNode>) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed bg-muted/30 p-2",
        selected && "border-blue-500",
      )}
    >
      <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {data.label}
      </div>
      {/* Children render automatically inside the group's bounds */}
    </div>
  );
}
```

### Dynamic Grouping (Selection → Group)

```tsx
function groupSelectedNodes() {
  const { nodes, edges, setNodes, setEdges } = get();
  const selectedNodes = nodes.filter((n) => n.selected && !n.parentId);
  if (selectedNodes.length < 2) return;

  const bounds = getNodesBounds(selectedNodes);
  const padding = 40;

  const groupId = `group-${Date.now()}`;
  const groupNode: GroupNode = {
    id: groupId,
    type: "group",
    position: { x: bounds.x - padding, y: bounds.y - padding },
    data: { label: "Group" },
    style: {
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
    },
  };

  const updatedNodes = selectedNodes.map((node) => ({
    ...node,
    parentId: groupId,
    extent: "parent" as const,
    position: {
      x: node.position.x - bounds.x + padding,
      y: node.position.y - bounds.y + padding,
    },
    selected: false,
  }));

  const otherNodes = nodes.filter(
    (n) => !selectedNodes.some((s) => s.id === n.id),
  );

  // Group must come before its children
  setNodes([...otherNodes, groupNode, ...updatedNodes]);
}
```

---

## Drag and Drop Sidebar

### Sidebar Component

```tsx
// components/flow/Sidebar.tsx
import { GripVertical, Zap, Settings, GitBranch, Timer } from "lucide-react";

const NODE_CATALOG = [
  {
    type: "trigger",
    label: "Trigger",
    icon: Zap,
    description: "Start the flow",
  },
  {
    type: "action",
    label: "Action",
    icon: Settings,
    description: "Perform an action",
  },
  {
    type: "condition",
    label: "Condition",
    icon: GitBranch,
    description: "Branch logic",
  },
  {
    type: "delay",
    label: "Delay",
    icon: Timer,
    description: "Wait before continuing",
  },
];

export function FlowSidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 border-r bg-background p-4">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        Nodes
      </h3>
      <div className="space-y-2">
        {NODE_CATALOG.map(({ type, label, icon: Icon, description }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="flex cursor-grab items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Icon className="h-4 w-4" />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
```

### Drop Handler in Flow

```tsx
function FlowCanvas() {
  const { screenToFlowPosition } = useReactFlow();
  const { addNode } = useFlowStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode({
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}` },
      });
    },
    [screenToFlowPosition, addNode],
  );

  return (
    <ReactFlow
      onDragOver={onDragOver}
      onDrop={onDrop}
      // ... other props
    />
  );
}
```

---

## Connection Validation

### Prevent Cycles

```tsx
import {
  getOutgoers,
  type IsValidConnection,
  type Node,
  type Edge,
} from "@xyflow/react";

function hasCycle(
  source: string,
  target: string,
  nodes: Node[],
  edges: Edge[],
): boolean {
  const visited = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (nodeId === source) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);

    const outgoers = getOutgoers({ id: nodeId } as Node, nodes, edges);
    return outgoers.some((outgoer) => dfs(outgoer.id));
  }

  return dfs(target);
}

// Pass to ReactFlow:
const isValidConnection: IsValidConnection = useCallback((connection) => {
  const { nodes, edges } = useFlowStore.getState();
  // No self-connections
  if (connection.source === connection.target) return false;
  // No cycles
  return !hasCycle(connection.source!, connection.target!, nodes, edges);
}, []);

<ReactFlow isValidConnection={isValidConnection} />;
```

### Limit Connections Per Handle

```tsx
function useConnectionLimit(
  handleId: string,
  type: "source" | "target",
  limit: number,
) {
  const connections = useHandleConnections({ type, id: handleId });
  return connections.length < limit;
}

// In Handle:
<Handle
  type="target"
  position={Position.Left}
  id="input"
  isConnectable={connections.length < maxConnections}
/>;
```

---
