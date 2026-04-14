# React Flow - Types and Utilities Reference

> Package: `@xyflow/react`. FREE version only. All imports are named exports.

## Types

### Node

```ts
type Node<T = Record<string, unknown>, U = string> = {
  id: string;
  type?: U;
  position: XYPosition;
  data: T;

  // Optional
  width?: number; // Fixed width (used as inline style)
  height?: number; // Fixed height
  measured?: {
    // Read-only — set by React Flow after measuring
    width?: number;
    height?: number;
  };
  parentId?: string;
  extent?: "parent" | CoordinateExtent;
  expandParent?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  dragHandle?: string; // CSS selector for drag handle
  hidden?: boolean;
  selected?: boolean;
  zIndex?: number;
  ariaLabel?: string;
  origin?: NodeOrigin;
  className?: string;
  style?: CSSProperties;
  sourcePosition?: Position;
  targetPosition?: Position;
};
```

### Edge

```ts
type Edge<T = Record<string, unknown>, U = string> = {
  id: string;
  source: string;
  target: string;
  type?: U;
  data?: T;

  // Optional
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string | ReactNode;
  labelStyle?: CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: CSSProperties;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  animated?: boolean;
  hidden?: boolean;
  selected?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  reconnectable?: boolean;
  zIndex?: number;
  ariaLabel?: string;
  interactionWidth?: number;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  className?: string;
  style?: CSSProperties;
};
```

### Connection

```ts
type Connection = {
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
};
```

### NodeChange / EdgeChange

```ts
type NodeChange =
  | { type: "position"; id: string; position?: XYPosition; dragging?: boolean }
  | {
      type: "dimensions";
      id: string;
      dimensions?: { width: number; height: number };
      resizing?: boolean;
    }
  | { type: "select"; id: string; selected: boolean }
  | { type: "remove"; id: string }
  | { type: "add"; item: Node }
  | { type: "replace"; id: string; item: Node };

type EdgeChange =
  | { type: "select"; id: string; selected: boolean }
  | { type: "remove"; id: string }
  | { type: "add"; item: Edge }
  | { type: "replace"; id: string; item: Edge };
```

### NodeProps (Custom Node Component)

```ts
type NodeProps<T extends Node = Node> = {
  id: string;
  type: string;
  data: T["data"];
  selected: boolean;
  dragging: boolean;
  isConnectable: boolean;
  zIndex: number;
  positionAbsoluteX: number;
  positionAbsoluteY: number;
  draggable: boolean;
  selectable: boolean;
  deletable: boolean;
  parentId?: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number };
};
```

### EdgeProps (Custom Edge Component)

```ts
type EdgeProps<T extends Edge = Edge> = {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: T["data"];
  selected?: boolean;
  animated?: boolean;
  label?: string | ReactNode;
  labelStyle?: CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: CSSProperties;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  style?: CSSProperties;
  markerStart?: string;
  markerEnd?: string;
  interactionWidth?: number;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
};
```

### ReactFlowJsonObject

```ts
type ReactFlowJsonObject<N = Node, E = Edge> = {
  nodes: N[];
  edges: E[];
  viewport: Viewport;
};
```

### Other Key Types

```ts
type Viewport = { x: number; y: number; zoom: number };
type XYPosition = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };
type NodeOrigin = [number, number]; // [0,0] = top-left, [0.5,0.5] = center
type SnapGrid = [number, number];
type CoordinateExtent = [[number, number], [number, number]];

type Position = "top" | "bottom" | "left" | "right";
// Also available as enum: Position.Top, Position.Bottom, etc.

type ConnectionMode = "strict" | "loose";
type SelectionMode = "full" | "partial";
type ColorMode = "light" | "dark" | "system";
type BackgroundVariant = "dots" | "lines" | "cross";

type EdgeMarker = {
  type: MarkerType; // MarkerType.Arrow | MarkerType.ArrowClosed
  color?: string;
  width?: number;
  height?: number;
  markerUnits?: string;
  orient?: string;
  strokeWidth?: number;
};

type FitViewOptions = {
  padding?: number;
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  duration?: number;
  nodes?: { id: string }[]; // Fit to specific nodes
};

type IsValidConnection = (connection: Connection | Edge) => boolean;
type OnConnect = (connection: Connection) => void;
type OnNodesChange<T extends Node = Node> = (changes: NodeChange<T>[]) => void;
type OnEdgesChange = (changes: EdgeChange[]) => void;
type OnInit = (instance: ReactFlowInstance) => void;
type OnDelete = (params: { nodes: Node[]; edges: Edge[] }) => void;
type OnBeforeDelete = (params: {
  nodes: Node[];
  edges: Edge[];
}) => Promise<boolean>;

type OnReconnect = (oldEdge: Edge, newConnection: Connection) => void;

type NodeMouseHandler = (event: React.MouseEvent, node: Node) => void;
type EdgeMouseHandler = (event: React.MouseEvent, edge: Edge) => void;
type OnNodeDrag = (event: React.MouseEvent, node: Node, nodes: Node[]) => void;
type SelectionDragHandler = (event: React.MouseEvent, nodes: Node[]) => void;
type OnMove = (
  event: MouseEvent | TouchEvent | null,
  viewport: Viewport,
) => void;
type OnSelectionChangeFunc = (params: { nodes: Node[]; edges: Edge[] }) => void;
```

---

## Utility Functions

### Path Generation

```ts
// Returns [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]

getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature? })
getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius?, offset? })
getStraightPath({ sourceX, sourceY, targetX, targetY })
getSimpleBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
```

### State Helpers

```ts
// Apply changes arrays to state
applyNodeChanges(changes: NodeChange[], nodes: Node[]): Node[]
applyEdgeChanges(changes: EdgeChange[], edges: Edge[]): Edge[]

// Add edge (prevents duplicates)
addEdge(connection: Connection | Edge, edges: Edge[]): Edge[]

// Reconnect edge
reconnectEdge(oldEdge: Edge, newConnection: Connection, edges: Edge[]): Edge[]
```

### Graph Queries

```ts
// Get edges connected to nodes
getConnectedEdges(nodes: Node[], edges: Edge[]): Edge[]

// Get parent nodes (nodes with edges TO this node)
getIncomers(node: Node, nodes: Node[], edges: Edge[]): Node[]

// Get child nodes (nodes with edges FROM this node)
getOutgoers(node: Node, nodes: Node[], edges: Edge[]): Node[]

// Get bounding box of nodes
getNodesBounds(nodes: Node[], options?: { nodeOrigin?: NodeOrigin }): Rect

// Get viewport that fits the given bounds
getViewportForBounds(
  bounds: Rect,
  width: number,
  height: number,
  minZoom: number,
  maxZoom: number,
  padding?: number,
): Viewport
```

### Type Guards

```ts
isNode(element: Node | Edge): element is Node
isEdge(element: Node | Edge): element is Edge
```
