# Implementation Plan: Spaceup.ai v3.0 - The Precision Layer

This plan outlines the micro-tasks required to implement **Smart Connections**, **Masking Tools**, and **Collective Context**, transitioning Spaceup.ai from a simple generator to a professional interior design tool.

## User Review Required
> [!IMPORTANT]
> **Magnetic Connectors**: This involves a mathematical shift in how connection lines are drawn in WebGL. Lines will no longer be static; they will snap to the nearest "docking point" on a node's edge.
> **Masking Logic**: We will use a dedicated WebGL texture per node to store bitmask data. This may increase memory usage but ensures pixel-perfect masking for granular AI edits.

---

## Proposed Changes

### 1. Smart Connections (Magnetic & Editable)
**Goal**: Make visual links between nodes interactive and dynamic.

#### [MODIFY] [useAppStore.ts](file:///Users/amanthakur/Documents/Projects%20Ai/56spaceup/src/store/useAppStore.ts)
*   **Micro-tasks**:
    *   [ ] Define `CanvasEdge` type in `AppState` to store connection-specific metadata (prompt, id, status).
    *   [ ] Add `deleteConnection(id)` and `updateConnection(id, content)` actions.

#### [MODIFY] [useWebGLCanvas.ts](file:///Users/amanthakur/Documents/Projects%20Ai/56spaceup/src/hooks/useWebGLCanvas.ts)
*   **Micro-tasks**:
    *   [ ] **Magnetic Logic**: Update line rendering to calculate the shortest path between node bounding boxes, snapping to edge midpoints.
    *   [ ] **Connection Hit Testing**: Implement detection for clicking on a connection line (line-distance threshold).
    *   [ ] **Delete/Edit Trigger**: Emit a signal or update store when a line is "selected."

#### [NEW] [ConnectionUI.tsx](file:///Users/amanthakur/Documents/Projects%20Ai/56spaceup/src/components/Canvas/ConnectionUI.tsx)
*   **Micro-tasks**:
    *   [ ] Create a small floating "Handle" that appears over the connection line when hovered.
    *   [ ] Add "Edit Prompt" and "Delete" buttons to the handle.

---

### 2. Masking Tools (The "Spatial Brush")
**Goal**: Enable granular "In-painting" via a simple brush interface.

#### [MODIFY] [useWebGLCanvas.ts](file:///Users/amanthakur/Documents/Projects%20Ai/56spaceup/src/hooks/useWebGLCanvas.ts)
*   **Micro-tasks**:
    *   [ ] **Brush State**: Add logic to handle a `drawing` mode where pointer moves update a per-node mask texture.
    *   [ ] **Mask Shader**: Implement a simple fragment shader to visualize the "ghostly" brush overlay on the canvas.

#### [MODIFY] [CanvasWrapper.tsx](file:///Users/amanthakur/Documents/Projects%20Ai/56spaceup/src/components/Canvas/CanvasWrapper.tsx)
*   **Micro-tasks**:
    *   [ ] Add "Brush" tool to the floating toolbar.
    *   [ ] Implement a "Comment-on-mask" popover that appears after a brush stroke is completed.

#### [MODIFY] [AgentPanel.tsx](file:///Users/amanthakur/Documents/Projects%20Ai/56spaceup/src/components/layout/AgentPanel.tsx)
*   **Micro-tasks**:
    *   [ ] Update the API payload to include `maskData` (base64) and the specific "Spatial Comment" attached to the mask.

---

### 3. Collective Context (Board Logic)
**Goal**: Group similar images to provide broader AI context.

#### [MODIFY] [useAppStore.ts](file:///Users/amanthakur/Documents/Projects%20Ai/56spaceup/src/store/useAppStore.ts)
*   **Micro-tasks**:
    *   [ ] Add `groupId` to `CanvasNode`.
    *   [ ] Implement `toggleGroup(nodeIds)` to create or dissolve "Boards."

#### [MODIFY] [AgentPanel.tsx](file:///Users/amanthakur/Documents/Projects%20Ai/56spaceup/src/components/layout/AgentPanel.tsx)
*   **Micro-tasks**:
    *   [ ] update context gathering: if a node has a `groupId`, fetch all images in that group and pass them as `reference_images` to Nano Banana.

---

## Verification Plan

### Automated Tests
*   `npm run test:canvas`: (To be created) Verify magnetic snapping math.
*   `npm run test:store`: Verify edge deletion and group updates.

### Manual Verification
1.  **Magnetic Snap**: Drag Node A around Node B; verify the connection line "snaps" to the nearest edge points.
2.  **Brush & Comment**: Use the brush tool on an image -> Add a comment -> Check if the comment appears in the Agent Feed with the mask attached.
3.  **Grouping**: Group 3 swatches -> Select the main node -> Check if the Agent identifies "Context from 3 grouped assets."
