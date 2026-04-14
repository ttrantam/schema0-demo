# React Flow — Complete API Reference

> Package: `@xyflow/react`. FREE version only. All imports are named exports.

## Table of Contents

- [ReactFlow Component Props](#reactflow-component-props)
- [ReactFlowProvider](#reactflowprovider)
- [Components](#components)

---

## ReactFlow Component Props

```tsx
import { ReactFlow } from "@xyflow/react";
```

### Core Props

| Prop                 | Type                 | Default | Description                                     |
| -------------------- | -------------------- | ------- | ----------------------------------------------- |
| `nodes`              | `Node[]`             | `[]`    | Array of node objects                           |
| `edges`              | `Edge[]`             | `[]`    | Array of edge objects                           |
| `defaultNodes`       | `Node[]`             | -       | Initial nodes for uncontrolled mode             |
| `defaultEdges`       | `Edge[]`             | -       | Initial edges for uncontrolled mode             |
| `onNodesChange`      | `OnNodesChange`      | -       | Called when nodes change (move, select, remove) |
| `onEdgesChange`      | `OnEdgesChange`      | -       | Called when edges change (select, remove)       |
| `onConnect`          | `OnConnect`          | -       | Called when a new connection is made            |
| `nodeTypes`          | `NodeTypes`          | -       | Custom node component registry                  |
| `edgeTypes`          | `EdgeTypes`          | -       | Custom edge component registry                  |
| `defaultEdgeOptions` | `DefaultEdgeOptions` | -       | Defaults applied to new edges                   |

### Event Handlers

| Prop                     | Type                                | Description                                                           |
| ------------------------ | ----------------------------------- | --------------------------------------------------------------------- |
| `onInit`                 | `OnInit`                            | Called when ReactFlow is initialized                                  |
| `onNodeClick`            | `NodeMouseHandler`                  | Node click                                                            |
| `onNodeDoubleClick`      | `NodeMouseHandler`                  | Node double click                                                     |
| `onNodeDragStart`        | `OnNodeDrag`                        | Node drag start (also fires for selection drag)                       |
| `onNodeDrag`             | `OnNodeDrag`                        | During node drag                                                      |
| `onNodeDragStop`         | `OnNodeDrag`                        | Node drag end                                                         |
| `onNodeMouseEnter`       | `NodeMouseHandler`                  | Mouse enter node                                                      |
| `onNodeMouseLeave`       | `NodeMouseHandler`                  | Mouse leave node                                                      |
| `onNodeContextMenu`      | `NodeMouseHandler`                  | Right-click on node                                                   |
| `onEdgeClick`            | `EdgeMouseHandler`                  | Edge click                                                            |
| `onEdgeDoubleClick`      | `EdgeMouseHandler`                  | Edge double click                                                     |
| `onEdgeContextMenu`      | `EdgeMouseHandler`                  | Right-click on edge                                                   |
| `onEdgeMouseEnter`       | `EdgeMouseHandler`                  | Mouse enter edge                                                      |
| `onEdgeMouseLeave`       | `EdgeMouseHandler`                  | Mouse leave edge                                                      |
| `onConnectStart`         | `OnConnectStart`                    | Connection drag start                                                 |
| `onConnectEnd`           | `OnConnectEnd`                      | Connection drag end                                                   |
| `onReconnect`            | `OnReconnect`                       | Edge reconnected to different handle                                  |
| `onReconnectStart`       | `(event, edge, handleType) => void` | Reconnect drag start                                                  |
| `onReconnectEnd`         | `(event, edge, handleType) => void` | Reconnect drag end                                                    |
| `onSelectionChange`      | `OnSelectionChangeFunc`             | Selection changed                                                     |
| `onSelectionDragStart`   | `SelectionDragHandler`              | Selection box drag start                                              |
| `onSelectionDrag`        | `SelectionDragHandler`              | During selection drag                                                 |
| `onSelectionDragStop`    | `SelectionDragHandler`              | Selection drag end                                                    |
| `onSelectionContextMenu` | `(event, nodes) => void`            | Right-click on selection                                              |
| `onPaneClick`            | `(event) => void`                   | Click on pane (not on node/edge)                                      |
| `onPaneContextMenu`      | `(event) => void`                   | Right-click on pane                                                   |
| `onPaneScroll`           | `(event) => void`                   | Scroll on pane                                                        |
| `onPaneMouseEnter`       | `(event) => void`                   | Mouse enter pane                                                      |
| `onPaneMouseMove`        | `(event) => void`                   | Mouse move on pane                                                    |
| `onPaneMouseLeave`       | `(event) => void`                   | Mouse leave pane                                                      |
| `onMoveStart`            | `OnMove`                            | Viewport move start                                                   |
| `onMove`                 | `OnMove`                            | During viewport move (also fires for programmatic moves like fitView) |
| `onMoveEnd`              | `OnMove`                            | Viewport move end                                                     |
| `onDelete`               | `OnDelete`                          | Combined handler for node+edge deletion                               |
| `onBeforeDelete`         | `OnBeforeDelete`                    | Intercept/prevent deletions. Return `false` to cancel.                |
| `onNodesDelete`          | `OnNodesDelete`                     | Nodes deleted                                                         |
| `onEdgesDelete`          | `OnEdgesDelete`                     | Edges deleted                                                         |
| `onError`                | `OnError`                           | Error handler                                                         |

### Viewport & Interaction Props

| Prop                 | Type                  | Default            | Description                                   |
| -------------------- | --------------------- | ------------------ | --------------------------------------------- |
| `fitView`            | `boolean`             | `false`            | Auto fit view on mount                        |
| `fitViewOptions`     | `FitViewOptions`      | -                  | Options for fitView                           |
| `minZoom`            | `number`              | `0.5`              | Minimum zoom level                            |
| `maxZoom`            | `number`              | `2`                | Maximum zoom level                            |
| `defaultViewport`    | `Viewport`            | `{x:0,y:0,zoom:1}` | Initial viewport                              |
| `viewport`           | `Viewport`            | -                  | Controlled viewport                           |
| `onViewportChange`   | `(viewport) => void`  | -                  | Controlled viewport change                    |
| `snapToGrid`         | `boolean`             | `false`            | Snap nodes to grid                            |
| `snapGrid`           | `[number, number]`    | `[15, 15]`         | Grid size                                     |
| `nodesDraggable`     | `boolean`             | `true`             | Global draggable                              |
| `nodesConnectable`   | `boolean`             | `true`             | Global connectable                            |
| `nodesFocusable`     | `boolean`             | `true`             | Global focusable                              |
| `edgesFocusable`     | `boolean`             | `true`             | Global edge focusable                         |
| `edgesReconnectable` | `boolean`             | `true`             | Allow edge reconnection                       |
| `elementsSelectable` | `boolean`             | `true`             | Global selectable                             |
| `panOnDrag`          | `boolean \| number[]` | `true`             | Enable pan. Array for specific mouse buttons. |
| `panOnScroll`        | `boolean`             | `false`            | Pan via scroll                                |
| `panOnScrollMode`    | `PanOnScrollMode`     | `'free'`           | Scroll pan mode                               |
| `panOnScrollSpeed`   | `number`              | `0.5`              | Scroll pan speed                              |
| `zoomOnScroll`       | `boolean`             | `true`             | Zoom via scroll                               |
| `zoomOnPinch`        | `boolean`             | `true`             | Zoom via pinch                                |
| `zoomOnDoubleClick`  | `boolean`             | `true`             | Zoom on double click                          |
| `preventScrolling`   | `boolean`             | `true`             | Prevent page scroll when mouse over flow      |
| `selectionOnDrag`    | `boolean`             | `false`            | Select by dragging                            |
| `selectionMode`      | `SelectionMode`       | `'full'`           | `'full'` or `'partial'` selection             |
| `selectNodesOnDrag`  | `boolean`             | `true`             | Select node on drag start                     |
| `connectionMode`     | `ConnectionMode`      | `'strict'`         | `'strict'` or `'loose'` handle matching       |
| `connectionRadius`   | `number`              | `20`               | Snap distance for connections                 |
| `reconnectRadius`    | `number`              | `10`               | Snap distance for reconnections               |
| `autoPanOnConnect`   | `boolean`             | `true`             | Auto pan while connecting                     |
| `autoPanOnNodeDrag`  | `boolean`             | `true`             | Auto pan while dragging                       |
| `autoPanSpeed`       | `number`              | `15`               | Auto pan speed                                |
| `nodeDragThreshold`  | `number`              | `1`                | Min pixels before drag starts                 |
| `paneClickDistance`  | `number`              | `0`                | Max mouse move distance for pane click        |

### Styling & Display Props

| Prop                      | Type                      | Default    | Description                         |
| ------------------------- | ------------------------- | ---------- | ----------------------------------- |
| `colorMode`               | `ColorMode`               | `'light'`  | `'light'` \| `'dark'` \| `'system'` |
| `connectionLineType`      | `ConnectionLineType`      | `'bezier'` | Default connection line style       |
| `connectionLineComponent` | `ConnectionLineComponent` | -          | Custom connection line              |
| `connectionLineStyle`     | `CSSProperties`           | -          | Connection line style               |
| `isValidConnection`       | `IsValidConnection`       | -          | Global connection validation        |
| `nodeOrigin`              | `NodeOrigin`              | `[0, 0]`   | Node coordinate origin              |
| `elevateNodesOnSelect`    | `boolean`                 | `true`     | Raise selected nodes z-index        |
| `elevateEdgesOnSelect`    | `boolean`                 | `false`    | Raise selected edge z-index         |

### Keyboard Shortcuts

| Prop                    | Type      | Default       | Description              |
| ----------------------- | --------- | ------------- | ------------------------ |
| `deleteKeyCode`         | `KeyCode` | `'Backspace'` | Delete selected elements |
| `selectionKeyCode`      | `KeyCode` | `'Shift'`     | Add to selection         |
| `multiSelectionKeyCode` | `KeyCode` | `Meta/Ctrl`   | Multi select             |
| `zoomActivationKeyCode` | `KeyCode` | `Meta/Ctrl`   | Activate zoom            |
| `panActivationKeyCode`  | `KeyCode` | `'Space'`     | Activate pan             |

> Pass `null` to disable any shortcut.

### CSS Class Props

| Prop               | Type     | Default     | Description                                 |
| ------------------ | -------- | ----------- | ------------------------------------------- |
| `noDragClassName`  | `string` | `'nodrag'`  | Elements with this class won't trigger drag |
| `noWheelClassName` | `string` | `'nowheel'` | Elements with this class won't trigger zoom |
| `noPanClassName`   | `string` | `'nopan'`   | Elements with this class won't trigger pan  |

### Pro Options

| Prop         | Type                            | Description                                                                          |
| ------------ | ------------------------------- | ------------------------------------------------------------------------------------ |
| `proOptions` | `{ hideAttribution?: boolean }` | Set `hideAttribution: true` to remove "React Flow" watermark (free version shows it) |

---

## ReactFlowProvider

Wraps your app to provide React Flow context. **Required** if you use hooks outside `<ReactFlow />`.

```tsx
import { ReactFlowProvider } from "@xyflow/react";

// Place OUTSIDE your router for persistence across routes
<ReactFlowProvider>
  <FlowCanvas />
  <Sidebar /> {/* Can use useReactFlow() here */}
</ReactFlowProvider>;
```

---

## Components

### Background

```tsx
import { Background, BackgroundVariant } from "@xyflow/react";

<Background
  variant={BackgroundVariant.Dots} // 'dots' | 'lines' | 'cross'
  gap={16} // Grid gap
  size={1} // Dot/line size
  color="#aaa" // Pattern color
  lineWidth={1} // Line width (lines/cross)
  patternClassName="my-pattern" // Custom class for Tailwind styling
/>;
```

### Controls

```tsx
import { Controls, ControlButton } from "@xyflow/react";
import { Lock } from "lucide-react";

<Controls
  showZoom={true}
  showFitView={true}
  showInteractive={true}
  position="bottom-left" // PanelPosition
  fitViewOptions={{ padding: 0.2, duration: 400 }}
>
  <ControlButton onClick={onLock}>
    <Lock className="h-4 w-4" />
  </ControlButton>
</Controls>;
```

### MiniMap

```tsx
import { MiniMap } from "@xyflow/react";

<MiniMap
  pannable
  zoomable
  nodeColor={(node) => {
    switch (node.type) {
      case "trigger":
        return "#22c55e";
      case "action":
        return "#3b82f6";
      default:
        return "#64748b";
    }
  }}
  nodeStrokeWidth={3}
  maskColor="rgba(0, 0, 0, 0.1)"
  position="bottom-right"
/>;
```

### Panel

```tsx
import { Panel } from "@xyflow/react";

<Panel position="top-left" className="flex gap-2 p-2">
  <button>Save</button>
  <button>Load</button>
</Panel>;
```

**Panel positions**: `'top-left'` | `'top-center'` | `'top-right'` | `'bottom-left'` | `'bottom-center'` | `'bottom-right'`

### Handle

```tsx
import { Handle, Position } from "@xyflow/react";

<Handle
  type="source" // 'source' | 'target'
  position={Position.Right} // Top | Bottom | Left | Right
  id="output-1" // Unique within node
  isConnectable={true}
  isConnectableStart={true} // Can start connections
  isConnectableEnd={true} // Can receive connections
  isValidConnection={(connection) => connection.target !== "forbidden-id"}
  style={{ background: "#555" }}
  className="!bg-blue-500"
/>;
```

### NodeToolbar

```tsx
import { NodeToolbar, Position } from "@xyflow/react";

// Inside your custom node:
<NodeToolbar
  isVisible={selected} // Show when selected
  position={Position.Top} // Toolbar position relative to node
  offset={10} // Distance from node
  align="center" // 'start' | 'center' | 'end'
>
  <button>Edit</button>
  <button>Delete</button>
</NodeToolbar>;
```

### NodeResizer

```tsx
import { NodeResizer, NodeResizeControl } from '@xyflow/react';

// Simple resizer:
<NodeResizer
  minWidth={100}
  minHeight={30}
  isVisible={selected}
  lineClassName="!border-blue-400"
  handleClassName="!w-2 !h-2 !bg-blue-400 !border-white"
/>

// Custom resize control:
<NodeResizeControl
  minWidth={100}
  minHeight={30}
  style={{ background: 'transparent', border: 'none' }}
  position="bottom-right"
>
  <GripHorizontal className="h-3 w-3 text-muted-foreground" />
</NodeResizeControl>
```

### EdgeLabelRenderer

Renders edge labels in the DOM (not SVG). Required for interactive edge labels.

```tsx
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";

function MyEdge({ sourceX, sourceY, targetX, targetY, ...props }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: props.sourcePosition,
    targetX,
    targetY,
    targetPosition: props.targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={props.style}
      />
      <EdgeLabelRenderer>
        {/* Must use absolute positioning + transform */}
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <span className="rounded bg-white px-2 py-1 text-xs shadow">
            Label
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

### EdgeToolbar

Similar to NodeToolbar but for edges:

```tsx
import { EdgeToolbar } from "@xyflow/react";

function MyEdge(props: EdgeProps) {
  return (
    <>
      <BaseEdge path={edgePath} />
      <EdgeToolbar>
        <button>Edit</button>
        <button>Delete</button>
      </EdgeToolbar>
    </>
  );
}
```

### ViewportPortal

Renders elements in the viewport coordinate system (they zoom/pan with the canvas):

```tsx
import { ViewportPortal } from '@xyflow/react';

<ReactFlow ...>
  <ViewportPortal>
    <div style={{ position: 'absolute', left: 100, top: 100 }}>
      This moves with the viewport
    </div>
  </ViewportPortal>
</ReactFlow>
```

### BaseEdge

Low-level edge rendering. Use with path generation utilities:

```tsx
import { BaseEdge, getSmoothStepPath } from "@xyflow/react";

<BaseEdge
  path={edgePath}
  markerEnd={markerEnd}
  style={style}
  interactionWidth={20} // Hover/click target width
/>;
```

---
