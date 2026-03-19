# Roadmap: Chat-Canvas Interaction & Image Iteration

Plan to enable users to control image iteration from the chat, leveraging the infinite canvas and the Design Tree branching logic.

## 🎯 Vision
The system intelligently bridges the conversational agent with the infinite visual canvas, deciding automatically when to branch and when to refine.

## 🛠 Proposed Changes

### 1. State & Logic
- **`useAppStore.ts`**:
    - Refine `createBranch` logic to ensure precise sibling positioning.
    - Add `updateNodeImage` to support in-place refinements without branching.

### 2. Chat Interface (AgentPanel)
- **Selection Visuals**: The chat panel will explicitly showcase the active context image being discussed.
- **Intelligent Branching**:
    - **Small Tweaks**: Semantic detection of minor edits (e.g., lighting, color grading) will update the current node in-place.
    - **Structural Changes**: Requests for new layouts, furniture swaps, or style pivots will automatically trigger `createBranch`.
- **Message Structure**: Attach the targeted node ID to outgoing agent requests.

### 3. Visual Canvas (CanvasWrapper)
- **Selection Synchronization**: Ensure 100% parity between canvas selection and chat context.
- **Improved Focus**: Highlight the active subject on the canvas when the user is typing in the chat.

## 🚀 MVP Implementation Scope

### What's already done
- `createBranch` basic sibling placement (spacingX/Y overlap avoidance)
- Chat shows active context image thumbnail
- Canvas ↔ Chat selection sync via `activeContext` in Zustand

### What needs to be built (MVP)

#### 1. `updateNodeImage(id, url)` — `useAppStore.ts`
A dedicated store action for in-place image replacement (no new branch). Wraps `updateNode(id, { url })` with clear intent.

#### 2. Keyword-based intent detection — `AgentPanel.tsx`
In `handleSend`, classify the prompt before deciding what to do on the canvas:
- **Tweak keywords** (in-place): `bright`, `dark`, `contrast`, `saturation`, `warm`, `cool`, `exposure`, `shadow`, `highlight`, `tone`, `color`, `hue`, `temperature`
- **Structural keywords** (branch): `style`, `layout`, `baroque`, `modern`, `minimalist`, `furniture`, `room`, `replace`, `redesign`, `new`, `add`, `remove`
- If tweak → call `updateNodeImage(targetNodeId, existingUrl)` (placeholder until real AI)
- If structural or no match → call `createBranch(targetNodeId)` as before

#### 3. Forward node ID + intent in assistant message — `AgentPanel.tsx`
Replace the generic placeholder response with intent-aware confirmation:
- Tweak: `"Refining the current image in-place on node [id]..."`
- Branch: `"Creating a new variation branching from node [id]..."`

### Deferred (not MVP)
- Canvas focus highlight when typing in chat
- `createBranch` multi-generational positioning
- Real AI call integration

## ✅ Verification
1. **Selection Accuracy**: Click context on canvas -> Verify chat updates.
2. **Branch vs Tweak**:
    - Test "Make it brighter" -> Observe in-place update (no new canvas node).
    - Test "Change room to Baroque style" -> Observe new branch creation.
3. **Hierarchy Integrity**: Verify Design Tree lines remain consistent during branching.
